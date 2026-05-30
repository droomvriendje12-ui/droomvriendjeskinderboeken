"""Resend webhook receiver.

Receives Resend email events (signed via Svix) and processes them:
- verifies the Svix signature (svix-id / svix-timestamp / svix-signature)
- stores each event for audit (MongoDB `resend_events`)
- raises a human-readable admin alert for bounces / complaints / delays
"""
from fastapi import APIRouter, Request, HTTPException, Header
from datetime import datetime, timezone
from typing import Optional
import os
import json
import hmac
import hashlib
import base64
import logging
import uuid

router = APIRouter(tags=["resend-webhook"])
logger = logging.getLogger(__name__)

_db = None


def set_database(db):
    global _db
    _db = db


def _verify_svix_signature(secret: str, svix_id: str, svix_timestamp: str,
                           svix_signature: str, body: bytes) -> bool:
    """Verify a Svix-signed webhook (Resend uses Svix)."""
    if not (secret and svix_id and svix_timestamp and svix_signature):
        return False
    key_part = secret[len("whsec_"):] if secret.startswith("whsec_") else secret
    try:
        key = base64.b64decode(key_part)
    except Exception:
        return False
    signed_content = f"{svix_id}.{svix_timestamp}.{body.decode('utf-8')}".encode("utf-8")
    expected = base64.b64encode(hmac.new(key, signed_content, hashlib.sha256).digest()).decode()
    # Header can contain multiple space-separated signatures: "v1,xxxx v1,yyyy"
    for token in svix_signature.split(" "):
        sig = token.split(",", 1)[1] if "," in token else token
        if hmac.compare_digest(sig, expected):
            return True
    return False


# Events that warrant a human-readable admin alert
_ALERT_EVENTS = {
    "email.bounced": ("error", "is gebounced (niet afgeleverd)"),
    "email.complained": ("warning", "is door de ontvanger als spam gemarkeerd"),
    "email.delivery_delayed": ("warning", "loopt vertraging op bij afleveren"),
    "email.failed": ("error", "kon niet worden verzonden"),
}


async def _log_alert(message, detail=None, level="error", meta=None):
    try:
        from routes.system_alerts import log_alert
        await log_alert("resend_webhook", message, detail=detail, level=level, meta=meta)
    except Exception as exc:
        logger.warning(f"Kon resend system alert niet loggen: {exc}")


@router.post("/webhook/resend")
async def resend_webhook(
    request: Request,
    svix_id: Optional[str] = Header(None, alias="svix-id"),
    svix_timestamp: Optional[str] = Header(None, alias="svix-timestamp"),
    svix_signature: Optional[str] = Header(None, alias="svix-signature"),
):
    """Ontvang en verwerk Resend webhook events (Svix-signed)."""
    secret = os.environ.get("RESEND_WEBHOOK_SECRET")
    if not secret:
        logger.error("RESEND_WEBHOOK_SECRET niet geconfigureerd")
        raise HTTPException(status_code=500, detail="Webhook secret not configured")

    body = await request.body()

    if not _verify_svix_signature(secret, svix_id, svix_timestamp, svix_signature, body):
        logger.warning("Resend webhook: ongeldige handtekening")
        raise HTTPException(status_code=401, detail="Invalid signature")

    try:
        event = json.loads(body.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_type = event.get("type") or "unknown"
    data = event.get("data") or {}
    to = data.get("to")
    to_str = ", ".join(to) if isinstance(to, list) else (to or "onbekend")
    subject = data.get("subject") or ""
    email_id = data.get("email_id") or data.get("id")

    # 1) Audit-log: bewaar het event (best-effort)
    if _db is not None:
        try:
            await _db.resend_events.insert_one({
                "id": str(uuid.uuid4()),
                "type": event_type,
                "email_id": email_id,
                "to": to,
                "subject": subject,
                "payload": event,
                "created_at": datetime.now(timezone.utc),
            })
        except Exception as exc:
            logger.warning(f"Kon resend_event niet opslaan: {exc}")

    # 2) Leesbare admin-melding bij problemen
    if event_type in _ALERT_EVENTS:
        level, phrase = _ALERT_EVENTS[event_type]
        reason = ""
        bounce = data.get("bounce") or {}
        if isinstance(bounce, dict):
            reason = bounce.get("message") or bounce.get("subType") or bounce.get("type") or ""
        subj_part = f' ("{subject}")' if subject else ""
        msg = f"E-mail naar {to_str}{subj_part} {phrase}."
        await _log_alert(
            msg,
            detail=(f"Reden: {reason}" if reason else f"event={event_type}, email_id={email_id}"),
            level=level,
            meta={"email_id": email_id, "to": to, "event": event_type},
        )

    logger.info(f"📨 Resend webhook verwerkt: {event_type} → {to_str}")
    return {"status": "ok", "type": event_type}
