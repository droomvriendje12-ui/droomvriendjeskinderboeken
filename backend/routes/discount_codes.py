"""
Discount Codes API Routes - Supabase (single source of truth)

Admin CRUD + public validate endpoint share the same Supabase table as the
CartSidebar /api/discount/validate endpoint. This eliminates the old
MongoDB/Supabase split that caused codes created in admin to not appear
on the storefront.
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
import logging
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/discount-codes", tags=["discount-codes"])

# Supabase client - will be set by main app
supabase = None


def set_supabase_client(client):
    """Set the Supabase client"""
    global supabase
    supabase = client
    logger.info("✅ Supabase client set for discount_codes route")


# ----- Helpers -----
def _to_admin_shape(row: dict) -> dict:
    """Map Supabase row to the shape the admin UI expects.

    Supabase column `expires_at` is exposed to the UI as `valid_until` to keep
    backwards compatibility with the existing AdminDiscountCodesPage form.
    """
    if not row:
        return row
    return {
        "id": row.get("id"),
        "code": row.get("code"),
        "discount_type": row.get("discount_type"),
        "discount_value": row.get("discount_value", 0),
        "min_order_amount": row.get("min_order_amount", 0) or 0,
        "max_uses": row.get("max_uses"),
        "current_uses": row.get("current_uses", 0) or 0,
        "valid_from": None,  # not stored in Supabase schema
        "valid_until": row.get("expires_at"),
        "active": row.get("active", True),
        "free_shipping": row.get("free_shipping", False),
        "description": row.get("description", ""),
        "created_at": row.get("created_at"),
    }


def _from_admin_payload(payload: dict) -> dict:
    """Map an admin payload to Supabase columns (drops unknown fields)."""
    mapped = {}
    if "code" in payload and payload["code"] is not None:
        mapped["code"] = payload["code"].upper().strip()
    if "discount_type" in payload and payload["discount_type"] is not None:
        mapped["discount_type"] = payload["discount_type"]
    if "discount_value" in payload and payload["discount_value"] is not None:
        mapped["discount_value"] = float(payload["discount_value"])
    if "min_order_amount" in payload and payload["min_order_amount"] is not None:
        mapped["min_order_amount"] = float(payload["min_order_amount"])
    if "max_uses" in payload:
        mv = payload["max_uses"]
        mapped["max_uses"] = int(mv) if mv not in (None, "", 0) else None
    if "active" in payload and payload["active"] is not None:
        mapped["active"] = bool(payload["active"])
    if "description" in payload:
        mapped["description"] = payload.get("description") or ""
    if "valid_until" in payload:
        v = payload.get("valid_until")
        mapped["expires_at"] = v if v else None
    if "free_shipping" in payload:
        mapped["free_shipping"] = bool(payload["free_shipping"])
    return mapped


# ----- Routes -----
@router.get("")
async def get_all_discount_codes():
    """List all discount codes (admin)."""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    try:
        result = supabase.table("discount_codes").select("*").order("created_at", desc=True).execute()
        return [_to_admin_shape(r) for r in (result.data or [])]
    except Exception as e:
        logger.error(f"Error fetching discount codes: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{code_id}")
async def get_discount_code(code_id: str):
    """Get a single discount code by ID."""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    try:
        result = supabase.table("discount_codes").select("*").eq("id", code_id).limit(1).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Kortingscode niet gevonden")
        return _to_admin_shape(result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching discount code {code_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def create_discount_code(payload: dict):
    """Create a new discount code (admin)."""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    try:
        if not payload.get("code"):
            raise HTTPException(status_code=400, detail="Code is verplicht")
        if not payload.get("discount_type"):
            raise HTTPException(status_code=400, detail="Korting type is verplicht")
        if payload.get("discount_value") is None and payload.get("discount_type") != "free_shipping":
            raise HTTPException(status_code=400, detail="Korting waarde is verplicht")

        code_upper = payload["code"].upper().strip()
        existing = supabase.table("discount_codes").select("id").eq("code", code_upper).limit(1).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Deze kortingscode bestaat al")

        row = _from_admin_payload(payload)
        row["id"] = str(uuid.uuid4())[:8].upper()
        row.setdefault("active", True)
        row.setdefault("current_uses", 0)
        row.setdefault("min_order_amount", 0)
        row.setdefault("free_shipping", payload.get("discount_type") == "free_shipping")
        row["created_at"] = datetime.now(timezone.utc).isoformat()

        result = supabase.table("discount_codes").insert(row).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Aanmaken mislukt")
        logger.info(f"Created discount code: {row['code']}")
        return _to_admin_shape(result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating discount code: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{code_id}")
async def update_discount_code(code_id: str, payload: dict):
    """Update a discount code (admin)."""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    try:
        updates = _from_admin_payload(payload)
        if not updates:
            raise HTTPException(status_code=400, detail="Geen geldige velden om bij te werken")
        result = supabase.table("discount_codes").update(updates).eq("id", code_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Kortingscode niet gevonden")
        logger.info(f"Updated discount code: {code_id}")
        return _to_admin_shape(result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating discount code {code_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{code_id}")
async def delete_discount_code(code_id: str):
    """Delete a discount code (admin)."""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    try:
        existing = supabase.table("discount_codes").select("id").eq("id", code_id).limit(1).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Kortingscode niet gevonden")
        supabase.table("discount_codes").delete().eq("id", code_id).execute()
        logger.info(f"Deleted discount code: {code_id}")
        return {"message": "Kortingscode verwijderd"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting discount code {code_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/validate")
async def validate_discount_code(data: dict):
    """Validate a discount code and calculate the discount.

    Same Supabase source as `/api/discount/validate` so CheckoutPage and
    CartSidebar stay consistent.
    """
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    try:
        code = (data.get("code") or "").upper().strip()
        cart_total = float(data.get("cart_total", 0) or 0)
        if not code:
            raise HTTPException(status_code=400, detail="Code is verplicht")

        result = supabase.table("discount_codes").select("*").eq("code", code).limit(1).execute()
        if not result.data:
            return {"valid": False, "message": "Ongeldige kortingscode", "discount": 0}
        row = result.data[0]

        if not row.get("active", True):
            return {"valid": False, "message": "Deze kortingscode is niet meer actief", "discount": 0}

        if row.get("expires_at"):
            try:
                exp = datetime.fromisoformat(row["expires_at"].replace("Z", "+00:00"))
                if datetime.now(timezone.utc) > exp:
                    return {"valid": False, "message": "Deze kortingscode is verlopen", "discount": 0}
            except Exception:
                pass

        max_uses = row.get("max_uses")
        current_uses = row.get("current_uses", 0) or 0
        if max_uses is not None and current_uses >= max_uses:
            return {"valid": False, "message": "Deze kortingscode is al maximaal gebruikt", "discount": 0}

        min_amount = row.get("min_order_amount", 0) or 0
        if cart_total < min_amount:
            return {"valid": False, "message": f"Minimaal bestelbedrag is €{min_amount:.2f}", "discount": 0}

        d_type = row.get("discount_type")
        d_value = row.get("discount_value", 0) or 0
        if d_type == "percentage":
            discount = round(cart_total * (d_value / 100), 2)
            message = f"{d_value:g}% korting toegepast!"
        elif d_type == "fixed":
            discount = round(min(d_value, cart_total), 2)
            message = f"€{discount:.2f} korting toegepast!"
        elif d_type == "free_shipping":
            discount = 0
            message = "Gratis verzending toegepast!"
        else:
            discount = 0
            message = "Korting toegepast!"

        return {
            "valid": True,
            "message": message,
            "discount": discount,
            "discount_type": d_type,
            "discount_value": d_value,
            "code": code,
            "free_shipping": d_type == "free_shipping",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error validating discount code: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/use")
async def use_discount_code(data: dict):
    """Increment usage count after successful order."""
    if supabase is None:
        return {"success": False, "message": "Database not configured"}
    try:
        code = (data.get("code") or "").upper().strip()
        if not code:
            return {"success": False, "message": "Code is verplicht"}
        existing = supabase.table("discount_codes").select("current_uses").eq("code", code).limit(1).execute()
        if not existing.data:
            return {"success": False, "message": "Code niet gevonden"}
        new_uses = (existing.data[0].get("current_uses") or 0) + 1
        supabase.table("discount_codes").update({"current_uses": new_uses}).eq("code", code).execute()
        logger.info(f"Discount code {code} used (count={new_uses})")
        return {"success": True, "message": "Kortingscode gebruikt"}
    except Exception as e:
        logger.error(f"Error using discount code: {e}")
        return {"success": False, "message": str(e)}


async def seed_discount_codes():
    """No-op kept for backward compatibility with server.py startup hook.

    Default codes (WELKOM10, LENTE25, EENMALIG2026) are seeded in Supabase
    by the project's SQL migrations.
    """
    return
