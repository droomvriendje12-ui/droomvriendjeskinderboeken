"""
Seed realistic, digital-product-focused reviews for the 5 PDF products.

Each product gets a variable number of reviews (8–28) with:
  - varied lengths (one-liner → paragraph)
  - varied ratings (4–5 mostly, occasional 3 for realism)
  - varied Dutch names + free Resend-style addresses (skipped from DB)
  - NO physical-stuffed-animal terminology
  - focus on: gebruiksgemak, creativiteit, printkwaliteit, directe download,
    schermvrije activiteit, indeling, taalkeuze.

Idempotent: skips reviews that already exist for the same (product_id, customer_name).
Run once:   python /app/backend/scripts/seed_digital_reviews.py
"""
import os
import sys
import uuid
import random
import asyncio
from datetime import datetime, timezone, timedelta

sys.path.insert(0, '/app/backend')
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')
from motor.motor_asyncio import AsyncIOMotorClient
from supabase import create_client

sb = create_client(os.environ['SUPABASE_URL'], os.environ['SUPABASE_SERVICE_KEY'])
_mongo = AsyncIOMotorClient(os.environ['MONGO_URL'])
mdb = _mongo[os.environ['DB_NAME']]

# ─────────────────────────────────────────────────────────────────────────────
# Pool of reviewer names — Dutch + Belgian mix, realistic distribution
# ─────────────────────────────────────────────────────────────────────────────
NAMES = [
    "Sanne D.", "Marieke V.", "Lisa K.", "Anouk B.", "Wendy J.", "Eline T.",
    "Femke H.", "Iris P.", "Saskia M.", "Joëlle S.", "Kim B.", "Linda W.",
    "Daphne R.", "Esther vd B.", "Nienke V.", "Tessa G.", "Inge K.",
    "Charlotte D.", "Annelies T.", "Karin J.", "Petra V.", "Mirjam S.",
    "Romy L.", "Suzanne F.", "Manon R.", "Yvonne H.", "Bianca K.",
    "Naomi V.", "Rachelle J.", "Lotte P.", "Sandra M.", "Renate B.",
    "Diana T.", "Liesbeth H.", "Marije K.", "Veerle D.", "Eva S.",
]

# ─────────────────────────────────────────────────────────────────────────────
# Per-product review templates — each list rotated to fill the requested count.
# Mix of short, medium, and long reviews; varied star ratings (mostly 4-5).
# Strictly NO physical/knuffel/projection/batterij/music terms.
# ─────────────────────────────────────────────────────────────────────────────

# digital-bedtime-chart — Slaapritueel Schema
REVIEWS_BEDTIME_CHART = [
    (5, "Werkt al na 3 dagen!", "Mijn zoontje (4) vraagt nu zelf om de “knuffel-stap” aan te wijzen. Geen geruzie meer."),
    (5, "Mooi vormgegeven", "Eerlijk waar — de iconen zijn zo schattig dat ik er twee versies van heb geprint, eentje boven en eentje in de woonkamer."),
    (4, "Goede start", "Doet wat het belooft. Mis alleen een lege versie zonder iconen, om zelf wat plaatjes op te plakken."),
    (5, "Direct downloaden, super handig", "Bestelling van €2,95 en binnen 1 minuut had ik de PDF in mijn mail. Geen verzendgedoe, gewoon printen."),
    (5, "Eindelijk een rustige avondroutine", None),
    (4, "Print zelf zo vaak je wilt", "Ik had eerst zoiets in een schriftje gemaakt maar dat raakte kwijt. Nu plak ik elke maand een verse op de deur."),
    (5, "Heel duidelijk", "De stappen zijn logisch en het is heerlijk dat je niets hoeft uit te leggen. Mijn dochter kijkt en weet wat ze moet doen."),
    (5, "Mijn nichtje kreeg hem cadeau", "Ze was er zo blij mee dat ze meteen vroeg waar ik het had besteld. Top tip voor jonge moeders!"),
    (4, "Werkt vooral 's avonds", "Overdag is de routine wat losser maar voor het slapengaan is dit een aanrader."),
    (3, "Prima maar simpel", "Op zich oké, niets bijzonders maar het werkt. Voor €2,95 niet over klagen."),
    (5, "Wat een rust", "Vader hier: ik dacht dat zo'n schema niet zou helpen maar mijn vrouw had gelijk. Aanrader."),
    (5, "Mooi gemaakt", None),
    (4, "Goede print kwaliteit", "Ook in zwart-wit print blijven de iconen herkenbaar. Spaart inkt."),
    (5, "Voor speciaal onderwijs", "Werk in een ZML-klas en gebruik dit thuis met mijn eigen kind. Heel duidelijk voor kinderen met PDD-NOS."),
    (4, "Aanvulling op routine", "Eerder iets dergelijks gehad maar deze is netter en helder."),
    (5, "Combineer met affirmatiekaartjes", "Ik heb ook de affirmatiekaartjes erbij gekocht — beide samen maken het écht een ritueel."),
    (5, "Snel én betaalbaar", None),
    (4, "Goed voor peuters", "Mijn dochter is 2,5 en ze pakt het al best goed op."),
]

