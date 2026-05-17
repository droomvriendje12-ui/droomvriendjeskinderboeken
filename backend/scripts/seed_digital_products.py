"""
Seed 5 digitale producten in Supabase + upload bijbehorende PDFs naar de
'digital-products' bucket.

Producten gebaseerd op Etsy best-seller research (kids sleep/bedtime niche).

Gebruik:
    cd /app/backend && python -m scripts.seed_digital_products
"""
import os
import sys
import uuid
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from supabase import create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
BUCKET = "digital-products"

sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

PDFS_DIR = Path("/tmp/digital_products")

PRODUCTS = [
    {
        "id": "digital-bedtime-chart",
        "name": "Slaapritueel Schema (PDF)",
        "short_name": "Slaapritueel Schema",
        "slug": "slaapritueel-schema-pdf",
        "price": 4.95,
        "compare_price": 9.95,
        "description": "Het perfecte 7-staps slaapritueel schema dat je vandaag nog kunt uitprinten. Bewezen helpt het kinderen sneller in slaap te vallen. 21-dagen routine inbegrepen.",
        "short_description": "Print direct - 7-staps avondritueel voor rustige nachten.",
        "category": "Digital",
        "badge": "Direct download",
        "sku": "DIG-BED-001",
        "pdf": "01-slaapritueel-schema.pdf",
        "pages": 1,
        "image": "https://placehold.co/600x400/F59E0B/ffffff/png?text=Slaapritueel+Schema",
    },
    {
        "id": "digital-sleep-tracker",
        "name": "Slaaplog 30 Dagen (PDF)",
        "short_name": "Slaaplog 30 Dagen",
        "slug": "slaaplog-30-dagen-pdf",
        "price": 3.95,
        "compare_price": 7.95,
        "description": "Ontdek het slaappatroon van je kind met deze 30-dagen tracker. Vul elke ochtend in en herken patronen - bedtijd, inslaaptijd, nachtelijk wakker worden, stemming. Perfect voor ouders die op zoek zijn naar grip op de nachtrust.",
        "short_description": "30 dagen tracker om slaappatronen te herkennen.",
        "category": "Digital",
        "badge": "Bestseller",
        "sku": "DIG-LOG-001",
        "pdf": "02-slaaplog-30dagen.pdf",
        "pages": 1,
        "image": "https://placehold.co/600x400/6366F1/ffffff/png?text=Slaaplog+30+dagen",
    },
    {
        "id": "digital-affirmation-cards",
        "name": "12 Slaap Affirmatiekaartjes (PDF)",
        "short_name": "Slaap Affirmatiekaartjes",
        "slug": "slaap-affirmatiekaartjes-pdf",
        "price": 5.95,
        "compare_price": 11.95,
        "description": "12 liefdevolle bedtijd-affirmaties om uit te knippen, bijvoorbeeld 'Ik voel mij veilig en geborgen'. Hang ze op of leg ze onder het kussen. Versterkt zelfvertrouwen en helpt bij angst en piekergedachten voor het slapen.",
        "short_description": "12 prachtige affirmatiekaartjes om uit te knippen.",
        "category": "Digital",
        "badge": "Nieuw",
        "sku": "DIG-AFF-001",
        "pdf": "03-slaap-affirmatiekaartjes.pdf",
        "pages": 1,
        "image": "https://placehold.co/600x400/FB7185/ffffff/png?text=Affirmatiekaartjes",
    },
    {
        "id": "digital-coloring-pages",
        "name": "Slaap Kleurplaten Pakket (PDF)",
        "short_name": "Slaap Kleurplaten",
        "slug": "slaap-kleurplaten-pakket-pdf",
        "price": 2.95,
        "compare_price": 6.95,
        "description": "4 rustgevende kleurplaten met bedtime-thema: maan & sterren, knuffel in bed, slapend dier en droomwolken. Perfect ontspanmoment voor het slapen gaan. Print zo vaak als je wilt.",
        "short_description": "4 mooie kleurplaten voor rustige avonden.",
        "category": "Digital",
        "badge": "Populair",
        "sku": "DIG-COL-001",
        "pdf": "04-slaap-kleurplaten.pdf",
        "pages": 4,
        "image": "https://placehold.co/600x400/10B981/ffffff/png?text=Kleurplaten",
    },
    {
        "id": "digital-visual-schedule",
        "name": "Visueel Slaapschema Peuters (PDF)",
        "short_name": "Visueel Slaapschema",
        "slug": "visueel-slaapschema-peuters-pdf",
        "price": 4.95,
        "compare_price": 9.95,
        "description": "Voor peuters en kleuters die nog niet kunnen lezen. 8 visuele stappen die je kind helpen zelfstandig naar bed te gaan. Ook geschikt voor kinderen met autisme of speciale behoeften.",
        "short_description": "Plaatjes-schema voor zelfstandige bedtijd-routine.",
        "category": "Digital",
        "badge": "Premium",
        "sku": "DIG-VIS-001",
        "pdf": "05-visueel-slaapschema-peuters.pdf",
        "pages": 1,
        "image": "https://placehold.co/600x400/8B5CF6/ffffff/png?text=Visueel+Schema",
    },
]


