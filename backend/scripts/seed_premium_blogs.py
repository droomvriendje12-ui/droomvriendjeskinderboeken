"""
Seed the 3 pure-text premium blogs into the cms_blogs collection so they become
fully manageable & editable via the Blog CMS admin and render from the database.

Idempotent: upserts by slug. Safe to run multiple times.
The 7 blogs with interactive Printables upsell-blocks are intentionally NOT migrated
(they keep their rich code layout + live pricing) and remain code-rendered.

Run: python /app/backend/scripts/seed_premium_blogs.py
"""
import asyncio
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")

HTML_DIR = Path(__file__).parent / "premium_blogs"

_NL_MONTHS = {
    "januari": 1, "februari": 2, "maart": 3, "april": 4, "mei": 5, "juni": 6,
    "juli": 7, "augustus": 8, "september": 9, "oktober": 10, "november": 11, "december": 12,
}


def _iso(date_nl: str) -> str:
    try:
        d, m, y = date_nl.strip().split()
        return datetime(int(y), _NL_MONTHS[m.lower()], int(d), tzinfo=timezone.utc).isoformat()
    except Exception:
        return datetime.now(timezone.utc).isoformat()


BLOGS = [
    {
        "slug": "witte-ruis-white-noise-baby",
        "title": "Witte ruis voor baby's: helpt white noise écht bij slapen?",
        "seo_title": "Witte ruis voor baby's: helpt white noise écht? | Droomvriendjes",
        "meta_description": "Werkt witte ruis voor de babyslaap? Ontdek wat white noise doet, hoe je het veilig gebruikt en welk volume verantwoord is.",
        "excerpt": "White noise is overal, maar werkt het ook? We leggen uit wat witte ruis met de babyslaap doet, hoe je het veilig gebruikt en welk volume verantwoord is.",
        "category": "Wetenschap",
        "category_color": "bg-violet-100 text-violet-800",
        "tags": ["baby", "slaap", "wetenschap", "white noise"],
        "hero_image": "https://plxbmkwuacbdzookygtg.supabase.co/storage/v1/object/public/product-images/blog/witte-ruis-white-noise-baby.jpg",
        "read_minutes": 6,
        "date": "26 mei 2026",
        "faqs": [
            {"q": "Is witte ruis veilig voor baby's?", "a": "Ja, mits verantwoord gebruikt. Houd het volume onder ongeveer 50 decibel (zacht, vergelijkbaar met een douche op afstand) en plaats het apparaat minimaal 1,5 tot 2 meter van het bedje. Gebruik het niet de hele nacht op vol volume."},
            {"q": "Welk volume witte ruis is verantwoord?", "a": "Experts adviseren maximaal rond de 50 dB ter hoogte van het kind. Een handige vuistregel: kun je er een normaal gesprek bovenuit voeren, dan staat het goed. Te hard en te dichtbij kan op termijn het gehoor belasten."},
            {"q": "Mag white noise de hele nacht aanblijven?", "a": "Het mag, maar veel ouders kiezen voor een timer of een toestel dat na het inslapen zachter wordt. Zo voorkom je gewenning aan een constant geluid en geef je het gehoor rust."},
            {"q": "Wat is het verschil tussen witte ruis en natuurgeluiden?", "a": "Witte ruis is een gelijkmatig \"shhh\"-geluid dat storende geluiden maskeert. Natuurgeluiden (regen, zee) werken vergelijkbaar maar zijn variabeler. Veel nachtlampje-knuffels bieden beide, zodat je kunt kiezen wat jouw kind het prettigst vindt."},
        ],
        "related_products": [
            {"id": 7, "name": "Bruine Beertje - Nachtlampje met Witte Ruis", "emoji": "🧸"},
            {"id": 8, "name": "Liggend Schaapje - Nachtlampje met Sterrenprojectie", "emoji": "🐑"},
        ],
    },
    {
        "slug": "baby-knuffel-veilig-slapen-leeftijd",
        "title": "Vanaf welke leeftijd mag een baby veilig met een knuffel slapen?",
        "seo_title": "Vanaf welke leeftijd mag een baby met een knuffel slapen? | Droomvriendjes",
        "meta_description": "De officiële richtlijnen, de risico's vóór 12 maanden en hoe je een knuffel stap voor stap veilig introduceert in bed.",
        "excerpt": "Een knuffel in bed voelt vertrouwd, maar wanneer is het écht veilig? Lees de officiële richtlijnen, de risico's vóór 12 maanden en hoe je een knuffel stap voor stap veilig introduceert.",
        "category": "Veilig slapen",
        "category_color": "bg-teal-100 text-teal-800",
        "tags": ["baby", "knuffel", "veiligheid", "leeftijd"],
        "hero_image": "https://plxbmkwuacbdzookygtg.supabase.co/storage/v1/object/public/product-images/blog/baby-knuffel-veilig-slapen-leeftijd.jpg",
        "read_minutes": 7,
        "date": "28 mei 2026",
        "faqs": [
            {"q": "Mag een baby van 6 maanden met een knuffel slapen?", "a": "Nee. Tot 12 maanden adviseren kinderartsen en veilig-slapen-organisaties een leeg bedje: geen knuffels, kussens, dekbedden of hoofdbeschermers. Dit verlaagt het risico op wiegendood (SIDS) en verstikking. Een knuffel als troostobject mag wél overdag onder toezicht."},
            {"q": "Vanaf welke leeftijd is een knuffel in bed wél veilig?", "a": "Vanaf ongeveer 12 maanden kan een kleine, lichte knuffel veilig mee het bedje in. Vanaf dat moment kan je kind zelfstandig het hoofd wegdraaien en de knuffel wegduwen. Begin altijd met één kleine knuffel zonder losse onderdelen."},
            {"q": "Hoe groot mag de eerste slaapknuffel zijn?", "a": "Klein en licht. Een knuffel die kleiner is dan het hoofd van je kind en geen harde, afneembare delen heeft (kraaloogjes, knopen, lange linten) is het veiligst. Was hem regelmatig en controleer naden op slijtage."},
            {"q": "Mag een nachtlampje-knuffel wel in de buurt van een baby onder 1 jaar?", "a": "Ja, mits hij buiten het bedje staat. Plaats een nachtlampje- of white-noise-knuffel op het nachtkastje of de commode, niet in bed. Zo profiteert je baby van het rustgevende licht en geluid zonder verstikkingsrisico."},
        ],
        "related_products": [
            {"id": 8, "name": "Liggend Schaapje - Nachtlampje met Sterrenprojectie", "emoji": "🐑"},
            {"id": 7, "name": "Bruine Beertje - Nachtlampje met Witte Ruis", "emoji": "🧸"},
        ],
    },
    {
        "slug": "droomvriendjes-mondriaan-samenwerking",
        "title": "Rust in de avond: hoe slaap bijdraagt aan mentale veerkracht bij kinderen",
        "seo_title": "Rust in de avond: slaap & mentale veerkracht bij kinderen | Droomvriendjes",
        "meta_description": "Praktische rustmomenten en een haalbaar slaapritueel maken een groot verschil voor de mentale balans van kinderen én ouders.",
        "excerpt": "In een druk gezinsleven is tot rust komen niet altijd vanzelfsprekend. Praktische rustmomenten en een slaapritueel dat haalbaar blijft maken een groot verschil voor kinderen én ouders.",
        "category": "Mentale rust",
        "category_color": "bg-amber-100 text-amber-900",
        "tags": ["rust", "gezin", "mentale gezondheid", "slaap"],
        "hero_image": "https://plxbmkwuacbdzookygtg.supabase.co/storage/v1/object/public/product-images/blog/droomvriendjes-mondriaan-samenwerking.jpg",
        "read_minutes": 8,
        "date": "19 januari 2025",
        "faqs": [
            {"q": "Hoeveel slaap heeft een kind écht nodig?", "a": "Globale richtlijnen: peuters (1-3 jaar) 11-14 uur per dag, kleuters (3-5 jaar) 10-13 uur, schoolkinderen (6-12 jaar) 9-12 uur, tieners (13-18 jaar) 8-10 uur. Inclusief eventueel middagdutje."},
            {"q": "Hoe weet ik of mijn kind genoeg slaapt?", "a": "Drie signalen: 's ochtends moeilijk wakker worden, prikkelbaar of huilerig overdag, en grote energiedips na schooltijd. Houd 2 weken een slaapdagboek bij — patronen worden dan zichtbaar."},
            {"q": "Wat als mijn kind blijft piekeren in bed?", "a": "Maak een vast \"afkoel-moment\" 30 min voor het slapen: gedimd licht, geen schermen, korte ademhalingsoefening of een rustig boekje. Een vaste troostknuffel of zacht nachtlampje helpt om vertrouwen op te bouwen in de avond."},
            {"q": "Wanneer is het verstandig om hulp te zoeken?", "a": "Bij aanhoudende slaapproblemen langer dan 4 weken, heftige angst die het dagelijks functioneren belemmert, of zorgen over mentale gezondheid van je kind: neem contact op met je huisarts of consultatiebureau. Zij kunnen doorverwijzen naar gespecialiseerde zorg."},
            {"q": "Vervangt een knuffel professionele hulp?", "a": "Nee — een Droomvriendje ondersteunt het slaapritueel en geeft geborgenheid, maar vervangt geen zorg. Bij heftige of langdurige problemen is professionele hulp altijd de juiste eerste stap."},
        ],
        "related_products": [
            {"id": 3, "name": "Slaperige Panda - Voor rustige avonden", "emoji": "🐼"},
            {"id": 7, "name": "Bruine Beertje - Met witte ruis", "emoji": "🧸"},
            {"id": 8, "name": "Liggend Schaapje - Sterrenprojectie", "emoji": "🐑"},
        ],
    },
]