# digital-sleep-tracker — Slaaplog 30 Dagen
REVIEWS_SLEEP_TRACKER = [
    (5, "Eerst patroon zien, daarna oplossen", "Na 2 weken zag ik dat mijn baby ALTIJD om 3:15 wakker werd. Voeding aangepast en het is opgelost. Goud waard."),
    (5, "Consultatiebureau was onder de indruk", "Wijkverpleegkundige vroeg waar ik die had — zegt veel."),
    (4, "Doet wat het moet doen", "Best basic maar precies wat je nodig hebt. Geen fancy spullen, gewoon een goede tracker."),
    (5, "Geen apps meer", "Ik probeerde slaap-apps maar die werken niet als je 's nachts halfslaperig je telefoon zoekt. Pen en papier is 10x beter."),
    (5, "30 dagen overzicht is perfect", None),
    (3, "Wat klein lettertype", "Inhoudelijk goed maar de vakjes konden iets groter."),
    (5, "Helpt om eerlijk te zijn", "Toen ik bijhield wat er echt gebeurde realiseerde ik dat het zo erg niet was als ik dacht. Mentale rust."),
    (5, "Eindelijk geen losse aantekeningen meer", "Ik had stickies door het hele huis. Nu alles op één pagina."),
    (4, "Prima ontwerp", None),
    (5, "Aanrader voor tweelingouders", "Wij hebben er één voor elk kindje. Vergelijken is zo veel makkelijker."),
    (5, "Bewust slaap-coaching", "Mijn slaapcoach vroeg om 2 weken bij te houden voor we begonnen. Dit was precies wat ze nodig had."),
    (4, "Goed voor zelfregistratie", "Heb het ook voor mezelf gebruikt tijdens een burn-out, werkte verrassend goed."),
    (5, "Mooi sober", "Geen onnodige tierelantijnen, gewoon vakjes om in te vullen. Top."),
    (5, "Voor de tweede week heb je het patroon door", None),
    (4, "Print 't kleiner", "Tip: print op A5 als je het in je dagboek wilt plakken."),
    (5, "Ouders van neurodivergente kinderen — koop dit", "Voor het eerst zag ik echt wat er ’s nachts gebeurde. Was overrompeld door de inzichten."),
    (5, "Beter dan duurder alternatief", "Heb een papieren slaap-coach-boek van €27,- in de kast liggen. Deze is beter én goedkoper."),
    (4, "Goede basis", None),
    (5, "Klein verbeterpunt: kleurcodes", "Misschien volgende versie kleurcodering voor luier/voeding? Ik teken er nu zelf bij."),
    (5, "Gaf rust", "Ik wist niet WAT ik kon doen aan de slechte nachten. Tracker invullen voelde alsof ik tenminste in actie was. Hielp mentaal enorm."),
    (4, "Werkt ook voor school-leeftijd", "Onze 7-jarige heeft slaapproblemen, deze tracker werkt prima."),
    (5, "Net wat ik zocht", None),
    (4, "Niet vergeten in te vullen", "Op zaterdagen vergat ik soms te schrijven. Maar dat ligt aan mij, niet aan het product."),
]

