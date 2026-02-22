#!/usr/bin/env python3
"""
Import New Products Script
Cleans database and imports 10 new products from uploaded ZIP files
"""
import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import uuid

# Load environment
load_dotenv('/app/backend/.env')

# Connect to MongoDB
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'droomvriendje')

# Product definitions with image paths
PRODUCTS = [
    {
        "id": str(uuid.uuid4()),
        "name": "Droomvriendjes Slimme Leeuw - Projector & White Noise Slaapknuffel",
        "shortName": "Slimme Leeuw",
        "price": 49.95,
        "originalPrice": 64.95,
        "image": "/products/Lion/Lion_Front_product_01.png",
        "gallery": [
            "/products/Lion/Lion_Front_product_01.png",
            "/products/Lion/Lion_Side_product_02.png",
            "/products/Lion/Lion_back_prodcut_03.png",
            "/products/Lion/Lion_dimenstions_product_04.png",
            "/products/Lion/Lion_Macro_prodcut_05.png",
            "/products/Lion/Lion_gift_product_06.png",
            "/products/Lion/Sheep_Lifestyle_prodcut_07.png",
            "/products/Lion/Lion_Lifestyle_prodcut_08.png",
            "/products/Lion/Lion_Lifestyle_prodcut_09.png",
            "/products/Lion/Lion_packaging_product_10.png"
        ],
        "macroImage": "/products/Lion/Lion_Macro_prodcut_05.png",
        "dimensionsImage": "/products/Lion/Lion_dimenstions_product_04.png",
        "description": "De Slimme Leeuw van Droomvriendjes is de ultieme slaaphulp voor je baby. Met sterrenprojectie, 8 rustgevende melodieën en white noise helpt deze lieve leeuw je kindje in slaap te vallen.",
        "features": [
            "🌟 Sterrenprojectie in 3 kleuren",
            "🎵 8 rustgevende slaapliedjes",
            "🔇 White noise & natuurgeluiden",
            "⏰ 30 minuten auto-timer",
            "🔋 USB-C oplaadbaar"
        ],
        "benefits": [
            "Helpt je baby sneller in slaap te vallen",
            "Creëert een rustgevende slaapomgeving",
            "Perfect cadeau voor babyshowers"
        ],
        "rating": 4.8,
        "reviews": 234,
        "badge": "BESTSELLER",
        "inStock": True,
        "stock": 100,
        "ageRange": "Vanaf 0 maanden",
        "warranty": "30 dagen slaapgarantie",
        "sku": "DV-LION-001",
        "itemId": "DV-LION-001",
        "itemCategory": "Knuffels",
        "itemCategory2": "Slaapknuffels",
        "itemCategory3": "Wilde Dieren",
        "itemVariant": "Leeuw"
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Droomvriendjes Schaapje - Sterrenprojectie Slaapknuffel",
        "shortName": "Schaapje",
        "price": 49.95,
        "originalPrice": 64.95,
        "image": "/products/Sheep/front.png",
        "gallery": [
            "/products/Sheep/front.png",
            "/products/Sheep/side.png",
            "/products/Sheep/back.png",
            "/products/Sheep/dim2.png",
            "/products/Sheep/feature.png",
            "/products/Sheep/giftable.png",
            "/products/Sheep/lifestyle1.png",
            "/products/Sheep/lifestyle2.png",
            "/products/Sheep/lifestyle3.png",
            "/products/Sheep/packaging.png"
        ],
        "macroImage": "/products/Sheep/feature.png",
        "dimensionsImage": "/products/Sheep/dim2.png",
        "description": "Het schattige Schaapje van Droomvriendjes is de perfecte slaapvriend. Met zachte sterrenprojectie en kalmerende geluiden droomt je baby zoet de hele nacht.",
        "features": [
            "🌟 Zachte sterrenprojectie",
            "🎵 8 rustgevende melodieën",
            "🔇 White noise functie",
            "⏰ 30 minuten timer",
            "🔋 USB-C oplaadbaar"
        ],
        "benefits": [
            "Zachte materialen, veilig voor baby's",
            "Helpt bij het opbouwen van een slaapritueel",
            "Draagbaar voor onderweg"
        ],
        "rating": 4.7,
        "reviews": 189,
        "badge": "POPULAIR",
        "inStock": True,
        "stock": 100,
        "ageRange": "Vanaf 0 maanden",
        "warranty": "30 dagen slaapgarantie",
        "sku": "DV-SHEEP-001",
        "itemId": "DV-SHEEP-001",
        "itemCategory": "Knuffels",
        "itemCategory2": "Slaapknuffels",
        "itemCategory3": "Boerderijdieren",
        "itemVariant": "Schaap"
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Droomvriendjes Panda - Nachtlamp met Hartslag",
        "shortName": "Panda",
        "price": 49.95,
        "originalPrice": 64.95,
        "image": "/products/Panda/Panda_Front_product_01.png",
        "gallery": [
            "/products/Panda/Panda_Front_product_01.png",
            "/products/Panda/Panda_Side_product_02.png",
            "/products/Panda/Panda_back_prodcut_03.png",
            "/products/Panda/Panda_dimenstions_product_04.png",
            "/products/Panda/Panda_Macro_prodcut_05.png",
            "/products/Panda/Panda_gift_product_06.png",
            "/products/Panda/Panda_Lifestyle_prodcut_07.png",
            "/products/Panda/Panda_Lifestyle_prodcut_08.png",
            "/products/Panda/Panda_Lifestyle_prodcut_09.png",
            "/products/Panda/Panda_packaging_product_10.png"
        ],
        "macroImage": "/products/Panda/Panda_Macro_prodcut_05.png",
        "dimensionsImage": "/products/Panda/Panda_dimenstions_product_04.png",
        "description": "De lieve Panda van Droomvriendjes combineert een zachte nachtlamp met hartslagfunctie. De vertrouwde hartslag van mama helpt je baby rustig in slaap te vallen.",
        "features": [
            "💓 Echte hartslagfunctie",
            "🌙 Zachte nachtlamp",
            "🎵 Slaapliedjes & white noise",
            "⏰ 30 minuten timer",
            "🔋 USB-C oplaadbaar"
        ],
        "benefits": [
            "De hartslag werkt kalmerend voor je baby",
            "Zorgt voor een veilig gevoel",
            "Ideaal voor de eerste maanden"
        ],
        "rating": 4.9,
        "reviews": 312,
        "badge": "BESTSELLER",
        "inStock": True,
        "stock": 100,
        "ageRange": "Vanaf 0 maanden",
        "warranty": "30 dagen slaapgarantie",
        "sku": "DV-PANDA-001",
        "itemId": "DV-PANDA-001",
        "itemCategory": "Knuffels",
        "itemCategory2": "Slaapknuffels",
        "itemCategory3": "Wilde Dieren",
        "itemVariant": "Panda"
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Droomvriendjes Eenhoorn - Magische Sterrenprojectie",
        "shortName": "Eenhoorn",
        "price": 49.95,
        "originalPrice": 64.95,
        "image": "/products/Unicorn/Unicorn_Front_product_01.png",
        "gallery": [
            "/products/Unicorn/Unicorn_Front_product_01.png",
            "/products/Unicorn/Unicorn_Side_product_02.png",
            "/products/Unicorn/Unicorn_back_prodcut_03.png",
            "/products/Unicorn/Unicorn_dimenstions_product_04.png",
            "/products/Unicorn/Unicorn_Macro_prodcut_05.png",
            "/products/Unicorn/Unicorn_gift_product_06.png",
            "/products/Unicorn/Unicorn_Lifestyle_prodcut_07.png",
            "/products/Unicorn/Unicorn_Lifestyle_prodcut_08.png",
            "/products/Unicorn/Unicorn_Lifestyle_prodcut_09.png",
            "/products/Unicorn/Unicorn_packaging_product_10.png"
        ],
        "macroImage": "/products/Unicorn/Unicorn_Macro_prodcut_05.png",
        "dimensionsImage": "/products/Unicorn/Unicorn_dimenstions_product_04.png",
        "description": "De magische Eenhoorn van Droomvriendjes tovert de mooiste sterrenhemel op het plafond. Met sprookjesachtige melodieën en zachte kleuren is dit de droom van elk kind.",
        "features": [
            "✨ Magische sterrenprojectie",
            "🎵 Sprookjesachtige melodieën",
            "🌈 3 kleurmodi",
            "⏰ 30 minuten timer",
            "🔋 USB-C oplaadbaar"
        ],
        "benefits": [
            "Perfect voor meisjes én jongens",
            "Stimuleert de fantasie",
            "Helpt kinderen rustig worden"
        ],
        "rating": 4.8,
        "reviews": 267,
        "badge": "POPULAIR",
        "inStock": True,
        "stock": 100,
        "ageRange": "Vanaf 0 maanden",
        "warranty": "30 dagen slaapgarantie",
        "sku": "DV-UNICORN-001",
        "itemId": "DV-UNICORN-001",
        "itemCategory": "Knuffels",
        "itemCategory2": "Slaapknuffels",
        "itemCategory3": "Fantasie",
        "itemVariant": "Eenhoorn"
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Droomvriendjes Pinguïn - Koele Slaapvriend",
        "shortName": "Pinguïn",
        "price": 49.95,
        "originalPrice": 64.95,
        "image": "/products/Penguin/Penguin_Front_product_01.png",
        "gallery": [
            "/products/Penguin/Penguin_Front_product_01.png",
            "/products/Penguin/Penguin_Side_product_02.png",
            "/products/Penguin/Penguin_back_prodcut_03.png",
            "/products/Penguin/Penguin_dimenstions_product_04.png",
            "/products/Penguin/Penguin_Macro_prodcut_05.png",
            "/products/Penguin/Penguin_gift_product_06.png",
            "/products/Penguin/Penguin_Lifestyle_prodcut_07.png",
            "/products/Penguin/Penguin_Lifestyle_prodcut_08.png",
            "/products/Penguin/Penguin_Lifestyle_prodcut_09.png",
            "/products/Penguin/Penguin_packaging_product_10.png"
        ],
        "macroImage": "/products/Penguin/Penguin_Macro_prodcut_05.png",
        "dimensionsImage": "/products/Penguin/Penguin_dimenstions_product_04.png",
        "description": "De vrolijke Pinguïn van Droomvriendjes is een koele slaapvriend met sterrenprojectie en rustgevende geluiden. Perfect voor kinderen die van avontuur houden.",
        "features": [
            "🌟 Sterrenprojectie",
            "🎵 8 rustgevende geluiden",
            "🔇 White noise functie",
            "⏰ 30 minuten timer",
            "🔋 USB-C oplaadbaar"
        ],
        "benefits": [
            "Vrolijk design dat kinderen leuk vinden",
            "Duurzame materialen",
            "Makkelijk schoon te maken"
        ],
        "rating": 4.6,
        "reviews": 145,
        "badge": None,
        "inStock": True,
        "stock": 100,
        "ageRange": "Vanaf 0 maanden",
        "warranty": "30 dagen slaapgarantie",
        "sku": "DV-PENGUIN-001",
        "itemId": "DV-PENGUIN-001",
        "itemCategory": "Knuffels",
        "itemCategory2": "Slaapknuffels",
        "itemCategory3": "Pooldiertjes",
        "itemVariant": "Pinguïn"
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Droomvriendjes Dino - Stoere Slaapvriend met Projectie",
        "shortName": "Dino",
        "price": 49.95,
        "originalPrice": 64.95,
        "image": "/products/Dinno/Dinno_Front_product_01.png",
        "gallery": [
            "/products/Dinno/Dinno_Front_product_01.png",
            "/products/Dinno/Dinno_Side_product_02.png",
            "/products/Dinno/Dinno_back_prodcut_03.png",
            "/products/Dinno/Dinno_dimenstions_product_04.png",
            "/products/Dinno/Dinno_Macro_prodcut_05.png",
            "/products/Dinno/Dinno_gift_product_06.png",
            "/products/Dinno/Dinno_Lifestyle_prodcut_07.png",
            "/products/Dinno/Dinno_Lifestyle_prodcut_08.png",
            "/products/Dinno/Dinno_Lifestyle_prodcut_09.png",
            "/products/Dinno/Dinno_packaging_product_10.png"
        ],
        "macroImage": "/products/Dinno/Dinno_Macro_prodcut_05.png",
        "dimensionsImage": "/products/Dinno/Dinno_dimenstions_product_04.png",
        "description": "De stoere Dino van Droomvriendjes is de perfecte slaapvriend voor kleine avonturiers. Met prehistorische geluiden en sterrenprojectie maakt slapen gaan leuk!",
        "features": [
            "🌟 Sterrenprojectie",
            "🎵 Avontuurlijke melodieën",
            "🔇 Natuurgeluiden",
            "⏰ 30 minuten timer",
            "🔋 USB-C oplaadbaar"
        ],
        "benefits": [
            "Stoer design voor jongens",
            "Stimuleert de verbeelding",
            "Helpt bij angst voor het donker"
        ],
        "rating": 4.7,
        "reviews": 178,
        "badge": "NIEUW",
        "inStock": True,
        "stock": 100,
        "ageRange": "Vanaf 0 maanden",
        "warranty": "30 dagen slaapgarantie",
        "sku": "DV-DINO-001",
        "itemId": "DV-DINO-001",
        "itemCategory": "Knuffels",
        "itemCategory2": "Slaapknuffels",
        "itemCategory3": "Dinosaurussen",
        "itemVariant": "Dinosaurus"
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Droomvriendjes Bruine Beer - Warme Knuffel met Projectie",
        "shortName": "Bruine Beer",
        "price": 49.95,
        "originalPrice": 64.95,
        "image": "/products/BearBrown/BearBrown_Front_product_01.png",
        "gallery": [
            "/products/BearBrown/BearBrown_Front_product_01.png",
            "/products/BearBrown/BearBrown_Side_product_02.png",
            "/products/BearBrown/BearBrown_back_prodcut_03.png",
            "/products/BearBrown/BearBrown_dimenstions_product_04.png",
            "/products/BearBrown/BearBrown_Macro_prodcut_05.png",
            "/products/BearBrown/BearBrown_gift_product_06.png",
            "/products/BearBrown/BearBrown_Lifestyle_prodcut_07.png",
            "/products/BearBrown/BearBrown_Lifestyle_prodcut_08.png",
            "/products/BearBrown/BearBrown_Lifestyle_prodcut_09.png",
            "/products/BearBrown/BearBrown_packaging_product_10.png"
        ],
        "macroImage": "/products/BearBrown/BearBrown_Macro_prodcut_05.png",
        "dimensionsImage": "/products/BearBrown/BearBrown_dimenstions_product_04.png",
        "description": "De warme Bruine Beer van Droomvriendjes is een klassieke knuffelvriend met moderne functies. Sterrenprojectie en zachte melodieën maken dit de perfecte slaapmaatje.",
        "features": [
            "🌟 Sterrenprojectie in 3 kleuren",
            "🎵 8 klassieke slaapliedjes",
            "🔇 White noise functie",
            "⏰ 30 minuten timer",
            "🔋 USB-C oplaadbaar"
        ],
        "benefits": [
            "Tijdloos design",
            "Extra zachte materialen",
            "Perfect voor alle leeftijden"
        ],
        "rating": 4.8,
        "reviews": 223,
        "badge": "POPULAIR",
        "inStock": True,
        "stock": 100,
        "ageRange": "Vanaf 0 maanden",
        "warranty": "30 dagen slaapgarantie",
        "sku": "DV-BEARBROWN-001",
        "itemId": "DV-BEARBROWN-001",
        "itemCategory": "Knuffels",
        "itemCategory2": "Slaapknuffels",
        "itemCategory3": "Bosdieren",
        "itemVariant": "Beer Bruin"
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Droomvriendjes Witte Beer - Polaire Droomvriend",
        "shortName": "Witte Beer",
        "price": 49.95,
        "originalPrice": 64.95,
        "image": "/products/BearTwo/BearTwo_Front_product_01.png",
        "gallery": [
            "/products/BearTwo/BearTwo_Front_product_01.png",
            "/products/BearTwo/BearTwo_Side_product_02.png",
            "/products/BearTwo/BearTwo_back_prodcut_03.png",
            "/products/BearTwo/BearTwo_dimenstions_product_04.png",
            "/products/BearTwo/BearTwo_Macro_prodcut_05.png",
            "/products/BearTwo/BearTwo_gift_product_06.png",
            "/products/BearTwo/BearTwo_Lifestyle_prodcut_07.png",
            "/products/BearTwo/BearTwo_Lifestyle_prodcut_08.png",
            "/products/BearTwo/BearTwo_Lifestyle_prodcut_09.png",
            "/products/BearTwo/BearTwo_packaging_product_10.png"
        ],
        "macroImage": "/products/BearTwo/BearTwo_Macro_prodcut_05.png",
        "dimensionsImage": "/products/BearTwo/BearTwo_dimenstions_product_04.png",
        "description": "De schattige Witte Beer van Droomvriendjes brengt de magie van de poolnacht naar de kinderkamer. Met ijskoude sterren en warme melodieën voor zoete dromen.",
        "features": [
            "🌟 Arctische sterrenprojectie",
            "🎵 Zachte wintermelodie",
            "🔇 White noise & aurora borealis",
            "⏰ 30 minuten timer",
            "🔋 USB-C oplaadbaar"
        ],
        "benefits": [
            "Uniek polair design",
            "Superzacht pluche",
            "Magische slaapervaring"
        ],
        "rating": 4.9,
        "reviews": 289,
        "badge": "BESTSELLER",
        "inStock": True,
        "stock": 100,
        "ageRange": "Vanaf 0 maanden",
        "warranty": "30 dagen slaapgarantie",
        "sku": "DV-BEARTWO-001",
        "itemId": "DV-BEARTWO-001",
        "itemCategory": "Knuffels",
        "itemCategory2": "Slaapknuffels",
        "itemCategory3": "Pooldiertjes",
        "itemVariant": "IJsbeer"
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Droomvriendjes Schaapje Roze - Zachte Droomvriend",
        "shortName": "Schaapje Roze",
        "price": 49.95,
        "originalPrice": 64.95,
        "image": "/products/SheepTwo/SheepTwo_Front_product_01.png",
        "gallery": [
            "/products/SheepTwo/SheepTwo_Front_product_01.png",
            "/products/SheepTwo/SheepTwo_Side_product_02.png",
            "/products/SheepTwo/SheepTwo_back_prodcut_03.png",
            "/products/SheepTwo/SheepTwo_dimenstions_product_04.png",
            "/products/SheepTwo/SheepTwo_Macro_prodcut_05.png",
            "/products/SheepTwo/SheepTwo_gift_product_06.png",
            "/products/SheepTwo/SheepTwo_Lifestyle_prodcut_07.png",
            "/products/SheepTwo/SheepTwo_Lifestyle_prodcut_08.png",
            "/products/SheepTwo/SheepTwo_Lifestyle_prodcut_09.png",
            "/products/SheepTwo/SheepTwo_packaging_product_10.png"
        ],
        "macroImage": "/products/SheepTwo/SheepTwo_Macro_prodcut_05.png",
        "dimensionsImage": "/products/SheepTwo/SheepTwo_dimenstions_product_04.png",
        "description": "Het roze Schaapje van Droomvriendjes is een schattige slaapvriend met zachte kleuren en rustgevende geluiden. Perfect voor kleine droomprinsesjes.",
        "features": [
            "🌟 Roze sterrenprojectie",
            "🎵 Zachte slaapliedjes",
            "🔇 White noise functie",
            "⏰ 30 minuten timer",
            "🔋 USB-C oplaadbaar"
        ],
        "benefits": [
            "Lief roze design",
            "Extra zachte vacht",
            "Ideaal cadeau voor meisjes"
        ],
        "rating": 4.7,
        "reviews": 167,
        "badge": None,
        "inStock": True,
        "stock": 100,
        "ageRange": "Vanaf 0 maanden",
        "warranty": "30 dagen slaapgarantie",
        "sku": "DV-SHEEPTWO-001",
        "itemId": "DV-SHEEPTWO-001",
        "itemCategory": "Knuffels",
        "itemCategory2": "Slaapknuffels",
        "itemCategory3": "Boerderijdieren",
        "itemVariant": "Schaap Roze"
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Droomvriendjes DUO Set - Leeuw & Schaap Voordeelset",
        "shortName": "DUO Set",
        "price": 89.95,
        "originalPrice": 129.90,
        "image": "/products/DUO/Duo_Front_product_01.png",
        "gallery": [
            "/products/DUO/Duo_Front_product_01.png",
            "/products/DUO/DUO_Side_product_02.png",
            "/products/DUO/DUO_back_product_03.png",
            "/products/DUO/Duo_gift1_produc_06.png",
            "/products/DUO/DUO_gift2_product_06.png",
            "/products/DUO/Duo_Lifestyle_prodcut_07.png",
            "/products/DUO/Duo_Lifestyle_prodcut_08.png",
            "/products/DUO/Duo_Lifestyle01_prodcut_08.png",
            "/products/DUO/Duo_Lifestyle02_prodcut_08.png",
            "/products/DUO/DUO_Lifestyle_prodcut_09.png"
        ],
        "macroImage": "/products/DUO/Duo_Lifestyle_prodcut_08.png",
        "dimensionsImage": "/products/DUO/DUO_Side_product_02.png",
        "description": "De DUO Set bevat onze populairste Droomvriendjes: de Leeuw én het Schaap! Perfect voor een tweeling, broertje en zusje, of als reserveknuffel. Bespaar €40 op deze voordeelset!",
        "features": [
            "🦁 Slimme Leeuw met projectie",
            "🐑 Schaapje met sterren",
            "🎵 16 melodieën totaal",
            "💰 Bespaar €40",
            "🎁 Perfect cadeau voor tweeling"
        ],
        "benefits": [
            "Twee knuffels, één prijs",
            "Ideaal voor meerdere kinderkamers",
            "Altijd een backup beschikbaar"
        ],
        "rating": 4.9,
        "reviews": 456,
        "badge": "VOORDEELSET",
        "inStock": True,
        "stock": 50,
        "ageRange": "Vanaf 0 maanden",
        "warranty": "30 dagen slaapgarantie",
        "sku": "DV-DUO-001",
        "itemId": "DV-DUO-001",
        "itemCategory": "Knuffels",
        "itemCategory2": "Voordeelsets",
        "itemCategory3": "Sets",
        "itemVariant": "DUO Leeuw & Schaap"
    }
]