async def main():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]
    seeded, updated = 0, 0
    for b in BLOGS:
        html_path = HTML_DIR / f"{b['slug']}.html"
        content = html_path.read_text(encoding="utf-8").strip()
        created_at = _iso(b["date"])
        now = datetime.now(timezone.utc).isoformat()
        existing = await db.cms_blogs.find_one({"slug": b["slug"]})
        doc = {
            "slug": b["slug"],
            "title": b["title"],
            "seo_title": b["seo_title"],
            "meta_description": b["meta_description"],
            "excerpt": b["excerpt"],
            "category": b["category"],
            "category_color": b["category_color"],
            "tags": b["tags"],
            "hero_image": b["hero_image"],
            "content": content,
            "faqs": b["faqs"],
            "related_products": b["related_products"],
            "status": "published",
            "author": "Team Droomvriendjes",
            "read_minutes": b["read_minutes"],
            "source": "premium",
            "locked": False,
            "updated_at": now,
        }
        if existing:
            await db.cms_blogs.update_one({"slug": b["slug"]}, {"$set": doc})
            updated += 1
            print(f"  updated: {b['slug']}")
        else:
            doc["id"] = str(uuid.uuid4())
            doc["created_at"] = created_at
            await db.cms_blogs.insert_one(doc)
            seeded += 1
            print(f"  seeded:  {b['slug']}")
    total = await db.cms_blogs.count_documents({})
    print(f"Done. seeded={seeded} updated={updated} total_cms_blogs={total}")


if __name__ == "__main__":
    asyncio.run(main())
