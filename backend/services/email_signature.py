"""
Branded e-mail signature for the admin inbox (reply + compose).

Appended centrally in routes/inbox.py `_send_smtp` so every customer-facing
reply/compose carries a consistent, professional Droomvriendjes footer.
Transactional order mails use their own templates and are NOT affected.

Email-safe: inline styles only, table layout, hosted PNG logo (SVG is blocked
by Gmail). A styled text wordmark always renders even if images are disabled.
"""

LOGO_URL = (
    "https://plxbmkwuacbdzookygtg.supabase.co/storage/v1/object/public/"
    "product-images/branding/droomvriendjes-logo-email.png"
)
WEBSITE_URL = "https://www.droomvriendjes.com"
RETURNS_URL = "https://www.droomvriendjes.com/retourneren"
INSTAGRAM_URL = "https://www.instagram.com/droom_vriendjes/"
TIKTOK_URL = "https://www.tiktok.com/@droomvriendjes"
SUPPORT_EMAIL = "info@droomvriendjes.com"

# Sentinel so we never append the signature twice within one body.
_SIGNATURE_MARKER = "data-dv-signature=\"1\""

_SIGNATURE_HTML = f"""
<div {_SIGNATURE_MARKER} style="margin-top:28px;padding-top:20px;border-top:1px solid #E8DDD2;font-family:Helvetica,Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
    <tr>
      <td style="vertical-align:middle;padding-right:16px;">
        <img src="{LOGO_URL}" alt="Droomvriendjes" width="56" height="56" style="display:block;border:0;border-radius:12px;" />
      </td>
      <td style="vertical-align:middle;">
        <div style="font-size:16px;font-weight:700;color:#6F4831;letter-spacing:0.2px;">Droomvriendjes</div>
        <div style="font-size:12px;color:#A26A49;margin-top:2px;">Knuffels die rust en geborgenheid brengen</div>
      </td>
    </tr>
  </table>

  <div style="font-size:13px;color:#8B5A3D;margin-top:14px;line-height:1.6;">
    <a href="{WEBSITE_URL}" style="color:#8B5A3D;text-decoration:none;font-weight:600;">Website</a>
    <span style="color:#D4BFA9;">&nbsp;&middot;&nbsp;</span>
    <a href="{INSTAGRAM_URL}" style="color:#8B5A3D;text-decoration:none;font-weight:600;">Instagram</a>
    <span style="color:#D4BFA9;">&nbsp;&middot;&nbsp;</span>
    <a href="{TIKTOK_URL}" style="color:#8B5A3D;text-decoration:none;font-weight:600;">TikTok</a>
    <span style="color:#D4BFA9;">&nbsp;&middot;&nbsp;</span>
    <a href="{RETURNS_URL}" style="color:#8B5A3D;text-decoration:none;font-weight:600;">14 dagen retour</a>
  </div>

  <div style="font-size:11px;color:#C08F70;margin-top:10px;line-height:1.5;">
    Vragen? Mail ons gerust op
    <a href="mailto:{SUPPORT_EMAIL}" style="color:#C08F70;text-decoration:underline;">{SUPPORT_EMAIL}</a>.
  </div>
</div>
""".strip()

_SIGNATURE_TEXT = (
    "\n\n--\n"
    "Droomvriendjes — Knuffels die rust en geborgenheid brengen\n"
    f"Website: {WEBSITE_URL}\n"
    f"Instagram: {INSTAGRAM_URL}\n"
    f"TikTok: {TIKTOK_URL}\n"
    f"14 dagen retour: {RETURNS_URL}\n"
    f"Vragen? Mail ons op {SUPPORT_EMAIL}"
)


def append_signature(body_html: str, body_text: str) -> tuple[str, str]:
    """Return (html, text) with the branded footer appended.

    Idempotent: if the signature marker is already present, returns unchanged.
    """
    html = body_html or ""
    text = body_text or ""
    if _SIGNATURE_MARKER not in html:
        html = f"{html}{_SIGNATURE_HTML}"
    if "Droomvriendjes — Knuffels die rust" not in text:
        text = f"{text}{_SIGNATURE_TEXT}"
    return html, text
