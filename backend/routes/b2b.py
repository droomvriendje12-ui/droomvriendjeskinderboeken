"""
B2B / partner endpoints.

Public research-panel signup form on /b2b. Submissions are stored as
outreach_leads so they appear directly in the admin "Leads Bestorming" CRM.
"""
import os
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/b2b", tags=["b2b"])

_db = None


def set_database(database):
    global _db
    _db = database


def _detect_language(email: str) -> str:
    e = (email or "").lower().strip()
    if e.endswith(".de"):
        return "de"
    if e.endswith(".fr"):
        return "fr"
    return "nl"


class ResearchSignup(BaseModel):
    naam: str = Field(..., min_length=2, max_length=120)
    email: str = Field(..., max_length=160)
    organisatie: Optional[str] = Field(default="", max_length=160)
    rol: Optional[str] = Field(default="", max_length=60)        # slaapcoach/verloskundige/kraamzorg/babyboetiek/anders
    telefoon: Optional[str] = Field(default="", max_length=40)
    kinderen_per_maand: Optional[str] = Field(default="", max_length=40)
    licht_belang: Optional[str] = Field(default="", max_length=40)   # quiz: belang lichtkleur
    geluid_belang: Optional[str] = Field(default="", max_length=40)  # quiz: belang geluid
    huidige_aanpak: Optional[str] = Field(default="", max_length=500)
    deelnemen: Optional[str] = Field(default="", max_length=10)      # ja/nee testpanel
    bericht: Optional[str] = Field(default="", max_length=1000)


# Map the friendly role to the CRM lead type
_ROLE_TO_TYPE = {
    "slaapcoach": "slaapcoach",
    "verloskundige": "slaapcoach",
    "kraamzorg": "slaapcoach",
    "babyboetiek": "winkel",
    "winkel": "winkel",
}


@router.post("/research-signup")
async def research_signup(payload: ResearchSignup):
    """Public B2B research-panel signup → stored in Leads Bestorming."""
    if _db is None:
        raise HTTPException(status_code=500, detail="DB unavailable")
    email = payload.email.strip()
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(status_code=400, detail="Vul een geldig e-mailadres in.")

    rol = (payload.rol or "").strip().lower()
    lead_type = _ROLE_TO_TYPE.get(rol, "slaapcoach")

    details_parts = []
    if payload.organisatie:
        details_parts.append(f"Organisatie: {payload.organisatie}")
    if rol:
        details_parts.append(f"Rol: {payload.rol}")
    if payload.telefoon:
        details_parts.append(f"Tel: {payload.telefoon}")
    if payload.kinderen_per_maand:
        details_parts.append(f"Kinderen 0-6/mnd: {payload.kinderen_per_maand}")
    if payload.licht_belang:
        details_parts.append(f"Belang lichtkleur: {payload.licht_belang}/5")
    if payload.geluid_belang:
        details_parts.append(f"Belang geluid: {payload.geluid_belang}/5")
    if payload.deelnemen:
        details_parts.append(f"Wil deelnemen aan testpanel: {payload.deelnemen}")
    if payload.huidige_aanpak:
        details_parts.append(f"Huidige aanpak: {payload.huidige_aanpak}")
    if payload.bericht:
        details_parts.append(f"Bericht: {payload.bericht}")
    details = " | ".join(details_parts)

    # Dedupe on (naam, email) like the CSV importer
    existing = await _db.outreach_leads.find_one({"naam": payload.naam.strip(), "email": email.lower()})
    if existing:
        return {"status": "already_registered", "id": existing.get("id")}

    last = await _db.outreach_leads.find_one({}, sort=[("seq", -1)])
    seq = (last.get("seq", 0) if last else 0) + 1
    now = datetime.now(timezone.utc).isoformat()

    lead = {
        "id": str(uuid.uuid4()),
        "seq": seq,
        "naam": payload.naam.strip(),
        "type": lead_type,
        "email": email,
        "email_valid": True,
        "language": _detect_language(email),
        "source": "B2B Onderzoek",
        "details": details,
        "status": "New",
        "date_contacted": None,
        "opened_at": None,
        "notes": "Aangemeld via /b2b onderzoeksformulier",
        "custom_email": None,
        "created_at": now,
    }
    await _db.outreach_leads.insert_one(lead)
    logger.info(f"📋 B2B research signup: {payload.naam} <{email}> ({lead_type})")

    # Best-effort internal alert so the admin notices the new partner
    try:
        from routes.system_alerts import log_alert
        await log_alert(
            "b2b_signup",
            f"Nieuwe B2B-onderzoeksaanmelding van {payload.naam}"
            + (f" ({payload.organisatie})" if payload.organisatie else "")
            + " — zichtbaar in Leads Bestorming.",
            level="info",
            meta={"email": email, "rol": payload.rol},
        )
    except Exception as exc:
        logger.warning(f"Kon B2B-alert niet loggen: {exc}")

    return {"status": "ok", "id": lead["id"]}