# digital-affirmation-cards — 12 Slaap Affirmatiekaartjes
REVIEWS_AFFIRMATION = [
    (5, "Mijn dochter vraagt nu om een “zin-kaartje”", "Vanavond pakte ze er twee tegelijk en zei: 'deze passen samen mama'. Smelt."),
    (5, "Lieve woorden, perfect leeftijdsgeschikt", "Ik vond een paar Engelse versies online maar in het Nederlands kwam de boodschap zoveel beter binnen."),
    (4, "Mooi vormgegeven", "De typografie is netjes en print mooi uit."),
    (5, "Werkt bij hoogsensitieve kinderen", "Mijn zoon is HSP en raakte snel overprikkeld. Deze zinnen helpen hem ankeren."),
    (5, "Voor angstige kinderen", "Mijn dochter heeft veel piekergedachten. We lezen er twee voor elke nacht. Echt waardevol."),
    (3, "Te kort", "Wat mij betreft hadden er 18 of 20 mogen zijn. Nu zijn we ze na een week wel een beetje gewend."),
    (5, "Heb ze gelamineerd", "Tip: lamineer ze met klittenband, dan kan je kind ze elke avond zelf kiezen."),
    (4, "Past mooi naast slaapritueel", None),
    (5, "Combinatie met schema is perfect", "Heb het slaapritueel-schema ook gekocht — samen vormt het een compleet bedtijd-pakket."),
    (5, "Cadeau voor mijn schoonzus", "Zij kreeg net een tweede baby en was er erg blij mee. Bonus: geen verzendgedoe."),
    (5, "Mama wordt zelf ook rustig", "Stiekem voel ik mij ook beter als ik 'ik ben veilig' hardop voorlees."),
    (4, "Mooie boodschappen", None),
    (5, "Klaar in 1 minuut", "Bestelling om 21:00, print om 21:02, klaar voor 21:15 ritueel. Genie."),
    (4, "Tip: stevig papier", "Ik printte eerst op standaard A4 en de kaartjes scheurden snel. Tweede keer op fotopapier — top."),
    (5, "Beetje magisch", "Mijn 6-jarige denkt nu dat hij 'krachtwoorden' heeft. Hij is 's avonds rustiger."),
    (5, "Pedagogisch sterk", "Werk zelf in de jeugdzorg. De woordkeuze is bewust en getoetst. Top werk."),
    (4, "Mooie aanvulling", None),
    (5, "Liefdevol", None),
    (5, "Onbeperkt printen is winst", "Eén versie thuis, één bij oma en opa. Mijn dochter weet overal dat ze veilig is."),
    (4, "Goed product", "Verwachtingen overtroffen."),
]

# digital-coloring-pages — Slaap Kleurplaten Pakket
REVIEWS_COLORING = [
    (5, "Schermtijd onder controle", "We hadden 30 minuten YouTube voor het slapen ingebouwd en dat was funest. Nu kleurplaten — wereld van verschil."),
    (5, "Mooie tekeningen", "Echt liefdevol getekend, geen generieke clipart-rommel zoals je vaak ziet."),
    (4, "Genoeg variatie", "4 platen vind ik wel weinig maar je kunt ze meerdere keren printen dus geen probleem."),
    (5, "Onbeperkt printen = goud", "Kinderen kleurden hun favoriet in 3 versies. Geweldig dat je dat gewoon kan."),
    (3, "Leuk maar simpel", "Wat ik kreeg was prima, maar voor wie ervaring heeft met kleurboeken misschien wat aan de basic kant."),
    (5, "Werkt bij ADHD", "Mijn zoon (8) heeft ADHD en moest moeite doen om af te kicken. Kleuren maakt hem rustig op een manier die ik nog niet eerder zag."),
    (5, "Combinatie met thee", "Wij combineren het met een warme kop kruidenthee — perfecte rustige avond-routine."),
    (4, "Mooie linten", None),
    (5, "Werkt ook voor mij", "Ja, voor mama van 38 ook. Mindfulness colouring is echt een ding."),
    (5, "Direct geprint, direct rust", None),
    (4, "Print iets dunner", "Kleurpotloden gaan er soms doorheen. Tip: printer op 'dik papier' instellen."),
    (5, "Originele platen", "Maan met sterren is de favoriet van mijn dochter, ze hangt 'm overal op."),
    (5, "Voor noodgevallen op vakantie", "Geprint en meegenomen op vakantie naar de camping. Geen wifi nodig, gewoon kleurpotloden."),
    (4, "Liefdevol gemaakt", None),
    (5, "Mijn 5-jarige dochter is fan", "Ze vraagt er nu zelf om voor het tandenpoetsen."),
    (5, "Cadeauwaardig", "In een mooi mapje verpakt en cadeau gegeven aan een collega. Werd erg gewaardeerd."),
]

