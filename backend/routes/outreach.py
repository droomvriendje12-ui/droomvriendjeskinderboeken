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
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Response
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


# ---------------------------------------------------------------- language
LANGUAGES = ("nl", "de", "fr")
LANG_LABEL = {"nl": "Nederlands", "de": "Duits", "fr": "Frans"}


def detect_language(email: str) -> str:
    """Pick outreach language from the e-mail TLD: .de -> Duits, .fr -> Frans, anders NL."""
    if not email or "@" not in email:
        return "nl"
    tld = email.strip().rsplit(".", 1)[-1].lower()
    if tld == "de":
        return "de"
    if tld == "fr":
        return "fr"
    return "nl"


# ---------------------------------------------------------------- templates
DEFAULT_TEMPLATES = {
    "slaapcoach": {
        "nl": {
            "subject": "Samenwerken? Droomvriendjes voor jouw slaapcoaching",
            "body": (
                "Hoi {{Naam}},\n\n"
                "Wat fijn dat jij ouders helpt aan betere nachten! Ik ben van Droomvriendjes — wij maken "
                "knuffels met een zacht nachtlampje en rustgevend white noise om kinderen te helpen ontspannen "
                "en doorslapen.\n\n"
                "Onze knuffel past mooi bij jouw slaaptrajecten als rustgevend hulpmiddel. Graag stuur ik je "
                "vrijblijvend een exemplaar op, en werken we samen via een persoonlijke kortingscode voor jouw "
                "klanten (met een aantrekkelijke vergoeding voor jou).\n\n"
                "Heb je interesse? Ik hoor het graag!\n\n"
                "Hartelijke groet,\nTeam Droomvriendjes"
            ),
        },
        "de": {
            "subject": "Zusammenarbeit? Droomvriendjes für dein Schlafcoaching",
            "body": (
                "Hallo {{Naam}},\n\n"
                "schön, dass du Eltern zu besseren Nächten verhilfst! Ich bin von Droomvriendjes — wir machen "
                "Kuscheltiere mit sanftem Nachtlicht und beruhigendem White Noise, die Kindern beim Entspannen "
                "und Durchschlafen helfen.\n\n"
                "Unser Kuscheltier passt wunderbar als beruhigendes Hilfsmittel zu deinen Schlafbegleitungen. "
                "Gerne schicke ich dir unverbindlich ein Exemplar und wir arbeiten über einen persönlichen "
                "Rabattcode für deine Kund:innen zusammen (mit einer attraktiven Vergütung für dich).\n\n"
                "Hast du Interesse? Ich freue mich auf deine Antwort!\n\n"
                "Herzliche Grüße,\nDein Droomvriendjes-Team"
            ),
        },
        "fr": {
            "subject": "Une collaboration ? Droomvriendjes pour votre coaching sommeil",
            "body": (
                "Bonjour {{Naam}},\n\n"
                "bravo pour votre travail qui aide les parents à passer de meilleures nuits ! Je représente "
                "Droomvriendjes — nous créons des peluches avec une douce veilleuse et un bruit blanc apaisant "
                "qui aident les enfants à se détendre et à mieux dormir.\n\n"
                "Notre peluche s'intègre parfaitement à vos accompagnements comme outil apaisant. Je vous "
                "enverrais volontiers un exemplaire sans engagement, et nous pourrions collaborer via un code "
                "promo personnel pour vos clients (avec une belle rémunération pour vous).\n\n"
                "Cela vous intéresse ? Au plaisir de vous lire !\n\n"
                "Bien cordialement,\nL'équipe Droomvriendjes"
            ),
        },
    },
    "influencer": {
        "nl": {
            "subject": "Leuke samenwerking? Droomvriendjes & jouw kanaal",
            "body": (
                "Hoi {{Naam}},\n\n"
                "Ik volg jouw content met plezier — jouw warme verhalen sluiten mooi aan bij waar wij voor staan. "
                "Ik ben van Droomvriendjes: knuffels met een zacht nachtlampje en white noise die kinderen helpen "
                "rustig in slaap te vallen.\n\n"
                "Ik doe je graag vrijblijvend een knuffel cadeau om uit te proberen. Als hij bevalt, vinden we het "
                "super als je hem deelt — en we denken graag mee over een leuke actie of kortingscode voor jouw "
                "community.\n\n"
                "Lijkt je dit wat? Laat het me weten, dan stuur ik snel een knuffel jouw kant op!\n\n"
                "Hartelijke groet,\nTeam Droomvriendjes"
            ),
        },
        "de": {
            "subject": "Eine schöne Kooperation? Droomvriendjes & dein Kanal",
            "body": (
                "Hallo {{Naam}},\n\n"
                "ich verfolge deinen Content sehr gerne — deine warmen Geschichten passen wunderbar zu dem, wofür "
                "wir stehen. Ich bin von Droomvriendjes: Kuscheltiere mit sanftem Nachtlicht und White Noise, die "
                "Kindern beim ruhigen Einschlafen helfen.\n\n"
                "Gerne schenke ich dir unverbindlich ein Kuscheltier zum Ausprobieren. Wenn es dir gefällt, würden "
                "wir uns freuen, wenn du es teilst — und wir überlegen gerne eine schöne Aktion oder einen "
                "Rabattcode für deine Community.\n\n"
                "Klingt das gut? Sag Bescheid, dann schicke ich dir schnell ein Kuscheltier!\n\n"
                "Herzliche Grüße,\nDein Droomvriendjes-Team"
            ),
        },
        "fr": {
            "subject": "Une jolie collaboration ? Droomvriendjes & votre univers",
            "body": (
                "Bonjour {{Naam}},\n\n"
                "je suis votre contenu avec plaisir — vos histoires chaleureuses correspondent parfaitement à nos "
                "valeurs. Je représente Droomvriendjes : des peluches avec une douce veilleuse et un bruit blanc "
                "qui aident les enfants à s'endormir paisiblement.\n\n"
                "Je vous offrirais volontiers une peluche à tester, sans engagement. Si elle vous plaît, nous "
                "serions ravis que vous la partagiez — et nous pouvons imaginer une jolie action ou un code promo "
                "pour votre communauté.\n\n"
                "Cela vous tente ? Dites-moi, je vous envoie vite une peluche !\n\n"
                "Bien cordialement,\nL'équipe Droomvriendjes"
            ),
        },
    },
    "winkel": {
        "nl": {
            "subject": "Droomvriendjes in jullie assortiment? (zakelijk)",
            "body": (
                "Hoi {{Naam}},\n\n"
                "Wat een mooie winkel hebben jullie! Ik ben van Droomvriendjes — wij maken knuffels met een zacht "
                "nachtlampje en rustgevend white noise die kinderen helpen beter te slapen. Ze zijn populair bij "
                "ouders en ideaal als cadeau.\n\n"
                "Onze producten passen goed bij jullie assortiment. Graag vertel ik meer over onze inkoopvoorwaarden "
                "en marges voor wederverkopers, en stuur ik vrijblijvend een sample op.\n\n"
                "Zullen we kennismaken? Ik hoor graag of er interesse is!\n\n"
                "Hartelijke groet,\nTeam Droomvriendjes"
            ),
        },
        "de": {
            "subject": "Droomvriendjes in eurem Sortiment? (geschäftlich)",
            "body": (
                "Hallo {{Naam}},\n\n"
                "was für ein schöner Laden! Ich bin von Droomvriendjes — wir machen Kuscheltiere mit sanftem "
                "Nachtlicht und beruhigendem White Noise, die Kindern beim besseren Schlafen helfen. Sie sind bei "
                "Eltern beliebt und ideal als Geschenk.\n\n"
                "Unsere Produkte passen gut zu eurem Sortiment. Gerne erzähle ich mehr über unsere Einkaufs"
                "konditionen und Margen für Wiederverkäufer und schicke euch unverbindlich ein Muster.\n\n"
                "Sollen wir uns kennenlernen? Ich freue mich auf eure Rückmeldung!\n\n"
                "Herzliche Grüße,\nDein Droomvriendjes-Team"
            ),
        },
        "fr": {
            "subject": "Droomvriendjes dans votre boutique ? (professionnel)",
            "body": (
                "Bonjour {{Naam}},\n\n"
                "quelle belle boutique ! Je représente Droomvriendjes — nous créons des peluches avec une douce "
                "veilleuse et un bruit blanc apaisant qui aident les enfants à mieux dormir. Elles plaisent beaucoup "
                "aux parents et font un cadeau idéal.\n\n"
                "Nos produits s'accorderaient bien à votre assortiment. Je vous présenterais volontiers nos "
                "conditions d'achat et marges pour revendeurs, et vous enverrais un échantillon sans engagement.\n\n"
                "Faisons connaissance ? J'attends votre retour avec plaisir !\n\n"
                "Bien cordialement,\nL'équipe Droomvriendjes"
            ),
        },
    },
}


