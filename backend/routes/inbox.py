"""
Inbox API - Receive emails via Cloudflare Email Worker webhook,
read/reply/manage from dashboard.
"""
import os
import re
import ssl
import uuid
import base64
import logging
import smtplib
from datetime import datetime, timezone
from email import message_from_bytes, message_from_string
from email.header import decode_header, make_header
from email.message import EmailMessage
from email.utils import parseaddr, parsedate_to_datetime, formataddr, make_msgid
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Header, Query, Body, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/inbox", tags=["inbox"])

# State (set by server.py)
_db = None
_admin_verifier = None  # callable(credentials) -> admin dict or None
INBOX_WEBHOOK_TOKEN = os.environ.get("INBOX_WEBHOOK_TOKEN", "")
SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.transip.email")
SMTP_PORT = int(os.environ.get("SMTP_PORT", 465))
SMTP_USER = os.environ.get("SMTP_USER", "info@droomvriendjes.com")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
SMTP_FROM = os.environ.get("SMTP_FROM", "info@droomvriendjes.com")

FOLDERS = ["inbox", "sent", "drafts", "trash", "spam"]

# Knowledge base fed to the AI when drafting inbox replies (from the B2B brochure).
# The AI must use ONLY these facts and never invent specifications.
INBOX_AI_KB = """
=== KENNISBANK DROOMVRIENDJES (gebruik uitsluitend deze feiten) ===
Over: Droomvriendjes maakt slimme slaaphulpen (knuffels met nachtlampje, projector en geluid) voor kinderen van 0 tot 6 jaar.

PRODUCTEN & PRIJZEN (consumentenprijs):
- Slimme Leeuw — € 49,95 (met AI-huilsensor & projector)
- Slaperig Schaapje — € 54,95 (projector & 60 melodieën)
- Slaperige Panda — € 54,95 (projector & 60 melodieën)
- Stoere Dinosaurus — € 54,95 (projector & 60 melodieën)
- Magische Eenhoorn — € 54,95 (projector & 60 melodieën)
- Bruine Beertje — € 49,95 (sterrenprojector & slaapgeluiden)
- Liggend Schaapje — € 49,95 (sterrenprojectie & slaapmelodieën)
- Pinguïn Droomvriendje — € 49,95 (sterrenprojector & witte ruis)
- Grijze Teddybeer — € 49,95 (premium nachtlampje met projector & melodieën)
- Duo Set: Liggend Schaapje & Witte Beer — € 89,95 (met projector)

TECHNISCHE SPECIFICATIES (gelden voor de Droomvriendjes-lijn):
- Afmetingen: 22 × 18 × 14 cm; gewicht 340 gram
- Accu: ingebouwde Li-ion 2200 mAh; gebruiksduur 8–12 uur per lading
- Opladen: ca. 2 uur via USB-C
- Bluetooth 5.0; app iOS 14+ / Android 10+
- Licht: LED, 5–120 lux traploos dimbaar, kleurtemperatuur 2700K–6500K instelbaar
- Geluid: 30–65 dB instelbaar; opties witte ruis, roze ruis, oceaan, hartslag, melodie
- Timers: 15 min / 30 min / 1 uur / nachtlamp-modus
- Materiaal hoes: 100% biologisch katoen, uitwasbaar op 30 °C; BPA-vrij
- Certificeringen: CE, EN 71, RoHS, REACH
- Garantie: 2 jaar fabrieksgarantie op elektronische componenten
- Geschikt vanaf de geboorte t/m 6 jaar

LEVERING & RETOUR:
- Levertijd Nederland: 3–5 werkdagen; België/Duitsland: 5–7 werkdagen
- Retourneren binnen 14 dagen na ontvangst (ongebruikt, originele verpakking)
- Bij productiefout: gratis omruil of terugbetaling

ZAKELIJK (B2B): partners kunnen terecht via partners@droomvriendjes.com voor staffelkortingen en samenwerking.
Klantenservice: info@droomvriendjes.com
=== EINDE KENNISBANK ===
"""

_security = HTTPBearer(auto_error=False)


def set_database(database):
    global _db
    _db = database


def set_admin_verifier(verifier):
    """Inject admin token verifier from server.py"""
    global _admin_verifier
    _admin_verifier = verifier


def _require_admin(credentials: HTTPAuthorizationCredentials = Depends(_security)):
    if _admin_verifier is None:
        raise HTTPException(status_code=500, detail="Admin verifier not configured")
    admin = _admin_verifier(credentials)
    if not admin:
        raise HTTPException(status_code=401, detail="Niet geautoriseerd")
    return admin


