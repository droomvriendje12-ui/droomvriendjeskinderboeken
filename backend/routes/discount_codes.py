"""
Discount Codes API Routes
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime, timezone
import logging
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/discount-codes", tags=["discount-codes"])

# Will be set by main app
db = None

def set_database(database):
    """Set the database connection"""
    global db
    db = database


@router.get("")
async def get_all_discount_codes():
    """Get all discount codes (admin only)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        codes = await db.discount_codes.find({}, {"_id": 0}).to_list(length=100)
        return codes
    except Exception as e:
        logger.error(f"Error fetching discount codes: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{code_id}")
async def get_discount_code(code_id: str):
    """Get a single discount code by ID"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        code = await db.discount_codes.find_one({"id": code_id}, {"_id": 0})
        if not code:
            raise HTTPException(status_code=404, detail="Kortingscode niet gevonden")
        return code
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching discount code {code_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def create_discount_code(code_data: dict):
    """Create a new discount code (admin only)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        # Validate required fields
        if not code_data.get("code"):
            raise HTTPException(status_code=400, detail="Code is verplicht")
        if not code_data.get("discount_type"):
            raise HTTPException(status_code=400, detail="Korting type is verplicht")
        if code_data.get("discount_value") is None:
            raise HTTPException(status_code=400, detail="Korting waarde is verplicht")
        
        # Check if code already exists
        existing = await db.discount_codes.find_one({"code": code_data["code"].upper()})
        if existing:
            raise HTTPException(status_code=400, detail="Deze kortingscode bestaat al")
        
        # Create the discount code
        discount_code = {
            "id": str(uuid.uuid4())[:8].upper(),
            "code": code_data["code"].upper(),
            "discount_type": code_data["discount_type"],  # 'percentage', 'fixed', 'free_shipping'
            "discount_value": float(code_data["discount_value"]),
            "min_order_amount": float(code_data.get("min_order_amount", 0)),
            "max_uses": code_data.get("max_uses"),  # None = unlimited
            "current_uses": 0,
            "valid_from": code_data.get("valid_from"),
            "valid_until": code_data.get("valid_until"),
            "active": code_data.get("active", True),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "description": code_data.get("description", "")
        }
        
        await db.discount_codes.insert_one(discount_code)
        
        # Return without _id
        discount_code.pop("_id", None)
        logger.info(f"Created discount code: {discount_code['code']}")
        return discount_code
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating discount code: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{code_id}")
async def update_discount_code(code_id: str, updates: dict):
    """Update a discount code (admin only)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        # Remove fields that shouldn't be updated
        updates.pop("id", None)
        updates.pop("_id", None)
        updates.pop("current_uses", None)  # Don't allow manual update of uses
        updates.pop("created_at", None)
        
        # Uppercase the code if provided
        if "code" in updates:
            updates["code"] = updates["code"].upper()
        
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        result = await db.discount_codes.update_one(
            {"id": code_id},
            {"$set": updates}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Kortingscode niet gevonden")
        
        # Return updated code
        code = await db.discount_codes.find_one({"id": code_id}, {"_id": 0})
        logger.info(f"Updated discount code: {code_id}")
        return code
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating discount code {code_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{code_id}")
async def delete_discount_code(code_id: str):
    """Delete a discount code (admin only)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        result = await db.discount_codes.delete_one({"id": code_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Kortingscode niet gevonden")
        
        logger.info(f"Deleted discount code: {code_id}")
        return {"message": "Kortingscode verwijderd"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting discount code {code_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/validate")
async def validate_discount_code(data: dict):
    """Validate a discount code and calculate discount"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        code = data.get("code", "").upper().strip()
        cart_total = float(data.get("cart_total", 0))
        
        if not code:
            raise HTTPException(status_code=400, detail="Code is verplicht")
        
        # Find the discount code
        discount_code = await db.discount_codes.find_one({"code": code}, {"_id": 0})
        
        if not discount_code:
            return {
                "valid": False,
                "message": "Ongeldige kortingscode",
                "discount": 0
            }
        
        # Check if active
        if not discount_code.get("active", True):
            return {
                "valid": False,
                "message": "Deze kortingscode is niet meer actief",
                "discount": 0
            }
        
        # Check validity dates
        now = datetime.now(timezone.utc)
        
        if discount_code.get("valid_from"):
            valid_from = datetime.fromisoformat(discount_code["valid_from"].replace("Z", "+00:00"))
            if now < valid_from:
                return {
                    "valid": False,
                    "message": "Deze kortingscode is nog niet geldig",
                    "discount": 0
                }
        
        if discount_code.get("valid_until"):
            valid_until = datetime.fromisoformat(discount_code["valid_until"].replace("Z", "+00:00"))
            if now > valid_until:
                return {
                    "valid": False,
                    "message": "Deze kortingscode is verlopen",
                    "discount": 0
                }
        
        # Check usage limit
        max_uses = discount_code.get("max_uses")
        current_uses = discount_code.get("current_uses", 0)
        if max_uses is not None and current_uses >= max_uses:
            return {
                "valid": False,
                "message": "Deze kortingscode is al maximaal gebruikt",
                "discount": 0
            }
        
        # Check minimum order amount
        min_amount = discount_code.get("min_order_amount", 0)
        if cart_total < min_amount:
            return {
                "valid": False,
                "message": f"Minimaal bestelbedrag is €{min_amount:.2f}",
                "discount": 0
            }
        
        # Calculate discount
        discount_type = discount_code.get("discount_type")
        discount_value = discount_code.get("discount_value", 0)
        
        if discount_type == "percentage":
            discount = round(cart_total * (discount_value / 100), 2)
            message = f"{discount_value}% korting toegepast!"
        elif discount_type == "fixed":
            discount = min(discount_value, cart_total)  # Can't be more than cart total
            message = f"€{discount:.2f} korting toegepast!"
        elif discount_type == "free_shipping":
            discount = 0  # Shipping discount handled separately
            message = "Gratis verzending toegepast!"
        else:
            discount = 0
            message = "Korting toegepast!"
        
        return {
            "valid": True,
            "message": message,
            "discount": discount,
            "discount_type": discount_type,
            "discount_value": discount_value,
            "code": code,
            "free_shipping": discount_type == "free_shipping"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error validating discount code: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/use")
async def use_discount_code(data: dict):
    """Mark a discount code as used (called after successful order)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        code = data.get("code", "").upper().strip()
        order_id = data.get("order_id")
        
        if not code:
            return {"success": False, "message": "Code is verplicht"}
        
        # Increment usage count
        result = await db.discount_codes.update_one(
            {"code": code},
            {
                "$inc": {"current_uses": 1},
                "$push": {"used_orders": {"order_id": order_id, "used_at": datetime.now(timezone.utc).isoformat()}}
            }
        )
        
        if result.matched_count == 0:
            return {"success": False, "message": "Code niet gevonden"}
        
        logger.info(f"Discount code {code} used for order {order_id}")
        return {"success": True, "message": "Kortingscode gebruikt"}
    except Exception as e:
        logger.error(f"Error using discount code: {e}")
        return {"success": False, "message": str(e)}


# Seed some default discount codes
async def seed_discount_codes():
    """Seed some default discount codes if none exist"""
    if db is None:
        return
    
    try:
        count = await db.discount_codes.count_documents({})
        if count == 0:
            default_codes = [
                {
                    "id": "WELKOM10",
                    "code": "WELKOM10",
                    "discount_type": "percentage",
                    "discount_value": 10,
                    "min_order_amount": 0,
                    "max_uses": None,
                    "current_uses": 0,
                    "valid_from": None,
                    "valid_until": None,
                    "active": True,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "description": "10% welkomstkorting voor nieuwe klanten"
                },
                {
                    "id": "LENTE25",
                    "code": "LENTE25",
                    "discount_type": "percentage",
                    "discount_value": 25,
                    "min_order_amount": 75,
                    "max_uses": 100,
                    "current_uses": 0,
                    "valid_from": None,
                    "valid_until": "2026-02-28T23:59:59Z",
                    "active": True,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "description": "Lente sale - 25% korting bij minimaal €75"
                },
                {
                    "id": "GRATISVZ",
                    "code": "GRATISVERZENDING",
                    "discount_type": "free_shipping",
                    "discount_value": 0,
                    "min_order_amount": 50,
                    "max_uses": None,
                    "current_uses": 0,
                    "valid_from": None,
                    "valid_until": None,
                    "active": True,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "description": "Gratis verzending bij minimaal €50"
                },
                {
                    "id": "5EURO",
                    "code": "5EUROKORTING",
                    "discount_type": "fixed",
                    "discount_value": 5,
                    "min_order_amount": 30,
                    "max_uses": 50,
                    "current_uses": 0,
                    "valid_from": None,
                    "valid_until": None,
                    "active": True,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "description": "€5 korting bij minimaal €30"
                }
            ]
            
            for code in default_codes:
                await db.discount_codes.insert_one(code)
            
            logger.info(f"Seeded {len(default_codes)} default discount codes")
    except Exception as e:
        logger.error(f"Error seeding discount codes: {e}")
