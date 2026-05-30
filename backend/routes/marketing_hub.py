"""Marketing & Sales Hub endpoints.

Powers the floating "Marketing & Sales Hub" modal in the admin command center:
- best-sellers of the current day (commercial snapshot)
- AI-generated ad copy (GPT-5.2 via the Emergent universal LLM key)
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timezone
import os
import logging

router = APIRouter(prefix="/marketing-hub", tags=["marketing-hub"])
logger = logging.getLogger(__name__)

supabase = None
verify_admin_token = None
_security = HTTPBearer()

PAID_STATUSES = {"paid", "shipped", "delivered", "completed", "fulfilled"}


def set_supabase_client(client):
    global supabase
    supabase = client


def set_admin_verifier(verifier):
    global verify_admin_token
    verify_admin_token = verifier


def _require_admin(creds: HTTPAuthorizationCredentials = Depends(_security)):
    if verify_admin_token is None:
        raise HTTPException(status_code=500, detail="Admin verifier not configured")
    return verify_admin_token(creds)


@router.get("/best-sellers-today")
async def best_sellers_today(_admin=Depends(_require_admin)):
    """Best verkochte producten van vandaag (commerciële snapshot)."""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Supabase niet geconfigureerd")

    now = datetime.now(timezone.utc)
    start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()

    try:
        orders = supabase.table("orders").select(
            "id,total_amount,status,created_at"
        ).gte("created_at", start).execute()
        rows = orders.data or []
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Orders ophalen faalde: {exc}")

    paid = [o for o in rows if (o.get("status") or "").lower() in PAID_STATUSES]
    paid_ids = [o["id"] for o in paid if o.get("id")]
    revenue_today = sum(float(o.get("total_amount") or 0) for o in paid)

    counts = {}
    for i in range(0, len(paid_ids), 50):
        batch = paid_ids[i:i + 50]
        try:
            items = supabase.table("order_items").select(
                "product_name,product_sku,quantity,unit_price"
            ).in_("order_id", batch).execute()
            item_rows = items.data or []
        except Exception as exc:
            logger.warning(f"order_items batch faalde: {exc}")
            item_rows = []
        for it in item_rows:
            name = it.get("product_name") or "Onbekend product"
            qty = int(it.get("quantity") or 1)
            price = float(it.get("unit_price") or 0)
            c = counts.setdefault(name, {
                "name": name, "product_id": it.get("product_sku") or "", "units": 0, "revenue": 0.0
            })
            c["units"] += qty
            c["revenue"] += price * qty

    top = sorted(counts.values(), key=lambda x: x["revenue"], reverse=True)[:5]
    for t in top:
        t["revenue"] = round(t["revenue"], 2)

    return {
        "date": now.strftime("%Y-%m-%d"),
        "orders_today": len(paid),
        "revenue_today": round(revenue_today, 2),
        "top_products": top,
    }


@router.get("/dashboard-pdf")
async def dashboard_pdf(_admin=Depends(_require_admin)):
    """Premium, merk-gebrand analytics-overzicht (vandaag + laatste 30 dagen) als PDF."""
    from fastapi.responses import Response
    if supabase is None:
        raise HTTPException(status_code=500, detail="Supabase niet geconfigureerd")

    from datetime import timedelta
    now = datetime.now(timezone.utc)
    start_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start_30 = (start_today - timedelta(days=30))

    try:
        res = supabase.table("orders").select(
            "id,total_amount,status,created_at"
        ).gte("created_at", start_30.isoformat()).execute()
        rows = res.data or []
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Orders ophalen faalde: {exc}")

    def is_paid(o):
        return (o.get("status") or "").lower() in PAID_STATUSES

    paid_30 = [o for o in rows if is_paid(o)]
    paid_today = [o for o in paid_30 if (o.get("created_at") or "") >= start_today.isoformat()]
    rev_30 = sum(float(o.get("total_amount") or 0) for o in paid_30)
    rev_today = sum(float(o.get("total_amount") or 0) for o in paid_today)
    aov = (rev_30 / len(paid_30)) if paid_30 else 0

    # top products over 30d
    ids = [o["id"] for o in paid_30 if o.get("id")]
    counts = {}
    for i in range(0, len(ids), 50):
        batch = ids[i:i + 50]
        try:
            items = supabase.table("order_items").select(
                "product_name,quantity,unit_price"
            ).in_("order_id", batch).execute()
            item_rows = items.data or []
        except Exception:
            item_rows = []
        for it in item_rows:
            name = it.get("product_name") or "Onbekend product"
            qty = int(it.get("quantity") or 1)
            price = float(it.get("unit_price") or 0)
            c = counts.setdefault(name, {"name": name, "units": 0, "revenue": 0.0})
            c["units"] += qty
            c["revenue"] += price * qty
    top = sorted(counts.values(), key=lambda x: x["revenue"], reverse=True)[:8]

    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.units import mm
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    import io

    BROWN = colors.HexColor("#8a5a3b")
    DARK = colors.HexColor("#3a2a1e")
    CREAM = colors.HexColor("#f7f1ea")
    GREY = colors.HexColor("#6b5d50")

    def eur(n):
        return f"EUR {float(n):.2f}".replace(".", ",")

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=18 * mm, bottomMargin=16 * mm,
                            leftMargin=15 * mm, rightMargin=15 * mm, title="Droomvriendjes - Analytics")
    h1 = ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=22, textColor=DARK, leading=26)
    sub = ParagraphStyle("sub", fontName="Helvetica", fontSize=11, textColor=BROWN, leading=14, spaceBefore=2)
    meta = ParagraphStyle("meta", fontName="Helvetica", fontSize=8.5, textColor=GREY, leading=12)
    kpi_lbl = ParagraphStyle("kl", fontName="Helvetica", fontSize=9, textColor=GREY)
    kpi_val = ParagraphStyle("kv", fontName="Helvetica-Bold", fontSize=16, textColor=DARK, spaceBefore=2)
    cell = ParagraphStyle("cell", fontName="Helvetica", fontSize=9, textColor=DARK, leading=12)
    cell_b = ParagraphStyle("cb", fontName="Helvetica-Bold", fontSize=9, textColor=DARK, leading=12)
    head_c = ParagraphStyle("hc", fontName="Helvetica-Bold", fontSize=9, textColor=colors.white, leading=12)

    elems = [
        Paragraph("Droomvriendjes", h1),
        Paragraph("Verkoop &amp; Conversie — Overzicht", sub),
        Paragraph(f"Gegenereerd op {now.strftime('%d-%m-%Y %H:%M')} · periode laatste 30 dagen", meta),
        Spacer(1, 7 * mm),
    ]

    kpis = [[
        Paragraph("Omzet (30 dagen)", kpi_lbl), Paragraph("Bestellingen (30d)", kpi_lbl),
        Paragraph("Gem. orderwaarde", kpi_lbl), Paragraph("Omzet vandaag", kpi_lbl),
    ], [
        Paragraph(eur(rev_30), kpi_val), Paragraph(str(len(paid_30)), kpi_val),
        Paragraph(eur(aov), kpi_val), Paragraph(eur(rev_today), kpi_val),
    ]]
    kt = Table(kpis, colWidths=[45 * mm, 45 * mm, 45 * mm, 45 * mm])
    kt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CREAM),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#e6dccf")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.white),
        ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
    ]))
    elems.append(kt)
    elems.append(Spacer(1, 8 * mm))

    elems.append(Paragraph("Best verkochte producten (30 dagen)", sub))
    elems.append(Spacer(1, 3 * mm))
    data = [[Paragraph("#", head_c), Paragraph("Product", head_c), Paragraph("Aantal", head_c), Paragraph("Omzet", head_c)]]
    if top:
        for i, p in enumerate(top, 1):
            data.append([Paragraph(str(i), cell), Paragraph(p["name"], cell_b),
                         Paragraph(str(p["units"]), cell), Paragraph(eur(round(p["revenue"], 2)), cell)])
    else:
        data.append([Paragraph("—", cell), Paragraph("Nog geen verkopen in deze periode", cell), Paragraph("—", cell), Paragraph("—", cell)])
    tbl = Table(data, colWidths=[12 * mm, 110 * mm, 28 * mm, 30 * mm], repeatRows=1)
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BROWN),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, CREAM]),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("LINEBELOW", (0, 1), (-1, -1), 0.4, colors.HexColor("#e6dccf")),
    ]))
    elems.append(tbl)
    elems.append(Spacer(1, 6 * mm))
    elems.append(Paragraph("Droomvriendjes · droomvriendjes.com · automatisch gegenereerd analytics-rapport", meta))

    doc.build(elems)
    pdf = buf.getvalue()
    fname = f"droomvriendjes-analytics-{now.strftime('%Y%m%d')}.pdf"
    return Response(content=pdf, media_type="application/pdf",
                    headers={"Content-Disposition": f'inline; filename="{fname}"'})


@router.post("/ad-copy")
async def generate_ad_copy(payload: dict, _admin=Depends(_require_admin)):
    """Genereer advertentietekst voor een product/platform met GPT-5.2."""
    product_name = (payload.get("product_name") or "").strip()
    platform = (payload.get("platform") or "instagram").strip().lower()
    if not product_name:
        raise HTTPException(status_code=400, detail="product_name is vereist")

    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="AI niet geconfigureerd (EMERGENT_LLM_KEY ontbreekt)")

    platform_label = {
        "instagram": "Instagram", "tiktok": "TikTok", "x": "X (Twitter)",
        "facebook": "Facebook", "google": "Google Ads",
    }.get(platform, platform)

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage

        system_message = (
            "Je bent een Nederlandse social media copywriter voor Droomvriendjes, een webshop in "
            "slaapknuffels met nachtlampje en white noise voor kinderen (en volwassenen). Schrijf "
            "pakkende, warme, verkoop-gerichte advertentietekst. Spreek ouders aan op emotie: rust, "
            "betere nachtrust, geborgenheid en minder zorgen. Gebruik 1 sterke hook, korte zinnen, een "
            "duidelijke call-to-action en relevante emoji's met mate. Verzin geen onwaarheden of medische claims."
        )
        prompt = (
            f"Schrijf advertentietekst voor het product '{product_name}' voor het platform {platform_label}.\n"
            f"Stem toon en lengte af op {platform_label}.\n"
            f"Antwoord in het Nederlands met exact deze kopjes op aparte regels:\n"
            f"HOOK: (1 krachtige zin)\n"
            f"TEKST: (2-4 wervende zinnen)\n"
            f"CTA: (1 duidelijke call-to-action)\n"
            f"HASHTAGS: (8-12 relevante Nederlandse hashtags, gescheiden door spaties)"
        )
        chat = LlmChat(
            api_key=api_key,
            session_id=f"adcopy-{platform}-{datetime.now(timezone.utc).timestamp()}",
            system_message=system_message,
        ).with_model("openai", "gpt-5.2")
        resp = await chat.send_message(UserMessage(text=prompt))
        return {"platform": platform, "product_name": product_name, "copy": resp}
    except Exception as exc:
        logger.exception("Ad-copy generatie faalde")
        raise HTTPException(status_code=502, detail=f"AI-generatie mislukt: {exc}")