def _decode_str(s) -> str:
    if not s:
        return ""
    try:
        return str(make_header(decode_header(s)))
    except Exception:
        return str(s)


def _strip_html(html: str) -> str:
    if not html:
        return ""
    text = re.sub(r"<[^>]+>", " ", html)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _parse_addrs(value: str) -> List[dict]:
    """Parse a comma-separated address list into [{name, email}]"""
    if not value:
        return []
    out = []
    for part in re.split(r",\s*(?![^<>]*>)", value):
        name, email = parseaddr(part)
        if email:
            out.append({"name": _decode_str(name), "email": email.lower()})
    return out


def _parse_mime(raw_bytes: bytes) -> dict:
    """Parse raw MIME email to structured dict."""
    msg = message_from_bytes(raw_bytes)
    subject = _decode_str(msg.get("Subject", ""))
    from_name, from_email = parseaddr(msg.get("From", ""))
    from_name = _decode_str(from_name)
    to = _parse_addrs(msg.get("To", ""))
    cc = _parse_addrs(msg.get("Cc", ""))
    message_id = (msg.get("Message-ID") or make_msgid(domain="droomvriendjes.com")).strip()
    in_reply_to = (msg.get("In-Reply-To") or "").strip() or None
    references = (msg.get("References") or "").strip() or None

    date_hdr = msg.get("Date")
    try:
        received_at = parsedate_to_datetime(date_hdr).astimezone(timezone.utc) if date_hdr else datetime.now(timezone.utc)
    except Exception:
        received_at = datetime.now(timezone.utc)

    body_text = ""
    body_html = ""
    attachments = []

    if msg.is_multipart():
        for part in msg.walk():
            ctype = part.get_content_type()
            disp = (part.get("Content-Disposition") or "").lower()
            if "attachment" in disp:
                payload = part.get_payload(decode=True) or b""
                attachments.append({
                    "filename": _decode_str(part.get_filename() or "attachment"),
                    "content_type": ctype,
                    "size": len(payload),
                })
                continue
            if ctype == "text/plain" and not body_text:
                try:
                    body_text = (part.get_payload(decode=True) or b"").decode(part.get_content_charset() or "utf-8", errors="replace")
                except Exception:
                    body_text = ""
            elif ctype == "text/html" and not body_html:
                try:
                    body_html = (part.get_payload(decode=True) or b"").decode(part.get_content_charset() or "utf-8", errors="replace")
                except Exception:
                    body_html = ""
    else:
        ctype = msg.get_content_type()
        try:
            payload = (msg.get_payload(decode=True) or b"").decode(msg.get_content_charset() or "utf-8", errors="replace")
        except Exception:
            payload = ""
        if ctype == "text/html":
            body_html = payload
        else:
            body_text = payload

    if not body_text and body_html:
        body_text = _strip_html(body_html)

    snippet = (body_text or "")[:200].strip()
    thread_id = (references.split()[0] if references else None) or in_reply_to or message_id

    return {
        "message_id": message_id,
        "from_email": (from_email or "").lower(),
        "from_name": from_name,
        "to": to,
        "cc": cc,
        "subject": subject,
        "body_text": body_text,
        "body_html": body_html,
        "snippet": snippet,
        "attachments": attachments,
        "received_at": received_at,
        "in_reply_to": in_reply_to,
        "references": references,
        "thread_id": thread_id,
    }


# =========== Models ===========

class WebhookPayload(BaseModel):
    raw_b64: Optional[str] = None  # base64-encoded raw RFC822
    raw: Optional[str] = None      # raw RFC822 string
    from_addr: Optional[str] = Field(default=None, alias="from")
    to: Optional[str] = None


class PatchMessage(BaseModel):
    read: Optional[bool] = None
    starred: Optional[bool] = None
    folder: Optional[str] = None
    labels: Optional[List[str]] = None
    add_label: Optional[str] = None
    remove_label: Optional[str] = None


class Attachment(BaseModel):
    filename: str
    content: str            # base64-encoded file content (no data: prefix)
    content_type: Optional[str] = None
    size: Optional[int] = None  # raw bytes (optional, for display/limits)


class ReplyPayload(BaseModel):
    body_html: str
    body_text: Optional[str] = None
    subject: Optional[str] = None
    to: Optional[List[str]] = None
    cc: Optional[List[str]] = None
    attachments: Optional[List[Attachment]] = None