async def _seed_templates():
    for t, langs in DEFAULT_TEMPLATES.items():
        for lang, data in langs.items():
            existing = await _db.outreach_templates.find_one({"type": t, "language": lang})
            if not existing:
                await _db.outreach_templates.insert_one({
                    "type": t, "language": lang,
                    "subject": data["subject"], "body": data["body"],
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                })


def _lead_out(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


# ---------------------------------------------------------------- import
_NAME_KEYS = {"naam", "name", "nom", "bedrijf", "bedrijfsnaam", "company", "firma", "organisatie", "praktijk", "naambedrijf"}
_EMAIL_KEYS = {"emailadres", "email", "mail", "emailaddress", "courriel", "epost"}
_TYPE_KEYS = {"type", "typ", "categorie", "category", "soort"}
_DETAILS_KEYS = {"details", "omschrijving", "description", "beschrijving"}


def _nk(k: str) -> str:
    return (k or "").strip().lower().replace("-", "").replace("_", "").replace(" ", "")


def _first(norm: dict, keys: set) -> str:
    for k in keys:
        if norm.get(k):
            return norm[k]
    return ""


def _map_lead_type(*candidates: str) -> str:
    blob = " ".join(c for c in candidates if c).lower()
    if any(w in blob for w in ("sommeil", "slaap", "sleep", "coach", "conseil", "kinesi",
                               "lactation", "doula", "verloskund", "kraam", "consultant", "begeleid")):
        return "slaapcoach"
    if any(w in blob for w in ("influencer", "blog", "insta", "content", "mama")):
        return "influencer"
    if any(w in blob for w in ("winkel", "markt", "shop", "store", "boetiek", "laden", "babyfach",
                               "babyone", "baby", "speelgoed", "concept", "boutique", "magasin",
                               "kinderdagverblijf", "dagverblijf", "opvang", "creche", "crèche", "kita")):
        return "winkel"
    return ""


def _batch_language(filename: str) -> Optional[str]:
    fn = (filename or "").lower()
    if any(w in fn for w in ("wallon", "bruxelles", "brussel", "france", "francais", "français", "fr")):
        if any(w in fn for w in ("wallon", "bruxelles", "brussel", "france", "francais", "français")):
            return "fr"
    if any(w in fn for w in ("germany", "deutsch", "german", "duitsland")):
        return "de"
    if any(w in fn for w in ("nederland", "netherlands", "vlaander", "flanders")):
        return "nl"
    return None


def _lang_for(email: str, batch_lang: Optional[str]) -> str:
    e = (email or "").lower().strip()
    if e.endswith(".de"):
        return "de"
    if e.endswith(".fr"):
        return "fr"
    if e.endswith(".nl"):
        return "nl"
    return batch_lang or "nl"


@router.post("/import")
async def import_leads(file: UploadFile = File(...), source: Optional[str] = Form(None),
                       _admin=Depends(_require_admin)):
    """Import a leads CSV. Robust parser:
    - auto-detects the delimiter (',' or ';' or tab),
    - accepts NL/FR/DE column names (Naam/Name/Nom, Email/E-mail/E-Mail, Type/Typ, ...),
    - builds `details` from any remaining columns (Plaats, Provincie, Ville, Stadt, ...),
    - derives language from the e-mail TLD with a filename-based fallback (.de/.fr/wallonie).
    Adds new leads only (dedupe on name+email)."""
    if _db is None:
        raise HTTPException(status_code=500, detail="DB unavailable")
    batch_source = (source or file.filename or "import").strip()
    batch_lang = _batch_language(batch_source)
    raw = await file.read()
    try:
        text = raw.decode("utf-8-sig")
    except Exception:
        text = raw.decode("latin-1")

    first_line = text.split("\n", 1)[0]
    if first_line.count(";") > first_line.count(","):
        delim = ";"
    elif first_line.count("\t") > first_line.count(","):
        delim = "\t"
    else:
        delim = ","
    reader = csv.DictReader(io.StringIO(text), delimiter=delim)

    existing = await _db.outreach_leads.find({}, {"naam": 1, "email": 1}).to_list(length=100000)
    seen = {(r.get("naam", ""), (r.get("email") or "").lower()) for r in existing}
    last = await _db.outreach_leads.find_one({}, sort=[("seq", -1)])
    seq = (last.get("seq", 0) if last else 0)

    now = datetime.now(timezone.utc).isoformat()
    docs = []
    skipped_dupe = 0
    for row in reader:
        norm = {_nk(k): (v or "").strip() for k, v in row.items() if k}
        naam = _first(norm, _NAME_KEYS)
        email = _first(norm, _EMAIL_KEYS)
        raw_type = _first(norm, _TYPE_KEYS)
        details = _first(norm, _DETAILS_KEYS)
        if not details:
            extra = []
            for k, v in row.items():
                if not k or v is None or not str(v).strip():
                    continue
                nk = _nk(k)
                if nk in _NAME_KEYS or nk in _EMAIL_KEYS or nk in _DETAILS_KEYS:
                    continue
                extra.append(f"{k.strip()}: {str(v).strip()}")
            details = " | ".join(extra)
        if not naam and not email:
            continue
        key = (naam, email.lower())
        if key in seen:
            skipped_dupe += 1
            continue
        seen.add(key)
        seq += 1
        docs.append({
            "id": str(uuid.uuid4()),
            "seq": seq,
            "naam": naam,
            "type": _map_lead_type(raw_type, naam) or "winkel",
            "email": email,
            "email_valid": "@" in email,
            "language": _lang_for(email, batch_lang),
            "source": batch_source,
            "details": details,
            "status": "New",
            "date_contacted": None,
            "opened_at": None,
            "notes": "",
            "custom_email": None,
            "created_at": now,
        })

    if docs:
        await _db.outreach_leads.insert_many(docs)
    return {
        "added": len(docs),
        "skipped_duplicates": skipped_dupe,
        "total": await _db.outreach_leads.count_documents({}),
    }


# ---------------------------------------------------------------- list / stats
@router.get("/leads")
async def list_leads(type: Optional[str] = None, status: Optional[str] = None,
                     source: Optional[str] = None, language: Optional[str] = None,
                     search: Optional[str] = None, skip: int = 0, limit: int = 100,
                     _admin=Depends(_require_admin)):
    if _db is None:
        raise HTTPException(status_code=500, detail="DB unavailable")
    query = {}
    if type:
        query["type"] = type
    if status:
        query["status"] = status
    if source:
        query["source"] = source
    if language:
        query["language"] = language
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
    by_source = await _db.outreach_leads.aggregate([
        {"$group": {"_id": "$source", "count": {"$sum": 1},
                    "new": {"$sum": {"$cond": [{"$eq": ["$status", "New"]}, 1, 0]}}}},
        {"$sort": {"count": -1}},
    ]).to_list(length=100)
    by_language = await _db.outreach_leads.aggregate([
        {"$group": {"_id": "$language", "count": {"$sum": 1}}},
    ]).to_list(length=10)
    total = await _db.outreach_leads.count_documents({})
    no_email = await _db.outreach_leads.count_documents({"email_valid": False})
    return {
        "total": total,
        "no_email": no_email,
        "by_type": {x["_id"]: x["count"] for x in by_type},
        "by_status": {x["_id"]: x["count"] for x in by_status},
        "by_language": {(x["_id"] or "nl"): x["count"] for x in by_language},
        "sources": [{"source": x["_id"] or "onbekend", "count": x["count"], "new": x.get("new", 0)} for x in by_source],
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
    docs = await _db.outreach_templates.find({}, {"_id": 0}).to_list(length=50)
    # ensure language present on legacy docs
    for d in docs:
        d.setdefault("language", "nl")
    return {"templates": docs}


class TemplateUpdate(BaseModel):
    subject: str
    body: str


@router.put("/templates/{type}/{language}")
async def update_template(type: str, language: str, payload: TemplateUpdate, _admin=Depends(_require_admin)):
    if language not in LANGUAGES:
        raise HTTPException(status_code=400, detail="Ongeldige taal")
    await _db.outreach_templates.update_one(
        {"type": type, "language": language},
        {"$set": {"subject": payload.subject, "body": payload.body, "language": language,
                  "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    return {"status": "ok"}


# ---------------------------------------------------------------- AI draft
async def _generate_ai_for_lead(lead: dict, api_key: str, keywords: str = "", campaign: str = "") -> dict:
    """Genereer één gepersonaliseerde outreachmail (subject+body) voor een lead via GPT-5.2.
    Optioneel gestuurd door `keywords` (3-5 kernwoorden) en een `campaign`/doel.
    Slaat het resultaat op als `custom_email`. Raises bij fout."""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    lang = lead.get("language", "nl")
    lang_name = {"nl": "het Nederlands", "de": "het Duits (Deutsch)", "fr": "het Frans (Français)"}.get(lang, "het Nederlands")
    signoff = {"nl": "Hartelijke groet,\\nTeam Droomvriendjes",
               "de": "Herzliche Grüße,\\nDein Droomvriendjes-Team",
               "fr": "Bien cordialement,\\nL'équipe Droomvriendjes"}.get(lang, "Hartelijke groet,\\nTeam Droomvriendjes")
    system_message = (
        "Je bent een outreach-copywriter voor Droomvriendjes, een webshop in slaapknuffels met zacht "
        "nachtlampje en white noise voor kinderen. Schrijf warme, professionele, persoonlijke B2B-outreachmails "
        "die uitnodigen tot samenwerking. Kort, oprecht, geen overdreven verkooppraat, geen valse claims. "
        "Spreek de persoon aan met de voornaam. Schrijf VOLLEDIG in de gevraagde taal (ook onderwerp)."
    )
    steer = ""
    if campaign:
        steer += f"\nCAMPAGNE/DOEL (verwerk dit als kern van de mail): {campaign}"
    if keywords:
        steer += (f"\nVERPLICHTE TREFWOORDEN (verwerk deze 3-5 kernwoorden natuurlijk en dwingend in de tekst, "
                  f"geen opsomming): {keywords}")
    prompt = (
        f"Schrijf een korte, persoonlijke outreachmail VOLLEDIG in {lang_name}.\n"
        f"Naam ontvanger: {lead.get('naam')}\n"
        f"Type contact: {lead.get('type')}\n"
        f"Context/details over deze persoon: {lead.get('details')}"
        f"{steer}\n\n"
        f"Verwerk de context subtiel zodat het persoonlijk voelt. Doel: kennismaken en samenwerken "
        f"(slaapcoach=aanbevelen bij klanten + sample/affiliate; influencer=knuffel cadeau voor post + "
        f"deelname aan een challenge; winkel=inkoop/wederverkoop). Als er een campagne/doel is opgegeven, "
        f"maak daar de duidelijke call-to-action van. Gebruik {{{{Naam}}}} NIET — schrijf de echte naam uit.\n"
        f"Antwoord exact in dit formaat op aparte regels:\n"
        f"ONDERWERP: <pakkend onderwerp in {lang_name}>\n"
        f"BODY: <de mailtekst in {lang_name}, eindig met '{signoff}'>"
    )
    chat = LlmChat(
        api_key=api_key,
        session_id=f"outreach-{lead['id']}",
        system_message=system_message,
    ).with_model("openai", "gpt-5.2")
    resp = await chat.send_message(UserMessage(text=prompt))
    subject, body = _parse_ai(resp, lead)
    await _db.outreach_leads.update_one(
        {"id": lead["id"]}, {"$set": {"custom_email": {"subject": subject, "body": body}}}
    )
    return {"subject": subject, "body": body}


class AiDraftOptions(BaseModel):
    keywords: Optional[str] = ""
    campaign: Optional[str] = ""


@router.post("/leads/{lead_id}/ai-draft")
async def ai_draft(lead_id: str, options: Optional[AiDraftOptions] = None, _admin=Depends(_require_admin)):
    lead = await _db.outreach_leads.find_one({"id": lead_id})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead niet gevonden")
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="AI niet geconfigureerd (EMERGENT_LLM_KEY ontbreekt)")
    opts = options or AiDraftOptions()
    try:
        return await _generate_ai_for_lead(lead, api_key, keywords=opts.keywords or "", campaign=opts.campaign or "")
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
    """templates: dict keyed by (type, language) -> {subject, body}."""
    naam = lead.get("naam") or "daar"
    lang = lead.get("language", "nl")
    ce = lead.get("custom_email")
    fallback = templates.get((lead.get("type"), lang)) or templates.get(("influencer", lang)) \
        or DEFAULT_TEMPLATES.get(lead.get("type"), DEFAULT_TEMPLATES["influencer"]).get(lang) \
        or DEFAULT_TEMPLATES["influencer"]["nl"]
    if ce and ce.get("body"):
        subject = ce.get("subject") or fallback["subject"]
        body = ce["body"]
    else:
        subject = fallback["subject"]
        body = fallback["body"]
    for ph in ("{{Naam}}", "{{naam}}", "{{NAAM}}"):
        subject = subject.replace(ph, naam)
        body = body.replace(ph, naam)
    return subject, body


class SendRequest(BaseModel):
    ids: Optional[List[str]] = None
    type: Optional[str] = None
    source: Optional[str] = None
    only_new: bool = True


# --- Anti-spam guardrails (protect domain reputation & stay under Resend limits) ---
SEND_PER_REQUEST_LIMIT = 50   # max e-mails per verzendactie
SEND_DAILY_LIMIT = 150        # max cold-outreach e-mails per kalenderdag
SEND_DELAY_SECONDS = 0.5      # throttle tussen mails (~2/sec)


async def _sent_today_count() -> int:
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return await _db.outreach_leads.count_documents({
        "date_contacted": {"$regex": f"^{today}"},
        "status": {"$in": ["Sent", "Opened"]},
    })


@router.post("/send")
async def send_outreach(payload: SendRequest, _admin=Depends(_require_admin)):
    if _db is None:
        raise HTTPException(status_code=500, detail="DB unavailable")
    from services.email_sender import send_email
    from services.email_signature import append_signature

    await _seed_templates()
    tpl_docs = await _db.outreach_templates.find({}, {"_id": 0}).to_list(length=50)
    templates = {(t["type"], t.get("language", "nl")): t for t in tpl_docs}

    query = {"email_valid": True}
    if payload.ids:
        query["id"] = {"$in": payload.ids}
    if payload.type:
        query["type"] = payload.type
    if payload.source:
        query["source"] = payload.source
    if payload.only_new:
        query["status"] = {"$in": ["New", "Bounced"]}

    leads = await _db.outreach_leads.find(query).to_list(length=2000)
    eligible = len(leads)
    if not leads:
        return {"sent": 0, "failed": 0, "skipped": 0, "message": "Geen verzendbare leads voor deze selectie."}

    # Anti-spam caps: respect the remaining daily budget and the per-request limit.
    sent_today = await _sent_today_count()
    remaining_daily = max(0, SEND_DAILY_LIMIT - sent_today)
    if remaining_daily <= 0:
        return {
            "sent": 0, "failed": 0, "skipped": eligible,
            "daily_limit": SEND_DAILY_LIMIT, "sent_today": sent_today, "remaining_today": 0,
            "message": f"Dagelijkse veiligheidslimiet van {SEND_DAILY_LIMIT} bereikt. "
                       "Verstuur de rest morgen om je domeinreputatie te beschermen.",
        }
    allowed_now = min(SEND_PER_REQUEST_LIMIT, remaining_daily, eligible)
    batch = leads[:allowed_now]

    sent = failed = 0
    for idx, lead in enumerate(batch):
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
        if idx < len(batch) - 1:
            await asyncio.sleep(SEND_DELAY_SECONDS)

    not_sent = eligible - sent
    remaining_today = max(0, remaining_daily - sent)
    msg = f"{sent} verzonden."
    if not_sent > 0:
        if remaining_today <= 0:
            msg += f" {not_sent} niet verstuurd — dagelijkse veiligheidslimiet ({SEND_DAILY_LIMIT}) bereikt. Ga morgen verder."
        else:
            msg += f" {not_sent} niet verstuurd — max {SEND_PER_REQUEST_LIMIT} per keer. Klik nogmaals om door te gaan (nog {remaining_today} vandaag mogelijk)."
    return {
        "sent": sent, "failed": failed, "skipped": not_sent,
        "eligible": eligible, "batch_limit": SEND_PER_REQUEST_LIMIT,
        "daily_limit": SEND_DAILY_LIMIT, "remaining_today": remaining_today,
        "message": msg,
    }


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