async def main():
    try:
        import certifi
        client = AsyncIOMotorClient(
            mongo_url,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=10000
        )
    except:
        client = AsyncIOMotorClient(mongo_url)
    
    db = client[db_name]
    
    print("=" * 60)
    print("DROOMVRIENDJES PRODUCT IMPORT")
    print("=" * 60)
    
    # Step 1: Count existing products
    existing_count = await db.products.count_documents({})
    print(f"\n📊 Bestaande producten in database: {existing_count}")
    
    # Step 2: Delete all existing products
    print("\n🗑️  Alle bestaande producten verwijderen...")
    result = await db.products.delete_many({})
    print(f"   ✅ {result.deleted_count} producten verwijderd")
    
    # Step 3: Insert new products
    print(f"\n📦 {len(PRODUCTS)} nieuwe producten importeren...")
    
    for i, product in enumerate(PRODUCTS, 1):
        await db.products.insert_one(product)
        print(f"   ✅ {i}/{len(PRODUCTS)}: {product['shortName']}")
    
    # Step 4: Verify
    new_count = await db.products.count_documents({})
    print(f"\n📊 Nieuwe producten in database: {new_count}")
    
    # List all products
    print("\n📋 Geïmporteerde producten:")
    products = await db.products.find({}, {"shortName": 1, "price": 1, "badge": 1}).to_list(length=100)
    for p in products:
        badge = f" [{p.get('badge')}]" if p.get('badge') else ""
        print(f"   • {p['shortName']} - €{p['price']}{badge}")
    
    print("\n" + "=" * 60)
    print("✅ IMPORT VOLTOOID!")
    print("=" * 60)
    
    await client.close()

if __name__ == "__main__":
    asyncio.run(main())
