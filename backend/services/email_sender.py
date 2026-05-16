"""
Unified email sender via Resend.

Replaces the legacy TransIP SMTP path. Maintains the same simple API
that existing code uses:

    send_email(to_email, subject, html_content, text_content, reply_to=None,
               in_reply_to=None, references=None, message_id=None, cc=None, bcc=None)

Behavior:
- In Resend test mode (default sender = onboarding@resend.dev), Resend will
  only deliver to the verified recipient. We respect that by NOT failing
  the API call — it just logs that delivery is restricted.
- Returns dict: {"success": bool, "id": str|None, "error": str|None}
"""
import os
import asyncio
import logging
from email.utils import make_msgid
from typing import List, Optional

import resend

logger = logging.getLogger(__name__)

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
SENDER_NAME = os.environ.get("SENDER_NAME", "Droomvriendjes")
TEST_RECIPIENT = os.environ.get("TEST_RECIPIENT", "")

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY
else:
    logger.warning("⚠️ RESEND_API_KEY not set — emails will not be sent")


def _from_header() -> str:
    if SENDER_NAME:
        return f"{SENDER_NAME} <{SENDER_EMAIL}>"
    return SENDER_EMAIL


def send_email(
    to_email,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None,
    reply_to: Optional[str] = None,
    in_reply_to: Optional[str] = None,
    references: Optional[str] = None,
    message_id: Optional[str] = None,
    cc: Optional[List[str]] = None,
    bcc: Optional[List[str]] = None,
) -> dict:
    """Synchronous email send via Resend SDK."""
    if not RESEND_API_KEY:
        logger.error("❌ EMAIL NOT SENT — RESEND_API_KEY missing")
        return {"success": False, "id": None, "error": "RESEND_API_KEY not configured"}

    # Normalize recipients (accept str or list)
    if isinstance(to_email, str):
        recipients = [to_email]
    else:
        recipients = list(to_email)

    # Test-mode short-circuit: if using onboarding@resend.dev sender and TEST_RECIPIENT
    # is configured, refuse to send to anyone else (saves Resend quota and avoids API errors).
    if SENDER_EMAIL == "onboarding@resend.dev" and TEST_RECIPIENT:
        non_test = [r for r in recipients if r.lower() != TEST_RECIPIENT.lower()]
        if non_test:
            logger.warning(
                f"⚠️ Resend test-mode: skipping send to {non_test} (only {TEST_RECIPIENT} allowed). "
                f"Verify droomvriendjes.com at https://resend.com/domains to send to anyone."
            )
            return {"success": False, "id": None,
                    "error": f"Verzending alleen toegestaan naar geverifieerd test-adres ({TEST_RECIPIENT}) tot domein-verificatie."}

    headers = {}
    msg_id = message_id or make_msgid(domain="droomvriendjes.com")
    headers["Message-ID"] = msg_id
    if in_reply_to:
        headers["In-Reply-To"] = in_reply_to
    if references:
        headers["References"] = references

    params = {
        "from": _from_header(),
        "to": recipients,
        "subject": subject,
        "html": html_content,
        "headers": headers,
    }
    if text_content:
        params["text"] = text_content
    if reply_to:
        params["reply_to"] = reply_to
    if cc:
        params["cc"] = cc
    if bcc:
        params["bcc"] = bcc

    try:
        result = resend.Emails.send(params)
        email_id = result.get("id") if isinstance(result, dict) else None
        logger.info(f"✅ EMAIL SENT via Resend: to={recipients} subject='{subject}' id={email_id}")
        return {"success": True, "id": email_id, "message_id": msg_id, "error": None}
    except Exception as e:
        msg = str(e)
        # Resend test-mode rejection looks like:
        # "You can only send testing emails to your own email address (X)."
        if "testing emails" in msg.lower() or "only send" in msg.lower():
            logger.warning(
                f"⚠️ Resend test-mode restriction: to={recipients} not allowed. "
                f"Verify your domain (droomvriendjes.com) at https://resend.com/domains to send to anyone."
            )
        else:
            logger.error(f"❌ EMAIL FAILED via Resend: to={recipients} subject='{subject}' err={msg}")
        return {"success": False, "id": None, "error": msg}


async def send_email_async(*args, **kwargs) -> dict:
    """Async wrapper — runs the sync SDK in a thread so we don't block the event loop."""
    return await asyncio.to_thread(send_email, *args, **kwargs)


# Legacy-compatible boolean wrapper (drop-in replacement for old send_email)
def send_email_bool(to_email: str, subject: str, html_content: str, text_content: str,
                    reply_to: Optional[str] = None) -> bool:
    return send_email(to_email, subject, html_content, text_content, reply_to=reply_to)["success"]