class ComposePayload(BaseModel):
    to: List[str]
    cc: Optional[List[str]] = None
    bcc: Optional[List[str]] = None
    subject: str
    body_html: str
    body_text: Optional[str] = None
    attachments: Optional[List[Attachment]] = None


# =========== Helpers ===========

def _doc_to_dict(doc) -> dict:
    if not doc:
        return None
    doc.pop("_id", None)
    if isinstance(doc.get("received_at"), datetime):
        doc["received_at"] = doc["received_at"].isoformat()
    if isinstance(doc.get("sent_at"), datetime):
        doc["sent_at"] = doc["sent_at"].isoformat()
    return doc


def _send_smtp(to_emails: List[str], subject: str, body_html: str, body_text: str,
               cc_emails: List[str] = None, bcc_emails: List[str] = None,
               in_reply_to: str = None, references: str = None,
               attachments: List[dict] = None) -> dict:
    """Send via Resend (function name kept for backwards compat).

    A branded Droomvriendjes signature is appended to every inbox reply/compose,
    then the body is wrapped in a mobile-first, high-contrast e-mail shell.
    Transactional order mails use their own templates and are unaffected.
    """
    from services.email_sender import send_email as resend_send
    from services.email_signature import append_signature
    from services.email_wrapper import wrap_email

    signed_html, signed_text = append_signature(
        body_html, body_text or _strip_html(body_html)
    )
    signed_html = wrap_email(signed_html)

    result = resend_send(
        to_email=to_emails,
        subject=subject,
        html_content=signed_html,
        text_content=signed_text,
        cc=cc_emails,
        bcc=bcc_emails,
        in_reply_to=in_reply_to,
        references=references,
        attachments=attachments or None,
    )
    if not result["success"]:
        raise HTTPException(status_code=502, detail=f"E-mail verzenden mislukt: {result.get('error', 'onbekende fout')}")
    return {"message_id": result.get("message_id") or result.get("id") or ""}


# Max total attachment size (base64-inflated payload stays well under proxy limits)
MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024  # 15 MB total raw


def _prepare_attachments(items: Optional[List["Attachment"]]):
    """Validate + split into (resend_payload, stored_metadata)."""
    if not items:
        return None, []
    resend_payload = []
    metadata = []
    total = 0
    for a in items:
        raw_len = a.size or int(len(a.content) * 3 / 4)
        total += raw_len
        if total > MAX_ATTACHMENT_BYTES:
            raise HTTPException(status_code=413, detail="Bijlagen samen te groot (max 15 MB).")
        resend_payload.append({"filename": a.filename, "content": a.content})
        metadata.append({
            "filename": a.filename,
            "content_type": a.content_type or "application/octet-stream",
            "size": raw_len,
        })
    return resend_payload, metadata


# =========== Webhook ===========

async def _alert(source, message, detail=None, level="error", meta=None):
    """Log a human-readable system alert (best-effort, never raises)."""
    try:
        from routes.system_alerts import log_alert
        await log_alert(source, message, detail=detail, level=level, meta=meta)
    except Exception as exc:
        logger.warning(f"Kon system alert niet loggen: {exc}")


