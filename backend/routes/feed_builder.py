"""
AI Shopping Feed Builder — an optimisation layer on top of the existing
`/api/feed/google-shopping.xml` feed.

It does NOT replace the existing feed (that stays the source of truth). Instead it adds:
- Per-product Merchant Center readiness score + Shopping SEO score
- Missing-attribute detection
- GTIN/EAN validation (check-digit)
- Google product category + product_type suggestions
- AI (GPT-5.2) optimisation of titles and descriptions (admin reviews, stored as overrides)
- CSV + XML export that applies the saved AI overrides

Overrides are stored in MongoDB `feed_overrides` (keyed by product id) so the existing
feed and future Google Merchant API integration can opt-in to them without a rewrite.
"""
import os
import io
import csv
import json
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional
from xml.sax.saxutils import escape

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import Response
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/shopping-feed", tags=["shopping-feed"])
_security = HTTPBearer(auto_error=False)

_db = None
_admin_verifier = None

SHOP_URL = os.environ.get("SHOP_URL", "https://droomvriendjes.com")
DEFAULT_GOOGLE_CATEGORY = "Toys & Games > Toys > Baby & Toddler Toys"
DEFAULT_GOOGLE_CATEGORY_ID = "588"


def set_database(database):
    global _db
    _db = database


def set_admin_verifier(verifier):
    global _admin_verifier
    _admin_verifier = verifier


def _require_admin(credentials: HTTPAuthorizationCredentials = Depends(_security)):
    if _admin_verifier is None:
        raise HTTPException(status_code=500, detail="Auth not configured")
    if not _admin_verifier(credentials):
        raise HTTPException(status_code=401, detail="Niet geautoriseerd")
    return True


def _supabase():
    from supabase import create_client
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        raise HTTPException(status_code=503, detail="Supabase niet geconfigureerd")
    return create_client(url, key)


def _fetch_products() -> list:
    """Fetch raw products from Supabase, normalised to the fields we need."""
    sb = _supabase()
    res = sb.table("products").select("*").execute()
    out = []
    for p in (res.data or []):
        raw_images = p.get("images")
        if isinstance(raw_images, str):
            try:
                raw_images = json.loads(raw_images)
            except Exception:
                raw_images = []
        images = []
        for g in (raw_images or []):
            if isinstance(g, str):
                images.append(g)
            elif isinstance(g, dict) and g.get("url"):
                images.append(g["url"])
        # Only include real, sellable products in the Shopping feed
        kind = (p.get("product_type") or "physical").lower()
        category = p.get("category") or "Slaapknuffels"
        out.append({
            "id": str(p.get("id")),
            "name": p.get("name") or "",
            "description": p.get("description") or p.get("short_description") or "",
            "price": p.get("price") or 0,
            "original_price": p.get("compare_price"),
            "image": images[0] if images else "",
            "images": images,
            "in_stock": p.get("in_stock", True),
            "gtin": p.get("gtin") or p.get("ean") or p.get("barcode") or "",
            "brand": p.get("brand") or "Droomvriendjes",
            "category": category,
            "kind": kind,
            "product_type_raw": "",  # the DB `product_type` is the product KIND, not a Shopping type
        })
    return out


# ---------------------------------------------------------------- validation
def validate_gtin(gtin: str) -> str:
    """Return 'missing' | 'invalid_length' | 'invalid_checksum' | 'valid'."""
    if not gtin:
        return "missing"
    digits = "".join(ch for ch in str(gtin) if ch.isdigit())
    if len(digits) not in (8, 12, 13, 14):
        return "invalid_length"
    nums = [int(d) for d in digits]
    check = nums[-1]
    body = nums[:-1][::-1]
    total = sum(n * (3 if i % 2 == 0 else 1) for i, n in enumerate(body))
    calc = (10 - (total % 10)) % 10
    return "valid" if calc == check else "invalid_checksum"


def _product_type(p: dict) -> str:
    if p.get("product_type_raw"):
        return p["product_type_raw"]
    cat = p.get("category") or "Slaapknuffels"
    base = "Printables & Downloads" if p.get("kind") == "digital" else "Speelgoed > Knuffels"
    return f"{base} > {cat}"


