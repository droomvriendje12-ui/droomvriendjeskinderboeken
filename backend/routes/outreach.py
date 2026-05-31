"""
Leads Bestorming — B2B outreach CRM for Droomvriendjes.

Manages curated outreach leads (slaapcoach / influencer / winkel), per-type
editable email templates, optional GPT per-lead personalization, bulk sending
via Resend with Sent/Opened status tracking, notes and per-row deletion.

Data isolation: every lead keeps a unique id; name/email/details never mix.
"""
import os
import csv
import io
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/outreach", tags=["outreach"])

_db = None
_admin_verifier = None
_security = HTTPBearer(auto_error=False)

SITE_URL = os.environ.get("SITE_URL", "").rstrip("/")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "info@droomvriendjes.com")

# 1x1 transparent GIF
_PIXEL = bytes.fromhex("47494638396101000100800000ffffff00000021f90401000000002c00000000010001000002024401003b")

VALID_TYPES = {"slaapcoach", "influencer", "winkel"}
STATUSES = {"New", "Sent", "Opened", "Replied", "Bounced"}


def set_database(database):
    global _db
    _db = database


def set_admin_verifier(verifier):
    global _admin_verifier
    _admin_verifier = verifier


def _require_admin(credentials: HTTPAuthorizationCredentials = Depends(_security)):
    if _admin_verifier is None:
        raise HTTPException(status_code=500, detail="Admin verifier not configured")
    admin = _admin_verifier(credentials)
    if not admin:
        raise HTTPException(status_code=401, detail="Niet geautoriseerd")
    return admin


# ---------------------------------------------------------------- templates
DEFAULT_TEMPLATES = {
    "slaapcoach": {
        "subject": "Samenwerken? Droomvriendjes voor jouw slaapcoaching",
        "body": (
            "Hoi {{Naam}},\n\n"
            "Wat fijn dat jij ouders helpt aan betere nachten! Ik ben van Droomvriendjes — wij maken "
            "knuffels met een zacht nachtlampje en rustgevend white noise, speciaal om kinderen te helpen "
            "ontspannen en doorslapen.\n\n"
            "Ik denk dat onze knuffel prachtig past bij jouw slaaptrajecten als rustgevend hulpmiddel. "
            "Graag stuur ik je vrijblijvend een exemplaar op om zelf te ervaren. Daarnaast werken we graag "
            "samen via een persoonlijke kortingscode voor jouw klanten (en een aantrekkelijke vergoeding voor jou).\n\n"
            "Heb je interesse? Dan stuur ik je de details. Ik hoor het graag!\n\n"
            "Hartelijke groet,\nTeam Droomvriendjes"
        ),
    },
    "influencer": {
        "subject": "Leuke samenwerking? Droomvriendjes ❤️ jouw kanaal",
        "body": (
            "Hoi {{Naam}},\n\n"
            "Ik volg jouw content met plezier — jouw eerlijke en warme verhalen over het mama-leven sluiten "
            "mooi aan bij waar wij voor staan. Ik ben van Droomvriendjes: knuffels met een zacht nachtlampje "
            "en white noise die kinderen helpen om rustig in slaap te vallen.\n\n"
            "Ik zou je graag vrijblijvend een knuffel cadeau doen, zodat jij (en je kindje) hem kunnen uitproberen. "
            "Als hij bevalt, vinden we het super als je hem deelt met je volgers — en we denken graag mee over een "
            "leuke actie of kortingscode voor jouw community.\n\n"
            "Lijkt je dit wat? Laat het me weten, dan stuur ik snel een knuffel jouw kant op!\n\n"
            "Hartelijke groet,\nTeam Droomvriendjes"
        ),
    },
    "winkel": {
        "subject": "Droomvriendjes in jullie assortiment? (zakelijk)",
        "body": (
            "Hoi {{Naam}},\n\n"
            "Wat een mooie winkel hebben jullie! Ik ben van Droomvriendjes — wij maken knuffels met een zacht "
            "nachtlampje en rustgevend white noise die kinderen helpen beter te slapen. Ze zijn populair bij "
            "ouders en lenen zich uitstekend als cadeau.\n\n"
            "Ik denk dat onze producten goed bij jullie assortiment passen. Graag vertel ik jullie meer over onze "
            "inkoopvoorwaarden en marges voor wederverkopers, en stuur ik vrijblijvend een sample op.\n\n"
            "Zullen we even kennismaken? Ik hoor graag of er interesse is!\n\n"
            "Hartelijke groet,\nTeam Droomvriendjes"
        ),
    },
}


