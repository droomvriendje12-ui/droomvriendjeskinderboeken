"""Background system status monitoring.

Captures human-readable alerts when webhooks/orders fail to process correctly
(e.g. corrupt payload, missing fields) and surfaces them in the admin panel,
so the team does not have to dig through code/logs.
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timezone
import logging
import uuid

router = APIRouter(prefix="/admin/system-alerts", tags=["system-alerts"])
logger = logging.getLogger(__name__)

_db = None
verify_admin_token = None
_security = HTTPBearer()


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


async def log_alert(source: str, message: str, detail=None, level: str = "error", meta: dict = None):
    """Record a human-readable system alert. Safe no-op if DB unavailable.

    source : short machine tag, e.g. 'payment_webhook', 'inbox_webhook'
    message: human readable Dutch description shown in the admin panel
    level  : 'error' | 'warning' | 'info'
    """
    if _db is None:
        logger.warning(f"[system_alert:{level}] {source}: {message} (DB niet beschikbaar)")
        return None
    doc = {
        "id": str(uuid.uuid4()),
        "source": source,
        "level": level,
        "message": message,
        "detail": (str(detail)[:2000] if detail else None),
        "meta": meta or {},
        "resolved": False,
        "created_at": datetime.now(timezone.utc),
    }
    try:
        await _db.system_alerts.insert_one(doc)
        logger.error(f"[system_alert:{level}] {source}: {message}")
    except Exception as exc:
        logger.error(f"Kon system_alert niet opslaan: {exc}")
    return doc.get("id")


def _shape(d: dict) -> dict:
    d.pop("_id", None)
    ca = d.get("created_at")
    if hasattr(ca, "isoformat"):
        d["created_at"] = ca.isoformat()
    ra = d.get("resolved_at")
    if hasattr(ra, "isoformat"):
        d["resolved_at"] = ra.isoformat()
    return d


@router.get("")
async def list_alerts(resolved: bool = False, limit: int = 50, _admin=Depends(_require_admin)):
    if _db is None:
        raise HTTPException(status_code=500, detail="Database niet beschikbaar")
    cursor = _db.system_alerts.find({"resolved": resolved}).sort("created_at", -1).limit(min(limit, 200))
    items = [_shape(d) async for d in cursor]
    unresolved = await _db.system_alerts.count_documents({"resolved": False})
    return {"items": items, "unresolved": unresolved}


@router.post("/{alert_id}/resolve")
async def resolve_alert(alert_id: str, _admin=Depends(_require_admin)):
    if _db is None:
        raise HTTPException(status_code=500, detail="Database niet beschikbaar")
    res = await _db.system_alerts.update_one(
        {"id": alert_id},
        {"$set": {"resolved": True, "resolved_at": datetime.now(timezone.utc)}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Melding niet gevonden")
    return {"status": "ok"}
