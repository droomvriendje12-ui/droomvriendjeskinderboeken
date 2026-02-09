"""
Products API Routes - MongoDB based product catalog
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime, timezone
import logging
from bson import ObjectId

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/products", tags=["products"])

# Will be set by main app
db = None

def set_database(database):
    """Set the database connection"""
    global db
    db = database

# Initial product data to seed the database
INITIAL_PRODUCTS = [
    {
        "id": 1,
        "name": "Baby Slaapmaatje Leeuw - Projector Nachtlamp met White Noise",
        "shortName": "Leeuw Projector",
        "price": 49.95,
        "originalPrice": 64.95,
        "image": "https://i.imgur.com/E4g3eOy.jpeg",
        "gallery": [
            "https://i.imgur.com/E4g3eOy.jpeg",
            "https://i.imgur.com/zYLuTAg.jpeg",
            "https://i.imgur.com/WfHQKKr.jpeg"
        ],
        "description": "Een prachtige leeuw die sterren projecteert op het plafond en rustgevende geluiden afspeelt.",
        "features": [
            "🌟 Sterrenprojectie in 3 kleuren",
            "🎵 8 rustgevende slaapliedjes",
            "🔇 White noise & natuurgeluiden",
            "⏰ 30 minuten timer",
            "🔋 USB oplaadbaar"
        ],
        "benefits": [
            "Helpt je baby sneller in slaap te vallen",
            "Creëert een rustgevende slaapomgeving",
            "Perfect voor in de kinderkamer"
        ],
        "rating": 4.5,
        "reviews": 187,
        "badge": "BESTSELLER",
        "inStock": True,
        "ageRange": "Vanaf 0 maanden",
        "warranty": "14 dagen geld-terug-garantie",
        "itemId": "KNUF_001",
        "itemCategory": "Knuffels",
        "itemCategory2": "Slaapknuffels",
        "itemCategory3": "Wilde Dieren",
        "itemVariant": "Leeuw"
    },
    {
        "id": 2,
        "name": "Baby Nachtlamp Schaap - Slaapknuffel met Sterrenprojector",
        "shortName": "Schaap Projector",
        "price": 59.95,
        "originalPrice": 74.95,
        "image": "https://i.imgur.com/vYpeb4c.jpeg",
        "gallery": [
            "https://i.imgur.com/vYpeb4c.jpeg",
            "https://i.imgur.com/62h7jyd.jpeg",
            "https://i.imgur.com/JxKouOL.jpeg"
        ],
        "description": "Een zacht schaapje met sterrenprojectie en rustgevende melodieën.",
        "features": [
            "🌟 Sterrenprojectie in 3 kleuren",
            "🎵 8 rustgevende slaapliedjes",
            "🔇 White noise & natuurgeluiden",
            "⏰ 30 minuten timer",
            "🔋 USB oplaadbaar"
        ],
        "benefits": [
            "Helpt je baby sneller in slaap te vallen",
            "Creëert een rustgevende slaapomgeving",
            "Perfect voor in de kinderkamer"
        ],
        "rating": 4.7,
        "reviews": 156,
        "badge": "POPULAIR",
        "inStock": True,
        "ageRange": "Vanaf 0 maanden",
        "warranty": "14 dagen geld-terug-garantie",
        "itemId": "KNUF_002",
        "itemCategory": "Knuffels",
        "itemCategory2": "Slaapknuffels",
        "itemCategory3": "Boerderijdieren",
        "itemVariant": "Schaap"
    },
    {
        "id": 3,
        "name": "Teddy Projector Knuffel - Bruine Beer met Nachtlicht",
        "shortName": "Teddy Projector",
        "price": 59.95,
        "originalPrice": 74.95,
        "image": "https://i.imgur.com/jM6J4oV.jpeg",
        "gallery": [
            "https://i.imgur.com/jM6J4oV.jpeg",
            "https://i.imgur.com/bMpTi4F.jpeg",
            "https://i.imgur.com/LuZnyJN.jpeg"
        ],
        "description": "Een knuffelzachte teddy met sterrenprojector en rustgevende melodieën.",
        "features": [
            "🌟 Sterrenprojectie in 3 kleuren",
            "🎵 8 rustgevende slaapliedjes",
            "🔇 White noise & natuurgeluiden",
            "⏰ 30 minuten timer",
            "🔋 USB oplaadbaar"
        ],
        "benefits": [
            "Helpt je baby sneller in slaap te vallen",
            "Creëert een rustgevende slaapomgeving",
            "Perfect voor in de kinderkamer"
        ],
        "rating": 4.6,
        "reviews": 142,
        "badge": None,
        "inStock": True,
        "ageRange": "Vanaf 0 maanden",
        "warranty": "14 dagen geld-terug-garantie",
        "itemId": "KNUF_003",
        "itemCategory": "Knuffels",
        "itemCategory2": "Slaapknuffels",
        "itemCategory3": "Beren",
        "itemVariant": "Bruin"
    },
    {
        "id": 4,
        "name": "Pinguïn Nachtlampje - Slaapknuffel met Projectie",
        "shortName": "Pinguïn Projector",
        "price": 59.95,
        "originalPrice": 74.95,
        "image": "https://i.imgur.com/sYVb8K4.jpeg",
        "gallery": [
            "https://i.imgur.com/sYVb8K4.jpeg",
            "https://i.imgur.com/RqYk1oe.jpeg"
        ],
        "description": "Een schattige pinguïn met sterrenprojector en white noise functies.",
        "features": [
            "🌟 Sterrenprojectie in 3 kleuren",
            "🎵 8 rustgevende slaapliedjes",
            "🔇 White noise & natuurgeluiden",
            "⏰ 30 minuten timer",
            "🔋 USB oplaadbaar"
        ],
        "benefits": [
            "Helpt je baby sneller in slaap te vallen",
            "Creëert een rustgevende slaapomgeving",
            "Perfect voor in de kinderkamer"
        ],
        "rating": 4.4,
        "reviews": 98,
        "badge": None,
        "inStock": True,
        "ageRange": "Vanaf 0 maanden",
        "warranty": "14 dagen geld-terug-garantie",
        "itemId": "KNUF_004",
        "itemCategory": "Knuffels",
        "itemCategory2": "Slaapknuffels",
        "itemCategory3": "Pooldieren",
        "itemVariant": "Pinguïn"
    },
    {
        "id": 5,
        "name": "Dinosaurus Slaapknuffel - Stoere Dino met Nachtlamp",
        "shortName": "Dino Projector",
        "price": 59.95,
        "originalPrice": 74.95,
        "image": "https://i.imgur.com/z4cyllw.jpeg",
        "gallery": [
            "https://i.imgur.com/z4cyllw.jpeg",
            "https://i.imgur.com/mWJSBxI.jpeg"
        ],
        "description": "Een stoere dinosaurus met sterrenprojector voor kleine avonturiers.",
        "features": [
            "🌟 Sterrenprojectie in 3 kleuren",
            "🎵 8 rustgevende slaapliedjes",
            "🔇 White noise & natuurgeluiden",
            "⏰ 30 minuten timer",
            "🔋 USB oplaadbaar"
        ],
        "benefits": [
            "Perfect voor kleine avonturiers",
            "Helpt angst voor het donker overwinnen",
            "Stoer design dat jongens geweldig vinden"
        ],
        "rating": 4.8,
        "reviews": 76,
        "badge": None,
        "inStock": True,
        "ageRange": "Vanaf 0 maanden",
        "warranty": "14 dagen geld-terug-garantie",
        "itemId": "KNUF_005",
        "itemCategory": "Knuffels",
        "itemCategory2": "Slaapknuffels",
        "itemCategory3": "Fantasiedieren",
        "itemVariant": "Dinosaurus"
    },
    {
        "id": 6,
        "name": "Slaapknuffel Duo Schaap & Teddy - Voordeelset",
        "shortName": "Duo Set",
        "price": 89.95,
        "originalPrice": 119.90,
        "image": "https://i.imgur.com/4blLAM7.jpeg",
        "gallery": [
            "https://i.imgur.com/4blLAM7.jpeg",
            "https://i.imgur.com/1JbBGgT.jpeg"
        ],
        "description": "Twee schattige slaapknuffels met nachtlampjes - perfect voor broertjes en zusjes!",
        "features": [
            "🎁 2 knuffels in één set",
            "🌟 Beide met sterrenprojectie",
            "🎵 Elk 8 rustgevende slaapliedjes",
            "💰 €30 voordeelkorting",
            "🔋 USB oplaadbaar"
        ],
        "benefits": [
            "Perfect voor broertjes en zusjes",
            "Extra voordelig als set",
            "Twee verschillende knuffels"
        ],
        "rating": 4.9,
        "reviews": 64,
        "badge": "VOORDEELSET",
        "inStock": True,
        "ageRange": "Vanaf 0 maanden",
        "warranty": "14 dagen geld-terug-garantie",
        "itemId": "KNUF_006",
        "itemCategory": "Knuffels",
        "itemCategory2": "Voordeelsets",
        "itemCategory3": None,
        "itemVariant": "Duo"
    },
    {
        "id": 7,
        "name": "Olifant Sterrenprojector - Zachte Knuffel met Licht",
        "shortName": "Olifant Projector",
        "price": 54.95,
        "originalPrice": 69.95,
        "image": "https://i.imgur.com/J5xEAMt.jpeg",
        "gallery": [
            "https://i.imgur.com/J5xEAMt.jpeg",
            "https://i.imgur.com/YmNOLVT.jpeg"
        ],
        "description": "Een lieve olifant met sterrenprojector en rustgevende melodieën.",
        "features": [
            "🌟 Sterrenprojectie in 3 kleuren",
            "🎵 8 rustgevende slaapliedjes",
            "🔇 White noise & natuurgeluiden",
            "⏰ 30 minuten timer",
            "🔋 USB oplaadbaar"
        ],
        "benefits": [
            "Helpt je baby sneller in slaap te vallen",
            "Creëert een rustgevende slaapomgeving",
            "Zachte materialen veilig voor baby's"
        ],
        "rating": 4.5,
        "reviews": 89,
        "badge": None,
        "inStock": True,
        "ageRange": "Vanaf 0 maanden",
        "warranty": "14 dagen geld-terug-garantie",
        "itemId": "KNUF_007",
        "itemCategory": "Knuffels",
        "itemCategory2": "Slaapknuffels",
        "itemCategory3": "Wilde Dieren",
        "itemVariant": "Olifant"
    },
    {
        "id": 8,
        "name": "Panda Droomvriend - Knuffel met Sterrenlicht",
        "shortName": "Panda Projector",
        "price": 54.95,
        "originalPrice": 69.95,
        "image": "https://i.imgur.com/Gx8BZWK.jpeg",
        "gallery": [
            "https://i.imgur.com/Gx8BZWK.jpeg"
        ],
        "description": "Een schattige panda met sterrenprojector voor een magische nacht.",
        "features": [
            "🌟 Sterrenprojectie in 3 kleuren",
            "🎵 8 rustgevende slaapliedjes",
            "🔇 White noise & natuurgeluiden",
            "⏰ 30 minuten timer",
            "🔋 USB oplaadbaar"
        ],
        "benefits": [
            "Helpt je baby sneller in slaap te vallen",
            "Creëert een rustgevende slaapomgeving",
            "Perfect voor in de kinderkamer"
        ],
        "rating": 4.6,
        "reviews": 72,
        "badge": None,
        "inStock": True,
        "ageRange": "Vanaf 0 maanden",
        "warranty": "14 dagen geld-terug-garantie",
        "itemId": "KNUF_008",
        "itemCategory": "Knuffels",
        "itemCategory2": "Slaapknuffels",
        "itemCategory3": "Wilde Dieren",
        "itemVariant": "Panda"
    },
    {
        "id": 9,
        "name": "Konijn Slaapvriend - Roze Knuffel met Nachtlamp",
        "shortName": "Konijn Projector",
        "price": 54.95,
        "originalPrice": 69.95,
        "image": "https://i.imgur.com/ZxLbN3J.jpeg",
        "gallery": [
            "https://i.imgur.com/ZxLbN3J.jpeg"
        ],
        "description": "Een lief roze konijntje met sterrenprojector en zachte melodieën.",
        "features": [
            "🌟 Sterrenprojectie in 3 kleuren",
            "🎵 8 rustgevende slaapliedjes",
            "🔇 White noise & natuurgeluiden",
            "⏰ 30 minuten timer",
            "🔋 USB oplaadbaar"
        ],
        "benefits": [
            "Helpt je baby sneller in slaap te vallen",
            "Creëert een rustgevende slaapomgeving",
            "Perfect voor kleine meisjes"
        ],
        "rating": 4.7,
        "reviews": 95,
        "badge": None,
        "inStock": True,
        "ageRange": "Vanaf 0 maanden",
        "warranty": "14 dagen geld-terug-garantie",
        "itemId": "KNUF_009",
        "itemCategory": "Knuffels",
        "itemCategory2": "Slaapknuffels",
        "itemCategory3": "Boerderijdieren",
        "itemVariant": "Konijn"
    },
    {
        "id": 10,
        "name": "Uil Nachtlicht - Wijze Knuffel met Projectie",
        "shortName": "Uil Projector",
        "price": 49.95,
        "originalPrice": 64.95,
        "image": "https://i.imgur.com/kOVMcQR.jpeg",
        "gallery": [
            "https://i.imgur.com/kOVMcQR.jpeg"
        ],
        "description": "Een wijze uil die over je kindje waakt met sterrenprojectie.",
        "features": [
            "🌟 Sterrenprojectie in 3 kleuren",
            "🎵 8 rustgevende slaapliedjes",
            "🔇 White noise & natuurgeluiden",
            "⏰ 30 minuten timer",
            "🔋 USB oplaadbaar"
        ],
        "benefits": [
            "Helpt je baby sneller in slaap te vallen",
            "Creëert een rustgevende slaapomgeving",
            "Uniek uil design"
        ],
        "rating": 4.4,
        "reviews": 58,
        "badge": None,
        "inStock": True,
        "ageRange": "Vanaf 0 maanden",
        "warranty": "14 dagen geld-terug-garantie",
        "itemId": "KNUF_010",
        "itemCategory": "Knuffels",
        "itemCategory2": "Slaapknuffels",
        "itemCategory3": "Vogels",
        "itemVariant": "Uil"
    },
    {
        "id": 11,
        "name": "Beer Sterrenprojector - Klassieke Teddy met Licht",
        "shortName": "Beer Projector",
        "price": 54.95,
        "originalPrice": 69.95,
        "image": "https://i.imgur.com/m4lE3aR.jpeg",
        "gallery": [
            "https://i.imgur.com/m4lE3aR.jpeg"
        ],
        "description": "Een klassieke teddybeer met moderne sterrenprojector technologie.",
        "features": [
            "🌟 Sterrenprojectie in 3 kleuren",
            "🎵 8 rustgevende slaapliedjes",
            "🔇 White noise & natuurgeluiden",
            "⏰ 30 minuten timer",
            "🔋 USB oplaadbaar"
        ],
        "benefits": [
            "Tijdloos teddybeer design",
            "Modern met sterrenprojectie",
            "Perfect cadeau voor babyshower"
        ],
        "rating": 4.5,
        "reviews": 112,
        "badge": None,
        "inStock": False,
        "ageRange": "Vanaf 0 maanden",
        "warranty": "14 dagen geld-terug-garantie",
        "itemId": "KNUF_011",
        "itemCategory": "Knuffels",
        "itemCategory2": "Slaapknuffels",
        "itemCategory3": "Beren",
        "itemVariant": "Klassiek"
    }
]


async def seed_products():
    """Seed the database with initial products if empty"""
    if db is None:
        logger.warning("Database not set, cannot seed products")
        return
    
    try:
        count = await db.products.count_documents({})
        if count == 0:
            logger.info("Seeding products database...")
            for product in INITIAL_PRODUCTS:
                await db.products.insert_one(product)
            logger.info(f"Seeded {len(INITIAL_PRODUCTS)} products")
        else:
            logger.info(f"Products collection already has {count} products")
    except Exception as e:
        logger.error(f"Error seeding products: {e}")


def apply_image_overrides(product: dict) -> dict:
    """
    Apply image overrides to a product.
    If image_override exists and is not empty, use it instead of the default image.
    Same for gallery_overrides.
    """
    # Apply main image override
    if product.get("image_override"):
        product["image"] = product["image_override"]
    
    # Apply gallery overrides (merge with defaults if partial)
    if product.get("gallery_overrides"):
        overrides = product["gallery_overrides"]
        default_gallery = product.get("gallery", [])
        
        # Build new gallery: use override if exists, else use default
        new_gallery = []
        max_len = max(len(overrides), len(default_gallery))
        
        for i in range(max_len):
            if i < len(overrides) and overrides[i]:
                # Override exists for this position
                new_gallery.append(overrides[i])
            elif i < len(default_gallery):
                # Use default
                new_gallery.append(default_gallery[i])
        
        product["gallery"] = new_gallery
    
    return product


@router.get("")
async def get_all_products():
    """Get all products"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        products = await db.products.find({}, {"_id": 0}).to_list(length=100)
        # Apply image overrides to all products
        products = [apply_image_overrides(p) for p in products]
        return products
    except Exception as e:
        logger.error(f"Error fetching products: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{product_id}")
