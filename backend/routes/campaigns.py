"""Marketing campaigns — lightweight campaign planner storage.

Stores internal campaign plans (objective, product, platforms, budget, AI ad copy,
status) so the team can plan & track campaigns from the admin command center.
Full ad-platform API automation (TikTok/X/Meta) is a future phase that requires
the customer's platform credentials.
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timezone
import logging
import uuid

router = APIRouter(prefix="/campaigns", tags=["campaigns"])
logger = logging.getLogger(__name__)

_db = None
verify_admin_token = None
_security = HTTPBearer()

VALID_STATUS = {"concept", "actief", "gepauzeerd", "afgerond"}


def set_database(db):
    global _db
    _db = db


def set_admin_verifier(verifier):
    global verify_admin_token
    verify_admin_token = verifier


def _require_admin(creds: HTTPAuthorizationCredentials = Depends(_security)):
    if verify_admin_token is None:
        raise HTTPException(status_code=500, detail="Admin verifier not configured")
    return verify_admin_token(creds)


def _shape(d: dict) -> dict:
    d.pop("_id", None)
    for k in ("created_at", "updated_at"):
        v = d.get(k)
        if hasattr(v, "isoformat"):
            d[k] = v.isoformat()
    return d


@router.post("")
async def create_campaign(payload: dict, _admin=Depends(_require_admin)):
    if _db is None:
        raise HTTPException(status_code=500, detail="Database niet beschikbaar")
    name = (payload.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Campagnenaam is vereist")
    now = datetime.now(timezone.utc)
    doc = {
        "id": str(uuid.uuid4()),
        "name": name,
        "objective": payload.get("objective") or "awareness",
        "product_id": payload.get("product_id") or "",
        "product_name": payload.get("product_name") or "",
        "platforms": payload.get("platforms") or [],
        "budget": float(payload.get("budget") or 0),
        "currency": "EUR",
        "start_date": payload.get("start_date") or "",
        "end_date": payload.get("end_date") or "",
        "ad_copy": payload.get("ad_copy") or {},
        "notes": payload.get("notes") or "",
        "status": payload.get("status") if payload.get("status") in VALID_STATUS else "concept",
        "created_at": now,
        "updated_at": now,
    }
    await _db.campaigns.insert_one(dict(doc))
    return _shape(doc)


@router.get("")
async def list_campaigns(limit: int = 50, _admin=Depends(_require_admin)):
    if _db is None:
        raise HTTPException(status_code=500, detail="Database niet beschikbaar")
    cursor = _db.campaigns.find({}).sort("created_at", -1).limit(min(limit, 200))
    items = [_shape(d) async for d in cursor]
    return {"items": items, "total": len(items)}


@router.patch("/{campaign_id}")
async def update_campaign(campaign_id: str, payload: dict, _admin=Depends(_require_admin)):
    if _db is None:
        raise HTTPException(status_code=500, detail="Database niet beschikbaar")
    allowed = {"name", "objective", "platforms", "budget", "start_date", "end_date", "ad_copy", "notes", "status"}
    updates = {k: v for k, v in payload.items() if k in allowed}
    if "status" in updates and updates["status"] not in VALID_STATUS:
        raise HTTPException(status_code=400, detail="Ongeldige status")
    if "budget" in updates:
        updates["budget"] = float(updates["budget"] or 0)
    updates["updated_at"] = datetime.now(timezone.utc)
    res = await _db.campaigns.update_one({"id": campaign_id}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Campagne niet gevonden")
    doc = await _db.campaigns.find_one({"id": campaign_id})
    return _shape(doc)


@router.delete("/{campaign_id}")
async def delete_campaign(campaign_id: str, _admin=Depends(_require_admin)):
    if _db is None:
        raise HTTPException(status_code=500, detail="Database niet beschikbaar")
    res = await _db.campaigns.delete_one({"id": campaign_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Campagne niet gevonden")
    return {"status": "ok"}