def _audit_one(p: dict, override: Optional[dict]) -> dict:
    title = (override or {}).get("title") or p["name"]
    description = (override or {}).get("description") or p["description"]
    product_type = (override or {}).get("product_type") or _product_type(p)
    google_cat = (override or {}).get("google_product_category") or DEFAULT_GOOGLE_CATEGORY

    missing = []
    if not title:
        missing.append("title")
    if not description or len(description) < 50:
        missing.append("description")
    if not p["images"]:
        missing.append("image_link")
    if not p["price"] or float(p["price"]) <= 0:
        missing.append("price")
    if not product_type:
        missing.append("product_type")

    gtin_status = validate_gtin(p["gtin"])
    # Own-brand products may legitimately omit GTIN (identifier_exists=no)
    identifier_ok = gtin_status == "valid" or (gtin_status == "missing" and p["brand"])

    # --- Merchant Center readiness (presence of required attributes) ---
    required_checks = {
        "title": bool(title),
        "description": bool(description) and len(description) >= 50,
        "image": bool(p["images"]),
        "price": bool(p["price"]) and float(p["price"]) > 0,
        "brand": bool(p["brand"]),
        "availability": True,
        "condition": True,
        "google_product_category": bool(google_cat),
        "identifier": identifier_ok,
    }
    mc_score = round(100 * sum(1 for v in required_checks.values() if v) / len(required_checks))

    # --- Shopping SEO score (quality, not just presence) ---
    seo = 0
    title_len = len(title)
    if 30 <= title_len <= 150:
        seo += 25
    elif title_len > 0:
        seo += 12
    if len(title.split()) >= 4:
        seo += 10
    brand_l = (p["brand"] or "").lower()
    if brand_l and brand_l in title.lower():
        seo += 10
    desc_len = len(description)
    if desc_len >= 500:
        seo += 25
    elif desc_len >= 160:
        seo += 15
    elif desc_len > 0:
        seo += 5
    if len(p["images"]) >= 3:
        seo += 15
    elif len(p["images"]) >= 2:
        seo += 10
    elif len(p["images"]) == 1:
        seo += 5
    if product_type and product_type.count(">") >= 1:
        seo += 10
    if p["price"] and float(p["price"]) > 0:
        seo += 5
    seo_score = min(100, seo)

    return {
        "id": p["id"],
        "name": p["name"],
        "title": title,
        "title_length": title_len,
        "description_length": desc_len,
        "image_count": len(p["images"]),
        "price": p["price"],
        "product_type": product_type,
        "google_product_category": google_cat,
        "gtin": p["gtin"],
        "gtin_status": gtin_status,
        "missing_attributes": missing,
        "merchant_readiness_score": mc_score,
        "shopping_seo_score": seo_score,
        "has_override": bool(override),
        "category_suggestion": DEFAULT_GOOGLE_CATEGORY,
        "product_type_suggestion": _product_type(p),
    }


@router.get("/audit")
async def audit(_admin=Depends(_require_admin)):
    """Full feed audit: per-product readiness + SEO scores + missing attributes."""
    products = _fetch_products()
    overrides = {}
    if _db is not None:
        for o in await _db.feed_overrides.find({}, {"_id": 0}).to_list(length=1000):
            overrides[str(o.get("product_id"))] = o
    items = [_audit_one(p, overrides.get(p["id"])) for p in products]
    n = len(items) or 1
    summary = {
        "total_products": len(items),
        "avg_merchant_readiness": round(sum(i["merchant_readiness_score"] for i in items) / n),
        "avg_shopping_seo": round(sum(i["shopping_seo_score"] for i in items) / n),
        "products_with_issues": sum(1 for i in items if i["missing_attributes"]),
        "gtin_missing": sum(1 for i in items if i["gtin_status"] == "missing"),
        "gtin_invalid": sum(1 for i in items if i["gtin_status"] in ("invalid_length", "invalid_checksum")),
        "optimised": sum(1 for i in items if i["has_override"]),
    }
    return {"summary": summary, "products": items, "feed_url": f"{SHOP_URL}/api/feed/google-shopping.xml"}