async def _seed_templates():
    for t, data in DEFAULT_TEMPLATES.items():
        existing = await _db.outreach_templates.find_one({"type": t})
        if not existing:
            await _db.outreach_templates.insert_one({
                "type": t, "subject": data["subject"], "body": data["body"],
                "updated_at": datetime.now(timezone.utc).isoformat(),
            })


def _lead_out(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


# ---------------------------------------------------------------- import
@router.post("/import")
async def import_leads(file: UploadFile = File(...), _admin=Depends(_require_admin)):
    """Import the leads CSV (columns: Naam, Type, E-mailadres, Details). Adds new leads only."""
    if _db is None:
        raise HTTPException(status_code=500, detail="DB unavailable")
    raw = await file.read()
    try:
        text = raw.decode("utf-8-sig")
    except Exception:
        text = raw.decode("latin-1")
    reader = csv.DictReader(io.StringIO(text))

    existing = await _db.outreach_leads.find({}, {"naam": 1, "email": 1}).to_list(length=10000)
    seen = {(r.get("naam", ""), (r.get("email") or "").lower()) for r in existing}
    last = await _db.outreach_leads.find_one({}, sort=[("seq", -1)])
    seq = (last.get("seq", 0) if last else 0)

    added = 0
    now = datetime.now(timezone.utc).isoformat()
    for row in reader:
        naam = (row.get("Naam") or "").strip()
        email = (row.get("E-mailadres") or row.get("Email") or "").strip()
        ltype = (row.get("Type") or "").strip().lower()
        details = (row.get("Details") or "").strip()
        if not naam and not email:
            continue
        key = (naam, email.lower())
        if key in seen:
            continue
        seen.add(key)
        seq += 1
        await _db.outreach_leads.insert_one({
            "id": str(uuid.uuid4()),
            "seq": seq,
            "naam": naam,
            "type": ltype if ltype in VALID_TYPES else (ltype or "overig"),
            "email": email,
            "email_valid": "@" in email,
            "details": details,
            "status": "New",
            "date_contacted": None,
            "opened_at": None,
            "notes": "",
            "custom_email": None,
            "created_at": now,
        })
        added += 1
    return {"added": added, "total": await _db.outreach_leads.count_documents({})}


# ---------------------------------------------------------------- list / stats
@router.get("/leads")
async def list_leads(type: Optional[str] = None, status: Optional[str] = None,
                     search: Optional[str] = None, skip: int = 0, limit: int = 100,
                     _admin=Depends(_require_admin)):
    if _db is None:
        raise HTTPException(status_code=500, detail="DB unavailable")
    query = {}
    if type:
        query["type"] = type
    if status:
        query["status"] = status
    if search and search.strip():
        rx = {"$regex": search.strip(), "$options": "i"}
        query["$or"] = [{"naam": rx}, {"email": rx}, {"details": rx}]
    limit = max(1, min(limit, 500))
    cursor = _db.outreach_leads.find(query).sort("seq", 1).skip(max(0, skip)).limit(limit)
    items = [_lead_out(d) for d in await cursor.to_list(length=limit)]
    total = await _db.outreach_leads.count_documents(query)
    return {"items": items, "total": total, "skip": skip, "limit": limit}


@router.get("/stats")
async def stats(_admin=Depends(_require_admin)):
    if _db is None:
        raise HTTPException(status_code=500, detail="DB unavailable")
    by_type = await _db.outreach_leads.aggregate([
        {"$group": {"_id": "$type", "count": {"$sum": 1}}},
    ]).to_list(length=50)
    by_status = await _db.outreach_leads.aggregate([
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
    ]).to_list(length=50)
    total = await _db.outreach_leads.count_documents({})
    no_email = await _db.outreach_leads.count_documents({"email_valid": False})
    return {
        "total": total,
        "no_email": no_email,
        "by_type": {x["_id"]: x["count"] for x in by_type},
        "by_status": {x["_id"]: x["count"] for x in by_status},
    }


# ---------------------------------------------------------------- update / delete
class LeadUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    custom_subject: Optional[str] = None
    custom_body: Optional[str] = None


@router.put("/leads/{lead_id}")
async def update_lead(lead_id: str, payload: LeadUpdate, _admin=Depends(_require_admin)):
    update = {}
    if payload.status is not None:
        if payload.status not in STATUSES:
            raise HTTPException(status_code=400, detail="Ongeldige status")
        update["status"] = payload.status
    if payload.notes is not None:
        update["notes"] = payload.notes
    if payload.custom_subject is not None or payload.custom_body is not None:
        lead = await _db.outreach_leads.find_one({"id": lead_id})
        if not lead:
            raise HTTPException(status_code=404, detail="Lead niet gevonden")
        ce = lead.get("custom_email") or {}
        if payload.custom_subject is not None:
            ce["subject"] = payload.custom_subject
        if payload.custom_body is not None:
            ce["body"] = payload.custom_body
        update["custom_email"] = ce
    if not update:
        raise HTTPException(status_code=400, detail="Niets om bij te werken")
    res = await _db.outreach_leads.update_one({"id": lead_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead niet gevonden")
    return _lead_out(await _db.outreach_leads.find_one({"id": lead_id}))


@router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, _admin=Depends(_require_admin)):
    res = await _db.outreach_leads.delete_one({"id": lead_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead niet gevonden")
    return {"status": "deleted"}


class BulkIds(BaseModel):
    ids: List[str]


@router.post("/leads/bulk-delete")
async def bulk_delete(payload: BulkIds, _admin=Depends(_require_admin)):
    res = await _db.outreach_leads.delete_many({"id": {"$in": payload.ids}})
    return {"deleted": res.deleted_count}


# ---------------------------------------------------------------- templates
@router.get("/templates")
async def get_templates(_admin=Depends(_require_admin)):
    await _seed_templates()
    docs = await _db.outreach_templates.find({}, {"_id": 0}).to_list(length=20)
    return {"templates": docs}


class TemplateUpdate(BaseModel):
    subject: str
    body: str


@router.put("/templates/{type}")
async def update_template(type: str, payload: TemplateUpdate, _admin=Depends(_require_admin)):
    await _db.outreach_templates.update_one(
        {"type": type},
        {"$set": {"subject": payload.subject, "body": payload.body,
                  "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    return {"status": "ok"}


# ---------------------------------------------------------------- AI draft
@router.post("/leads/{lead_id}/ai-draft")
async def ai_draft(lead_id: str, _admin=Depends(_require_admin)):
    lead = await _db.outreach_leads.find_one({"id": lead_id})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead niet gevonden")
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="AI niet geconfigureerd (EMERGENT_LLM_KEY ontbreekt)")
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        system_message = (
            "Je bent een Nederlandse outreach-copywriter voor Droomvriendjes, een webshop in slaapknuffels "
            "met zacht nachtlampje en white noise voor kinderen. Schrijf warme, professionele, persoonlijke "
            "B2B-outreachmails die uitnodigen tot samenwerking. Kort, oprecht, geen overdreven verkooppraat, "
            "geen valse claims. Spreek de persoon aan met de voornaam."
        )
        prompt = (
            f"Schrijf een korte, persoonlijke outreachmail in het Nederlands.\n"
            f"Naam ontvanger: {lead.get('naam')}\n"
            f"Type contact: {lead.get('type')}\n"
            f"Context/details over deze persoon: {lead.get('details')}\n\n"
            f"Verwerk de context subtiel zodat het persoonlijk voelt. Doel: kennismaken en samenwerken "
            f"(slaapcoach=aanbevelen bij klanten + sample/affiliate; influencer=knuffel cadeau voor post; "
            f"winkel=inkoop/wederverkoop). Gebruik {{{{Naam}}}} NIET — schrijf de echte naam uit.\n"
            f"Antwoord exact in dit formaat op aparte regels:\n"
            f"ONDERWERP: <pakkend onderwerp>\n"
            f"BODY: <de mailtekst, eindig met 'Hartelijke groet,\\nTeam Droomvriendjes'>"
        )
        chat = LlmChat(
            api_key=api_key,
            session_id=f"outreach-{lead_id}",
            system_message=system_message,
        ).with_model("openai", "gpt-5.2")
        resp = await chat.send_message(UserMessage(text=prompt))
        subject, body = _parse_ai(resp, lead)
        await _db.outreach_leads.update_one(
            {"id": lead_id}, {"$set": {"custom_email": {"subject": subject, "body": body}}}
        )
        return {"subject": subject, "body": body}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("AI outreach draft faalde")
        raise HTTPException(status_code=502, detail=f"AI-generatie mislukt: {exc}")


def _parse_ai(resp: str, lead: dict):
    subject, body = "", ""
    if "ONDERWERP:" in resp and "BODY:" in resp:
        try:
            head, body = resp.split("BODY:", 1)
            subject = head.split("ONDERWERP:", 1)[1].strip()
            body = body.strip()
        except Exception:
            pass
    if not subject:
        subject = f"Samenwerken met Droomvriendjes, {lead.get('naam', '').split('(')[0].strip()}?"
    if not body:
        body = resp.strip()
    return subject, body


# ---------------------------------------------------------------- send
def _build_email(lead: dict, templates: dict):
    naam = lead.get("naam") or "daar"
    ce = lead.get("custom_email")
    if ce and ce.get("body"):
        subject = ce.get("subject") or templates.get(lead["type"], {}).get("subject", "Droomvriendjes")
        body = ce["body"]
    else:
        tpl = templates.get(lead.get("type")) or DEFAULT_TEMPLATES.get("influencer")
        subject = tpl["subject"]
        body = tpl["body"]
    for ph in ("{{Naam}}", "{{naam}}", "{{NAAM}}"):
        subject = subject.replace(ph, naam)
        body = body.replace(ph, naam)
    return subject, body


class SendRequest(BaseModel):
    ids: Optional[List[str]] = None
    type: Optional[str] = None
    only_new: bool = True


@router.post("/send")
async def send_outreach(payload: SendRequest, _admin=Depends(_require_admin)):
    if _db is None:
        raise HTTPException(status_code=500, detail="DB unavailable")
    from services.email_sender import send_email
    from services.email_signature import append_signature

    tpl_docs = await _db.outreach_templates.find({}, {"_id": 0}).to_list(length=20)
    templates = {t["type"]: t for t in tpl_docs}

    query = {"email_valid": True}
    if payload.ids:
        query["id"] = {"$in": payload.ids}
    if payload.type:
        query["type"] = payload.type
    if payload.only_new:
        query["status"] = {"$in": ["New", "Bounced"]}

    leads = await _db.outreach_leads.find(query).to_list(length=2000)
    if not leads:
        return {"sent": 0, "failed": 0, "skipped": 0, "message": "Geen verzendbare leads voor deze selectie."}

    sent = failed = 0
    for lead in leads:
        subject, body_text = _build_email(lead, templates)
        html_body = "<div style=\"font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#3A271C;line-height:1.6;\">" \
            + body_text.replace("\n", "<br/>") + "</div>"
        if SITE_URL:
            html_body += f'<img src="{SITE_URL}/api/outreach/track/open/{lead["id"]}" width="1" height="1" style="display:none" alt="" />'
        html_signed, text_signed = append_signature(html_body, body_text)
        try:
            res = send_email(lead["email"], subject, html_signed, text_signed, reply_to=SENDER_EMAIL)
            ok = res.get("success") if isinstance(res, dict) else bool(res)
        except Exception as e:
            logger.error(f"Outreach send failed {lead['email']}: {e}")
            ok = False
        if ok:
            sent += 1
            await _db.outreach_leads.update_one(
                {"id": lead["id"]},
                {"$set": {"status": "Sent", "date_contacted": datetime.now(timezone.utc).isoformat()}},
            )
        else:
            failed += 1
    return {"sent": sent, "failed": failed, "skipped": 0}


@router.get("/track/open/{lead_id}")
async def track_open(lead_id: str):
    if _db is not None:
        lead = await _db.outreach_leads.find_one({"id": lead_id})
        if lead and lead.get("status") in ("Sent",):
            await _db.outreach_leads.update_one(
                {"id": lead_id},
                {"$set": {"status": "Opened", "opened_at": datetime.now(timezone.utc).isoformat()}},
            )
    return Response(content=_PIXEL, media_type="image/gif")