async def get_product(product_id: int):
    """Get a single product by ID"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        product = await db.products.find_one({"id": product_id}, {"_id": 0})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        # Apply image overrides
        product = apply_image_overrides(product)
        return product
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching product {product_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def create_product(product: dict):
    """Create a new product (admin only)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        # Get the next ID
        last_product = await db.products.find_one(sort=[("id", -1)])
        next_id = (last_product["id"] + 1) if last_product else 1
        
        product["id"] = next_id
        product["created_at"] = datetime.now(timezone.utc)
        
        await db.products.insert_one(product)
        
        # Return without _id
        del product["_id"]
        return product
    except Exception as e:
        logger.error(f"Error creating product: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{product_id}")
async def update_product(product_id: int, updates: dict):
    """Update a product (admin only)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        # Remove fields that shouldn't be updated
        updates.pop("id", None)
        updates.pop("_id", None)
        updates["updated_at"] = datetime.now(timezone.utc)
        
        result = await db.products.update_one(
            {"id": product_id},
            {"$set": updates}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Return updated product
        product = await db.products.find_one({"id": product_id}, {"_id": 0})
        return product
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating product {product_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{product_id}")
async def delete_product(product_id: int):
    """Delete a product (admin only)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        result = await db.products.delete_one({"id": product_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return {"message": "Product deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting product {product_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@router.put("/{product_id}/advanced")
async def update_product_advanced(product_id: int, updates: dict):
    """
    Update product with advanced customizations (images, sections, etc.)
    For the Advanced Product Editor
    """
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        # Remove fields that shouldn't be updated
        updates.pop("id", None)
        updates.pop("_id", None)
        updates["updated_at"] = datetime.now(timezone.utc)
        
        # Store advanced customizations
        result = await db.products.update_one(
            {"id": product_id},
            {"$set": updates}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Return updated product
        product = await db.products.find_one({"id": product_id}, {"_id": 0})
        logger.info(f"Product {product_id} advanced settings updated")
        return product
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating product advanced {product_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{product_id}/advanced")
async def get_product_advanced(product_id: int):
    """Get product with all advanced customizations"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        product = await db.products.find_one({"id": product_id}, {"_id": 0})
        
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return product
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching product advanced {product_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