# ---------------------------------------------------------------- AI optimise
class OptimizeRequest(BaseModel):
    product_id: str
    save: bool = True


@router.post("/optimize")
async def optimize(payload: OptimizeRequest, _admin=Depends(_require_admin)):
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="AI niet geconfigureerd (EMERGENT_LLM_KEY ontbreekt)")
    products = {p["id"]: p for p in _fetch_products()}
    p = products.get(str(payload.product_id))
    if not p:
        raise HTTPException(status_code=404, detail="Product niet gevonden")

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        system_message = (
            "Je bent een Google Shopping / Merchant Center feed-specialist voor Droomvriendjes "
            "(premium slaapknuffels met nachtlampje, sterrenprojector en white noise voor kinderen 0-6 jaar). "
            "Je optimaliseert producttitels en -beschrijvingen voor maximale Shopping-CTR en relevantie. "
            "Titel: max 150 tekens, belangrijkste zoekwoorden vooraan (merk + producttype + topkenmerk), geen ALL CAPS, "
            "geen promotaal zoals 'gratis' of '!'. Beschrijving: 500-700 tekens, eerste zin pakkend, "
            "verwerk relevante zoekwoorden natuurlijk, noem materiaal/leeftijd/USP's. "
            "Antwoord UITSLUITEND met geldige JSON (geen markdown)."
        )
        prompt = (
            "Optimaliseer dit product voor Google Shopping in het Nederlands.\n"
            f"Naam: {p['name']}\n"
            f"Huidige beschrijving: {p['description'][:600]}\n"
            f"Prijs: € {p['price']}\n"
            f"Categorie: {_product_type(p)}\n\n"
            "Lever exact dit JSON-object:\n"
            "{\n"
            '  "title": "geoptimaliseerde titel (max 150 tekens)",\n'
            '  "description": "geoptimaliseerde beschrijving (500-700 tekens)",\n'
            '  "product_type": "Categorie > Subcategorie > Type",\n'
            '  "google_product_category": "Toys & Games > Toys > ...",\n'
            '  "suggested_keywords": ["5-8 relevante shopping-zoekwoorden"]\n'
            "}"
        )
        chat = LlmChat(
            api_key=api_key,
            session_id=f"feed-{uuid.uuid4().hex[:8]}",
            system_message=system_message,
        ).with_model("openai", "gpt-5.2")
        resp = await chat.send_message(UserMessage(text=prompt))
        text = (resp or "").strip()
        if text.startswith("```"):
            import re
            text = re.sub(r"^```[a-zA-Z]*\n?", "", text).rsplit("```", 1)[0]
        data = json.loads(text)
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="AI gaf ongeldige opmaak terug, probeer opnieuw.")
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Feed optimalisatie faalde")
        raise HTTPException(status_code=502, detail=f"AI-optimalisatie mislukt: {exc}")

    override = {
        "product_id": str(payload.product_id),
        "title": data.get("title", "").strip(),
        "description": data.get("description", "").strip(),
        "product_type": data.get("product_type", "").strip(),
        "google_product_category": data.get("google_product_category", "").strip() or DEFAULT_GOOGLE_CATEGORY,
        "suggested_keywords": data.get("suggested_keywords", []),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if payload.save and _db is not None:
        await _db.feed_overrides.update_one(
            {"product_id": str(payload.product_id)}, {"$set": override}, upsert=True
        )
    return override


@router.delete("/optimize/{product_id}")
async def remove_override(product_id: str, _admin=Depends(_require_admin)):
    if _db is not None:
        await _db.feed_overrides.delete_one({"product_id": str(product_id)})
    return {"status": "ok"}


# ---------------------------------------------------------------- exports
async def _build_rows():
    products = _fetch_products()
    overrides = {}
    if _db is not None:
        for o in await _db.feed_overrides.find({}, {"_id": 0}).to_list(length=1000):
            overrides[str(o.get("product_id"))] = o
    rows = []
    for p in products:
        ov = overrides.get(p["id"]) or {}
        title = ov.get("title") or p["name"]
        description = ov.get("description") or p["description"]
        product_type = ov.get("product_type") or _product_type(p)
        google_cat = ov.get("google_product_category") or DEFAULT_GOOGLE_CATEGORY
        price = float(p["price"] or 0)
        sale = None
        if p["original_price"] and float(p["original_price"]) > price:
            sale = price
            price = float(p["original_price"])
        rows.append({
            "id": p["id"],
            "title": title,
            "description": description[:5000],
            "link": f"{SHOP_URL}/product/{p['id']}",
            "image_link": p["image"],
            "additional_image_links": p["images"][1:6],
            "availability": "in_stock" if p["in_stock"] else "out_of_stock",
            "price": f"{price:.2f} EUR",
            "sale_price": (f"{sale:.2f} EUR" if sale is not None else None),
            "brand": p["brand"],
            "condition": "new",
            "gtin": p["gtin"] if validate_gtin(p["gtin"]) == "valid" else "",
            "identifier_exists": "yes" if validate_gtin(p["gtin"]) == "valid" else "no",
            "google_product_category": google_cat,
            "product_type": product_type,
        })
    return rows


@router.get("/export.csv")
async def export_csv(_admin=Depends(_require_admin)):
    rows = await _build_rows()
    buf = io.StringIO()
    buf.write("\ufeff")  # UTF-8 BOM for Excel
    cols = ["id", "title", "description", "link", "image_link", "additional_image_link",
            "availability", "price", "sale_price", "brand", "condition", "gtin",
            "identifier_exists", "google_product_category", "product_type"]
    w = csv.DictWriter(buf, fieldnames=cols, delimiter=",", extrasaction="ignore")
    w.writeheader()
    for r in rows:
        w.writerow({
            **r,
            "additional_image_link": ",".join(r.get("additional_image_links") or []),
            "sale_price": r.get("sale_price") or "",
        })
    return Response(
        content=buf.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="droomvriendjes-merchant-feed.csv"'},
    )


@router.get("/export.xml")
async def export_xml(_admin=Depends(_require_admin)):
    rows = await _build_rows()
    parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
        "  <channel>",
        "    <title>Droomvriendjes - AI Geoptimaliseerde Shopping Feed</title>",
        f"    <link>{SHOP_URL}</link>",
        "    <description>AI-geoptimaliseerde Merchant Center feed. Gratis verzending en 14 dagen retour.</description>",
    ]
    for r in rows:
        parts.append("    <item>")
        parts.append(f"      <g:id>{escape(r['id'])}</g:id>")
        parts.append(f"      <g:title><![CDATA[{r['title']}]]></g:title>")
        parts.append(f"      <g:description><![CDATA[{r['description']}]]></g:description>")
        parts.append(f"      <g:link>{escape(r['link'])}</g:link>")
        parts.append(f"      <g:image_link>{escape(r['image_link'])}</g:image_link>")
        for img in r.get("additional_image_links") or []:
            parts.append(f"      <g:additional_image_link>{escape(img)}</g:additional_image_link>")
        parts.append(f"      <g:availability>{r['availability']}</g:availability>")
        parts.append(f"      <g:price>{r['price']}</g:price>")
        if r.get("sale_price"):
            parts.append(f"      <g:sale_price>{r['sale_price']}</g:sale_price>")
        parts.append(f"      <g:brand>{escape(r['brand'])}</g:brand>")
        parts.append(f"      <g:condition>{r['condition']}</g:condition>")
        if r.get("gtin"):
            parts.append(f"      <g:gtin>{escape(r['gtin'])}</g:gtin>")
        parts.append(f"      <g:identifier_exists>{r['identifier_exists']}</g:identifier_exists>")
        parts.append(f"      <g:google_product_category><![CDATA[{r['google_product_category']}]]></g:google_product_category>")
        parts.append(f"      <g:product_type><![CDATA[{r['product_type']}]]></g:product_type>")
        parts.append("    </item>")
    parts.append("  </channel>")
    parts.append("</rss>")
    return Response(content="\n".join(parts), media_type="application/xml")
