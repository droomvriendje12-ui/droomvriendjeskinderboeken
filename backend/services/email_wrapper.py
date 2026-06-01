"""
Mobile-first, high-contrast HTML wrapper for outgoing inbox e-mails
(reply + compose). Guarantees WCAG-compliant readability regardless of
the typed content: a white text card (#FFFFFF) with dark text (#2A2A2A)
on a soft warm page background, responsive on mobile with larger fonts
and full-width buttons.

Used centrally in routes/inbox.py `_send_smtp`. Full HTML documents
(e.g. uploaded marketing templates) are detected and left untouched.
"""

PAGE_BG = "#F4ECE3"
CARD_BG = "#FFFFFF"
TEXT_COLOR = "#2A2A2A"  # ~13:1 contrast on white → WCAG AAA


def is_full_document(html: str) -> bool:
    low = (html or "").lower()
    return "<!doctype" in low or "<html" in low


def wrap_email(inner_html: str) -> str:
    """Wrap an HTML fragment in a responsive, high-contrast e-mail shell."""
    if is_full_document(inner_html):
        return inner_html
    return f"""<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<title>Droomvriendjes</title>
<style>
  body {{ margin:0; padding:0; background-color:{PAGE_BG}; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }}
  table {{ border-collapse:collapse; }}
  img {{ border:0; line-height:100%; outline:none; text-decoration:none; max-width:100%; height:auto; }}
  a {{ color:#B25E2B; }}
  .dv-content {{ font-family:Helvetica,Arial,sans-serif; font-size:16px; line-height:1.7; color:{TEXT_COLOR}; }}
  .dv-content p {{ margin:0 0 16px 0; }}
  .dv-btn {{ display:inline-block; background-color:#C9743A; color:#FFFFFF !important; text-decoration:none;
            font-weight:700; font-size:16px; padding:14px 28px; border-radius:999px; }}
  @media only screen and (max-width:600px) {{
    .dv-card {{ width:100% !important; border-radius:0 !important; }}
    .dv-pad {{ padding:24px 20px !important; }}
    .dv-content, .dv-content p {{ font-size:17px !important; line-height:1.75 !important; }}
    .dv-btn {{ display:block !important; width:100% !important; text-align:center !important; padding:16px 20px !important; }}
  }}
</style>
</head>
<body>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:{PAGE_BG};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" class="dv-card" width="600" cellpadding="0" cellspacing="0"
               style="max-width:600px;width:100%;background-color:{CARD_BG};border-radius:16px;overflow:hidden;">
          <tr>
            <td class="dv-pad dv-content" style="padding:32px 36px;background-color:{CARD_BG};">
              {inner_html}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""