@router.post("/webhook")
async def webhook(payload: WebhookPayload, authorization: Optional[str] = Header(None)):
    """Receive parsed/raw email from Cloudflare Email Worker."""
    if not INBOX_WEBHOOK_TOKEN:
        raise HTTPException(status_code=500, detail="Webhook token not configured")
    if authorization != f"Bearer {INBOX_WEBHOOK_TOKEN}":
        raise HTTPException(status_code=401, detail="Unauthorized")
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    if payload.raw_b64:
        try:
            raw = base64.b64decode(payload.raw_b64)
        except Exception as exc:
            await _alert(
                "inbox_webhook",
                "Een inkomende e-mail kon niet worden gedecodeerd (corrupte base64-payload). Het bericht is niet opgeslagen.",
                detail=str(exc), level="error",
                meta={"from": payload.from_addr, "to": payload.to},
            )
            raise HTTPException(status_code=400, detail="Invalid raw_b64")
    elif payload.raw:
        raw = payload.raw.encode("utf-8", errors="replace")
    else:
        await _alert(
            "inbox_webhook",
            "Een inkomende e-mail kwam binnen zonder inhoud (geen raw/raw_b64). Mogelijk een lege of corrupte payload.",
            detail=f"from={payload.from_addr}, to={payload.to}", level="warning",
        )
        raise HTTPException(status_code=400, detail="Missing raw email")

    try:
        parsed = _parse_mime(raw)
    except Exception as exc:
        await _alert(
            "inbox_webhook",
            "Een inkomende e-mail kon niet worden verwerkt (parsing mislukt). Controleer de afzender of bijlage.",
            detail=str(exc), level="error",
            meta={"from": payload.from_addr, "to": payload.to},
        )
        raise HTTPException(status_code=422, detail="Kon e-mail niet verwerken")

    # Dedupe by message_id
    existing = await _db.inbox_messages.find_one({"message_id": parsed["message_id"]})
    if existing:
        return {"status": "duplicate", "id": existing.get("id")}

    # Waarschuw als er geen leesbare tekst in zit (alleen bijlage / lege body)
    if not (parsed.get("body_text") or parsed.get("body_html")):
        await _alert(
            "inbox_webhook",
            f"Inkomende e-mail '{parsed.get('subject') or '(geen onderwerp)'}' van {parsed.get('from_email') or 'onbekend'} bevat geen leesbare tekst (mogelijk alleen een bijlage of lege body).",
            level="warning",
            meta={"from": parsed.get("from_email"), "subject": parsed.get("subject")},
        )

    doc = {
        "id": str(uuid.uuid4()),
        **parsed,
        "folder": "inbox",
        "labels": [],
        "read": False,
        "starred": False,
        "created_at": datetime.now(timezone.utc),
    }
    await _db.inbox_messages.insert_one(doc)
    logger.info(f"📥 Inbox: stored email '{parsed['subject']}' from {parsed['from_email']}")
    return {"status": "ok", "id": doc["id"]}


# =========== List / Get / Mutate ===========

@router.get("/folders")
async def list_folders(admin=Depends(_require_admin)):
    """Counts per folder + unread count + labels."""
    if _db is None:
        raise HTTPException(status_code=500, detail="DB unavailable")
    counts = {}
    for f in FOLDERS:
        total = await _db.inbox_messages.count_documents({"folder": f})
        unread = await _db.inbox_messages.count_documents({"folder": f, "read": False}) if f == "inbox" else 0
        counts[f] = {"total": total, "unread": unread}
    # Distinct labels
    labels = await _db.inbox_messages.distinct("labels")
    labels = sorted([lb for lb in labels if lb])
    return {"folders": counts, "labels": labels}


@router.get("")
async def list_messages(
    folder: str = Query("inbox"),
    label: Optional[str] = None,
    q: Optional[str] = None,
    unread: Optional[bool] = None,
    starred: Optional[bool] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    admin=Depends(_require_admin),
):
    if _db is None:
        raise HTTPException(status_code=500, detail="DB unavailable")
    if folder not in FOLDERS:
        raise HTTPException(status_code=400, detail="Invalid folder")

    query = {"folder": folder}
    if label:
        query["labels"] = label
    if unread is not None:
        query["read"] = not unread
    if starred is not None:
        query["starred"] = starred
    if q:
        regex = {"$regex": re.escape(q), "$options": "i"}
        query["$or"] = [
            {"subject": regex},
            {"from_email": regex},
            {"from_name": regex},
            {"snippet": regex},
            {"body_text": regex},
        ]

    total = await _db.inbox_messages.count_documents(query)
    cursor = (
        _db.inbox_messages.find(query, {"body_html": 0, "body_text": 0})
        .sort("received_at", -1)
        .skip((page - 1) * limit)
        .limit(limit)
    )
    items = [_doc_to_dict(d) async for d in cursor]
    return {"total": total, "page": page, "limit": limit, "items": items}