def upload_pdf(pdf_filename, product_id):
    src = PDFS_DIR / pdf_filename
    if not src.exists():
        print(f"  ⚠️  PDF niet gevonden: {src}")
        return None
    contents = src.read_bytes()
    unique = uuid.uuid4().hex[:8]
    storage_path = f"products/{product_id}/{unique}-{pdf_filename}"
    try:
        sb.storage.from_(BUCKET).upload(
            path=storage_path,
            file=contents,
            file_options={
                "cache-control": "3600",
                "upsert": "true",
                "content-type": "application/pdf",
            },
        )
        return storage_path, len(contents)
    except Exception as e:
        # Probeer upsert true (kan al bestaan)
        print(f"  ⚠️  Upload waarschuwing: {e}")
        return storage_path, len(contents)


def main():
    print(f"Seeding {len(PRODUCTS)} digitale producten...\n")
    created = 0
    updated = 0
    for p in PRODUCTS:
        print(f"📄 {p['name']}")
        # 1. Upload PDF
        result = upload_pdf(p["pdf"], p["id"])
        if not result:
            print(f"  ❌ Overgeslagen wegens upload fout")
            continue
        storage_path, size = result
        print(f"  ✅ PDF in storage: {storage_path} ({size/1024:.1f} KB)")

        # 2. Upsert product
        product_row = {
            "id": p["id"],
            "name": p["name"],
            "short_name": p["short_name"],
            "slug": p["slug"],
            "description": p["description"],
            "short_description": p["short_description"],
            "price": p["price"],
            "compare_price": p["compare_price"],
            "images": [p["image"]],
            "badge": p["badge"],
            "category": p["category"],
            "stock_quantity": 9999,
            "sku": p["sku"],
            "features": [
                "Direct downloaden na betaling",
                "Hoge kwaliteit PDF",
                "Voor onbeperkt gebruik thuis",
                "Print zo vaak als je wilt",
            ],
            "is_active": True,
            "product_type": "digital",
            "digital_file_path": storage_path,
            "digital_file_size": size,
            "digital_pages": p["pages"],
        }
        try:
            res = sb.table("products").upsert(product_row, on_conflict="id").execute()
            if res.data:
                print(f"  ✅ Product geüpsert: {p['id']}")
                updated += 1
        except Exception as e:
            print(f"  ❌ Product upsert fout: {e}")
        print()

    print(f"\n🎉 Klaar! {updated} producten geüpsert in Supabase.")
    print(f"\nBeschikbaar op:")
    for p in PRODUCTS:
        print(f"  - https://droomvriendjes.com/product/{p['id']}")


if __name__ == "__main__":
    main()
