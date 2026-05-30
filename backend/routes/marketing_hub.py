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