@router.get("/{message_id}")
async def get_message(message_id: str, admin=Depends(_require_admin)):
    if _db is None:
        raise HTTPException(status_code=500, detail="DB unavailable")
    doc = await _db.inbox_messages.find_one({"id": message_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return _doc_to_dict(doc)


@router.patch("/{message_id}")
async def patch_message(message_id: str, patch: PatchMessage, admin=Depends(_require_admin)):
    if _db is None:
        raise HTTPException(status_code=500, detail="DB unavailable")
    doc = await _db.inbox_messages.find_one({"id": message_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")

    updates = {}
    if patch.read is not None:
        updates["read"] = patch.read
    if patch.starred is not None:
        updates["starred"] = patch.starred
    if patch.folder is not None:
        if patch.folder not in FOLDERS:
            raise HTTPException(status_code=400, detail="Invalid folder")
        updates["folder"] = patch.folder
    if patch.labels is not None:
        updates["labels"] = list({lb for lb in patch.labels if lb})

    if updates:
        await _db.inbox_messages.update_one({"id": message_id}, {"$set": updates})
    if patch.add_label:
        await _db.inbox_messages.update_one({"id": message_id}, {"$addToSet": {"labels": patch.add_label}})
    if patch.remove_label:
        await _db.inbox_messages.update_one({"id": message_id}, {"$pull": {"labels": patch.remove_label}})

    doc = await _db.inbox_messages.find_one({"id": message_id})
    return _doc_to_dict(doc)


@router.delete("/{message_id}")
async def delete_message(message_id: str, hard: bool = False, admin=Depends(_require_admin)):
    """Move to trash; if hard=true and already in trash, delete permanently."""
    if _db is None:
        raise HTTPException(status_code=500, detail="DB unavailable")
    doc = await _db.inbox_messages.find_one({"id": message_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")

    if hard or doc.get("folder") == "trash":
        await _db.inbox_messages.delete_one({"id": message_id})
        return {"status": "deleted"}
    await _db.inbox_messages.update_one({"id": message_id}, {"$set": {"folder": "trash"}})
    return {"status": "moved_to_trash"}


# =========== Send / Reply / Compose ===========

@router.post("/{message_id}/reply")
async def reply_message(message_id: str, payload: ReplyPayload, admin=Depends(_require_admin)):
    if _db is None:
        raise HTTPException(status_code=500, detail="DB unavailable")
    original = await _db.inbox_messages.find_one({"id": message_id})
    if not original:
        raise HTTPException(status_code=404, detail="Original message not found")

    to_emails = payload.to or [original.get("from_email")]
    to_emails = [t for t in to_emails if t]
    if not to_emails:
        raise HTTPException(status_code=400, detail="No recipient")

    subject = payload.subject or (
        original.get("subject", "") if (original.get("subject", "") or "").lower().startswith("re:")
        else f"Re: {original.get('subject', '')}"
    )

    in_reply_to = original.get("message_id")
    references_field = original.get("references") or ""
    refs = (references_field + " " + in_reply_to).strip() if in_reply_to else references_field

    resend_atts, att_meta = _prepare_attachments(payload.attachments)
    sent = _send_smtp(
        to_emails=to_emails,
        subject=subject,
        body_html=payload.body_html,
        body_text=payload.body_text or _strip_html(payload.body_html),
        cc_emails=payload.cc,
        in_reply_to=in_reply_to,
        references=refs,
        attachments=resend_atts,
    )

    now = datetime.now(timezone.utc)
    doc = {
        "id": str(uuid.uuid4()),
        "message_id": sent["message_id"],
        "from_email": SMTP_FROM.lower(),
        "from_name": "Droomvriendjes",
        "to": [{"name": "", "email": e} for e in to_emails],
        "cc": [{"name": "", "email": e} for e in (payload.cc or [])],
        "subject": subject,
        "body_html": payload.body_html,
        "body_text": payload.body_text or _strip_html(payload.body_html),
        "snippet": _strip_html(payload.body_html)[:200],
        "attachments": att_meta,
        "received_at": now,
        "sent_at": now,
        "folder": "sent",
        "labels": [],
        "read": True,
        "starred": False,
        "in_reply_to": in_reply_to,
        "references": refs,
        "thread_id": original.get("thread_id") or in_reply_to,
        "created_at": now,
    }
    await _db.inbox_messages.insert_one(doc)
    return _doc_to_dict(doc)


@router.post("/compose")
async def compose_message(payload: ComposePayload, admin=Depends(_require_admin)):
    if _db is None:
        raise HTTPException(status_code=500, detail="DB unavailable")
    if not payload.to:
        raise HTTPException(status_code=400, detail="No recipient")

    resend_atts, att_meta = _prepare_attachments(payload.attachments)
    sent = _send_smtp(
        to_emails=payload.to,
        subject=payload.subject,
        body_html=payload.body_html,
        body_text=payload.body_text or _strip_html(payload.body_html),
        cc_emails=payload.cc,
        bcc_emails=payload.bcc,
        attachments=resend_atts,
    )

    now = datetime.now(timezone.utc)
    doc = {
        "id": str(uuid.uuid4()),
        "message_id": sent["message_id"],
        "from_email": SMTP_FROM.lower(),
        "from_name": "Droomvriendjes",
        "to": [{"name": "", "email": e} for e in payload.to],
        "cc": [{"name": "", "email": e} for e in (payload.cc or [])],
        "subject": payload.subject,
        "body_html": payload.body_html,
        "body_text": payload.body_text or _strip_html(payload.body_html),
        "snippet": _strip_html(payload.body_html)[:200],
        "attachments": att_meta,
        "received_at": now,
        "sent_at": now,
        "folder": "sent",
        "labels": [],
        "read": True,
        "starred": False,
        "thread_id": sent["message_id"],
        "created_at": now,
    }
    await _db.inbox_messages.insert_one(doc)
    return _doc_to_dict(doc)


# =========== AI Smart Assist (human-in-the-loop draft) ===========

@router.post("/{message_id}/ai-draft")
async def ai_draft_reply(message_id: str, admin=Depends(_require_admin)):
    """Generate a CONCEPT reply using GPT-5.2 + the brochure knowledge base.

    The draft is returned to the editor only — it is NEVER sent automatically.
    A human reviews, edits and clicks send.
    """
    if _db is None:
        raise HTTPException(status_code=500, detail="DB unavailable")
    msg = await _db.inbox_messages.find_one({"id": message_id})
    if not msg:
        raise HTTPException(status_code=404, detail="Bericht niet gevonden")
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="AI niet geconfigureerd (EMERGENT_LLM_KEY ontbreekt)")

    customer_name = (msg.get("from_name") or "").strip()
    first_name = customer_name.split(" ")[0] if customer_name else ""
    subject = msg.get("subject") or ""
    incoming = (msg.get("body_text") or _strip_html(msg.get("body_html") or ""))[:3500]

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        system_message = (
            "Je bent een warme, behulpzame en professionele klantenservice-medewerker van Droomvriendjes. "
            "Schrijf een concept-antwoord op de klantmail. Regels: "
            "(1) Antwoord in de taal van de klant (standaard Nederlands). "
            "(2) Gebruik UITSLUITEND de feiten uit de kennisbank; verzin nooit prijzen of specificaties. "
            "Weet je iets niet zeker, beloof dan het uit te zoeken in plaats van te gokken. "
            "(3) Spreek de klant aan met de voornaam indien bekend. "
            "(4) Wees concreet, vriendelijk en to-the-point. "
            "(5) Voeg GEEN handtekening of afsluiting met bedrijfsnaam toe — die wordt automatisch toegevoegd. "
            "Eindig met een korte, vriendelijke afsluitzin (bijv. 'Hartelijke groet')."
            + INBOX_AI_KB
        )
        prompt = (
            f"Onderwerp van de klantmail: {subject}\n"
            f"Naam klant: {customer_name or 'onbekend'} (voornaam: {first_name or '-'})\n\n"
            f"Bericht van de klant:\n\"\"\"\n{incoming}\n\"\"\"\n\n"
            "Schrijf nu een passend, behulpzaam concept-antwoord."
        )
        chat = LlmChat(
            api_key=api_key,
            session_id=f"inbox-{message_id}",
            system_message=system_message,
        ).with_model("openai", "gpt-5.2")
        resp = await chat.send_message(UserMessage(text=prompt))
        draft = (resp or "").strip()
        if not draft:
            raise HTTPException(status_code=502, detail="AI gaf een leeg antwoord terug")
        return {"draft": draft}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("AI inbox draft faalde")
        raise HTTPException(status_code=502, detail=f"AI-concept mislukt: {exc}")

@router.post("/dev/ingest-raw")
async def dev_ingest_raw(raw: str = Body(..., embed=True), admin=Depends(_require_admin)):
    """For testing: paste a raw RFC822 email; stores it as if received via webhook."""
    if _db is None:
        raise HTTPException(status_code=500, detail="DB unavailable")
    parsed = _parse_mime(raw.encode("utf-8", errors="replace"))
    existing = await _db.inbox_messages.find_one({"message_id": parsed["message_id"]})
    if existing:
        return {"status": "duplicate", "id": existing.get("id")}
    doc = {
        "id": str(uuid.uuid4()),
        **parsed,
        "folder": "inbox",
        "labels": [],
        "read": False,
        "starred": False,
        "created_at": datetime.now(timezone.utc),
    }
    await _db.inbox_messages.insert_one(doc)
    return {"status": "ok", "id": doc["id"]}