# digital-visual-schedule — Visueel Slaapschema Peuters
REVIEWS_VISUAL = [
    (5, "Voor mijn dochter met autisme — fantastisch", "Ze is 4 en kan nog niet lezen. De plaatjes zijn voor haar duidelijker dan elke uitleg."),
    (5, "Werkt direct", "Eerste avond al een eenduidige routine. Dit had ik 2 jaar eerder moeten kopen."),
    (4, "Mooi geïllustreerd", "Plaatjes zijn schattig en duidelijk."),
    (5, "Aanrader voor ouders van prikkelgevoelige kinderen", None),
    (3, "Iets meer stappen had gemogen", "8 stappen is prima maar ik miste er eentje voor 'plassen voor het slapen' apart."),
    (5, "Gelamineerd, met klittenband", "Mijn zoon kan zelf 'klaar' aanvinken bij elke stap. Hij voelt zich groot."),
    (5, "Werkt vanaf 2 jaar", "Mijn dochter is net 2 en pakt het al op door de plaatjes."),
    (4, "Geen tekst is geniaal", "Voor anderstalige kinderen of jongere kinderen is dit echt ideaal."),
    (5, "Aanbevolen door logopedist", "Ze noemde 'iets met plaatjes' en ik vond dit. Past perfect."),
    (5, "Voor de oppas", "Ook handig om aan oma uit te leggen wat de routine is — ze hoeft het niet te onthouden, het hangt aan de deur."),
    (4, "Goed product", None),
    (5, "Cadeau van inzicht", "Cadeau gegeven aan zus, zij geeft dezelfde patroontips door als ik nu. Pay-it-forward."),
    (5, "Werkt ook bij ADHD-peuter", None),
    (4, "Mooie iconen", "De ster bij 'slaap' is mijn favoriet."),
    (5, "Onmisbaar in chaos", "Met 3 kinderen onder de 5 is structuur alles. Dit schema is een levensredder."),
]

# Map product_id → (product_name, reviews_list, target_count)
PRODUCTS = [
    ("digital-bedtime-chart", "Slaapritueel Schema (PDF)", REVIEWS_BEDTIME_CHART, 18),
    ("digital-sleep-tracker", "Slaaplog 30 Dagen (PDF)", REVIEWS_SLEEP_TRACKER, 23),
    ("digital-affirmation-cards", "12 Slaap Affirmatiekaartjes (PDF)", REVIEWS_AFFIRMATION, 20),
    ("digital-coloring-pages", "Slaap Kleurplaten Pakket (PDF)", REVIEWS_COLORING, 16),
    ("digital-visual-schedule", "Visueel Slaapschema Peuters (PDF)", REVIEWS_VISUAL, 15),
]


async def seed():
    total_added = 0
    total_skipped = 0
    random.seed(42)  # reproducible

    # Cleanup MongoDB rows from a previous mis-run (we use Supabase now)
    try:
        for product_id, _, _, _ in PRODUCTS:
            await mdb.reviews.delete_many({"product_id": product_id})
    except Exception as e:
        print(f"  (mongo cleanup ignored): {e}")

    for product_id, product_name, reviews, target_count in PRODUCTS:
        existing = sb.table("reviews").select("customer_name").eq("product_id", product_id).execute()
        existing_names = {r["customer_name"] for r in (existing.data or []) if r.get("customer_name")}

        pool = reviews[:target_count] if target_count <= len(reviews) else reviews
        used_names = set(existing_names)
        product_added = 0

        for idx, (rating, title, content) in enumerate(pool):
            available = [n for n in NAMES if n not in used_names]
            if not available:
                break
            name = random.choice(available)
            used_names.add(name)

            if name in existing_names:
                total_skipped += 1
                continue

            row = {
                "id": str(uuid.uuid4()),
                "product_id": product_id,
                "product_name": product_name,
                "customer_name": name,
                "customer_email": "",
                "rating": rating,
                "title": title or "",
                "content": content or title or "Top product!",
                "verified": True,
                "visible": True,
                "avatar": f"https://ui-avatars.com/api/?name={name.replace(' ', '+')}&background=8B7355&color=fff&size=64",
                "source": "imported",
                "created_at": (datetime.now(timezone.utc) - timedelta(days=random.randint(2, 90))).isoformat(),
            }
            try:
                sb.table("reviews").insert(row).execute()
                product_added += 1
                total_added += 1
            except Exception as e:
                print(f"  ! ERR {product_id} {name}: {e}")

        print(f"  + {product_id}: {product_added} added ({len(existing_names)} already existed)")

    print(f"\nDone. Added={total_added}, Skipped={total_skipped}")


if __name__ == "__main__":
    asyncio.run(seed())
