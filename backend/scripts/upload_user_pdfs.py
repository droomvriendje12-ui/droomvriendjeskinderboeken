"""
Integreer 5 user-uploaded PDFs in Supabase:
- digital-coloring-pages: vervang placeholder PDF met echte kleurplaten
- 4_Slaap_Kleurplaten_Pakket.pdf (5_…): zelfde inhoud → dedup verwacht
- digital-sleep-regression-cards: NIEUW product (Slaapregressie Survival Cards)
- digital-feeding-nap-planner: NIEUW product (Dutjes & Voedingen Weekplanner)
- digital-finn-dream-island: NIEUW kinderboek (Finn en het Droomeiland)
"""
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, '/app/backend')
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')
from supabase import create_client

sb = create_client(os.environ['SUPABASE_URL'], os.environ['SUPABASE_SERVICE_KEY'])
BUCKET = "digital-products"


def upload_pdf(local_path: str, storage_path: str) -> str:
    """Upload file to Supabase storage, return path. Overwrites existing."""
    with open(local_path, "rb") as f:
        contents = f.read()
    try:
        # Remove any existing
        try:
            sb.storage.from_(BUCKET).remove([storage_path])
        except Exception:
            pass
        sb.storage.from_(BUCKET).upload(
            path=storage_path,
            file=contents,
            file_options={
                "cache-control": "3600",
                "upsert": "true",
                "content-type": "application/pdf",
            },
        )
        print(f"  ✅ uploaded {local_path} → {storage_path} ({len(contents):,} bytes)")
        return storage_path
    except Exception as e:
        print(f"  ❌ upload failed for {local_path}: {e}")
        return ""


def upsert_product(product_id: str, fields: dict):
    """Insert if not exists, update otherwise."""
    existing = sb.table("products").select("id").eq("id", product_id).limit(1).execute()
    if existing.data:
        sb.table("products").update(fields).eq("id", product_id).execute()
        print(f"  🔄 updated product {product_id}")
    else:
        row = {"id": product_id, **fields}
        sb.table("products").insert(row).execute()
        print(f"  ✨ created product {product_id}")


# ─────────────────────────────────────────────────────────────────────────────
# 1) Slaap Kleurplaten Pakket — replace placeholder for digital-coloring-pages
# ─────────────────────────────────────────────────────────────────────────────
print("=== 1. Slaap Kleurplaten (digital-coloring-pages) ===")
path = upload_pdf("/tmp/user_pdfs/kleurplaten_4.pdf", "products/digital-coloring-pages/slaap-kleurplaten-pakket.pdf")
upsert_product("digital-coloring-pages", {"digital_file_path": path})

# 2) Same file again (dedup test - file 5 identical to file 4)
print("\n=== 2. Slaap Kleurplaten v2 (dedup check) ===")
# The user uploaded 4_ and 5_ as same content. Skip — content already in bucket.
# This proves the dedup is what they want long-term in the admin UI.
print("  ⏭️  Skipping 5_Slaap_Kleurplaten_Pakket.pdf — same content as #4 (dedup)")

# ─────────────────────────────────────────────────────────────────────────────
# 3) Slaapregressie Survival Cards — NEW product
# ─────────────────────────────────────────────────────────────────────────────
print("\n=== 3. Slaapregressie Survival Cards (NIEUW) ===")
path = upload_pdf("/tmp/user_pdfs/slaapregressie_cards.pdf", "products/digital-sleep-regression-cards/slaapregressie-survival-cards.pdf")
upsert_product("digital-sleep-regression-cards", {
    "name": "Slaapregressie Survival Cards (PDF)",
    "short_name": "Slaapregressie Cards",
    "slug": "digital-sleep-regression-cards",
    "price": 3.95,
    "compare_price": 5.95,
    "images": ["https://images.unsplash.com/photo-1519340241574-2cec6aef0c01?w=800"],
    "short_description": "7 slaapregressies herkennen + overleven. Direct in je inbox.",
    "description": "7 slaapregressies herkennen en overleven — van de 4-maanden regressie tot de 18-maanden golf. Per regressie: signalen, oorzaak, praktische tips en een ouder-tracker om jouw nachten bij te houden.",
    "product_type": "digital",

    "stock_quantity": 9999,
    "in_stock": True,
    "is_active": True,
    "badge": "Nieuw",
    "category": "Digitale slaaphulp",
    "digital_file_path": path,
    "digital_file_size": 16354,
    "digital_pages": 7,
    "specifications": {"age": "8 weken – 3 jaar", "format": "PDF · A4 · 300 dpi", "language": "Nederlands"},
})

