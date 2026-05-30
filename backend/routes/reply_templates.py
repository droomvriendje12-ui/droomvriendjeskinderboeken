"""
Reply Templates API — manage the inbox quick-reply snippets from the admin.

Stored in MongoDB `reply_templates`. The 5 original hardcoded templates are
seeded automatically on first read so nothing is lost.
"""
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reply-templates", tags=["reply-templates"])

_db = None
_admin_verifier = None
_security = HTTPBearer(auto_error=False)


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


DEFAULT_TEMPLATES = [
    {
        "label": "Bestelling onderweg",
        "text": (
            "Bedankt voor je bericht! Goed nieuws: je bestelling is verzonden. Je ontvangt het track & trace nummer zodra het pakket door de bezorger is gescand.\n\n"
            "Verwachte levertijd: 1-2 werkdagen.\n\n"
            "Laat het ons gerust weten als je nog vragen hebt.\n\n"
            "Lieve groet,\nTeam Droomvriendjes"
        ),
    },
    {
        "label": "Bestelling ontvangen",
        "text": (
            "Bedankt voor je bestelling! We hebben deze in goede orde ontvangen en gaan er direct mee aan de slag.\n\n"
            "Je ontvangt automatisch een bericht zodra je pakket onderweg is.\n\n"
            "Lieve groet,\nTeam Droomvriendjes"
        ),
    },
    {
        "label": "Retour aanvragen",
        "text": (
            "Bedankt voor je bericht. Wat vervelend, maar je kunt het product natuurlijk binnen 14 dagen retourneren.\n\n"
            "Zo werkt het:\n"
            "1. Stuur het product ongebruikt en in de originele verpakking terug naar ons retouradres.\n"
            "2. Voeg je ordernummer toe.\n"
            "3. Zodra wij het pakket ontvangen, storten we het bedrag binnen 5 werkdagen terug.\n\n"
            "Meer info: https://www.droomvriendjes.com/retourneren\n\n"
            "Lieve groet,\nTeam Droomvriendjes"
        ),
    },
    {
        "label": "Bedankt voor je review",
        "text": (
            "Wat lief dat je de tijd nam om een review achter te laten, daar worden we erg blij van! Het helpt andere ouders enorm bij het kiezen van de juiste knuffel.\n\n"
            "Mocht je nog iets nodig hebben, we staan voor je klaar.\n\n"
            "Lieve groet,\nTeam Droomvriendjes"
        ),
    },
    {
        "label": "Levertijd / voorraad",
        "text": (
            "Bedankt voor je vraag! Dit product is op voorraad en wordt op werkdagen voor 17:00 uur besteld dezelfde dag verzonden.\n\n"
            "De verwachte levertijd in Nederland is 1-2 werkdagen.\n\n"
            "Laat het ons weten als we je verder kunnen helpen.\n\n"
            "Lieve groet,\nTeam Droomvriendjes"
        ),
    },
]


class TemplatePayload(BaseModel):
    label: str = Field(..., min_length=1, max_length=80)
    text: str = Field(..., min_length=1)
    sort_order: Optional[int] = None


def _to_dict(doc) -> dict:
    doc.pop("_id", None)
    for k in ("created_at", "updated_at"):
        if isinstance(doc.get(k), datetime):
            doc[k] = doc[k].isoformat()
    return doc


async def _seed_if_empty():
    count = await _db.reply_templates.count_documents({})
    if count == 0:
        now = datetime.now(timezone.utc)
        docs = [
            {
                "id": str(uuid.uuid4()),
                "label": t["label"],
                "text": t["text"],
                "sort_order": i,
                "created_at": now,
                "updated_at": now,
            }
            for i, t in enumerate(DEFAULT_TEMPLATES)
        ]
        await _db.reply_templates.insert_many(docs)
        logger.info("Seeded %d default reply templates", len(docs))


@router.get("")
async def list_templates(admin=Depends(_require_admin)):
    if _db is None:
        raise HTTPException(status_code=500, detail="DB unavailable")
    await _seed_if_empty()
    cursor = _db.reply_templates.find({}).sort([("sort_order", 1), ("created_at", 1)])
    items = await cursor.to_list(length=200)
    return {"templates": [_to_dict(d) for d in items]}


@router.post("")
async def create_template(payload: TemplatePayload, admin=Depends(_require_admin)):
    if _db is None:
        raise HTTPException(status_code=500, detail="DB unavailable")
    now = datetime.now(timezone.utc)
    if payload.sort_order is None:
        last = await _db.reply_templates.find_one({}, sort=[("sort_order", -1)])
        sort_order = (last.get("sort_order", 0) + 1) if last else 0
    else:
        sort_order = payload.sort_order
    doc = {
        "id": str(uuid.uuid4()),
        "label": payload.label.strip(),
        "text": payload.text,
        "sort_order": sort_order,
        "created_at": now,
        "updated_at": now,
    }
    await _db.reply_templates.insert_one(doc)
    return _to_dict(doc)


@router.put("/{template_id}")
async def update_template(template_id: str, payload: TemplatePayload, admin=Depends(_require_admin)):
    if _db is None:
        raise HTTPException(status_code=500, detail="DB unavailable")
    update = {
        "label": payload.label.strip(),
        "text": payload.text,
        "updated_at": datetime.now(timezone.utc),
    }
    if payload.sort_order is not None:
        update["sort_order"] = payload.sort_order
    res = await _db.reply_templates.update_one({"id": template_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Template niet gevonden")
    doc = await _db.reply_templates.find_one({"id": template_id})
    return _to_dict(doc)


@router.delete("/{template_id}")
async def delete_template(template_id: str, admin=Depends(_require_admin)):
    if _db is None:
        raise HTTPException(status_code=500, detail="DB unavailable")
    res = await _db.reply_templates.delete_one({"id": template_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template niet gevonden")
    return {"status": "deleted"}