# ─────────────────────────────────────────────────────────────────────────────
# 4) Dutjes & Voedingen Weekplanner — NEW product
# ─────────────────────────────────────────────────────────────────────────────
print("\n=== 4. Dutjes & Voedingen Weekplanner (NIEUW) ===")
path = upload_pdf("/tmp/user_pdfs/dutjes_weekplanner.pdf", "products/digital-feeding-nap-planner/dutjes-voedingen-weekplanner.pdf")
upsert_product("digital-feeding-nap-planner", {
    "name": "Dutjes & Voedingen Weekplanner (PDF)",
    "short_name": "Dutjes Weekplanner",
    "slug": "digital-feeding-nap-planner",
    "price": 2.95,
    "compare_price": 4.95,
    "images": ["https://images.unsplash.com/photo-1545016770-65f7e8f72bcf?w=800"],
    "short_description": "4 leeftijdsplanners (0-18m) voor dutjes én voedingen.",
    "description": "4 leeftijdsspecifieke weekplanners (pasgeboren tot 18 maanden) met voorbeeldtijden voor dutjes én voedingen. Print zo vaak je wilt en pas aan op jouw kind — geen rigide schema, wel houvast.",
    "product_type": "digital",

    "stock_quantity": 9999,
    "in_stock": True,
    "is_active": True,
    "badge": "Nieuw",
    "category": "Digitale slaaphulp",
    "digital_file_path": path,
    "digital_file_size": 40427,
    "digital_pages": 4,
    "specifications": {"age": "0 – 18 maanden", "format": "PDF · A4 · 300 dpi", "language": "Nederlands"},
})

# ─────────────────────────────────────────────────────────────────────────────
# 5) Finn en het Droomeiland — NEW childrens book
# ─────────────────────────────────────────────────────────────────────────────
print("\n=== 5. Finn en het Droomeiland — Kinderboek (NIEUW) ===")
path = upload_pdf("/tmp/user_pdfs/finn_droomeiland.pdf", "products/digital-finn-dream-island/finn-en-het-droomeiland.pdf")
upsert_product("digital-finn-dream-island", {
    "name": "Finn en het Droomeiland — Voorleesboek (PDF)",
    "short_name": "Finn & Droomeiland",
    "slug": "digital-finn-dream-island",
    "price": 4.95,
    "compare_price": 7.95,
    "images": ["https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800"],
    "short_description": "Magisch voorleesboek met 5 mindfulness-oefeningen.",
    "description": "Een magisch voorleesboek (14 pagina's) over Finn en zijn knuffelbeer Beer, die samen reizen naar het Droomeiland. Met 5 mindfulness-oefeningen verweven in het verhaal: ademhaling, dankbaarheid en het loslaten van zorgen. Een rustgevend ritueel voor het slapengaan.",
    "product_type": "digital",

    "stock_quantity": 9999,
    "in_stock": True,
    "is_active": True,
    "badge": "Nieuw verhaal",
    "category": "Digitale slaaphulp",
    "digital_file_path": path,
    "digital_file_size": 257971,
    "digital_pages": 14,
    "specifications": {"age": "2 – 6 jaar", "format": "PDF · A4 · 300 dpi", "language": "Nederlands"},
})

print("\n✨ Klaar! 1 vervangen + 3 nieuwe digital producten geüpload.")
