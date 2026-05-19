"""
Discount Codes API Routes - Supabase (single source of truth)

Admin CRUD + public validate endpoint share the same Supabase table as the
CartSidebar /api/discount/validate endpoint. This eliminates the old
MongoDB/Supabase split that caused codes created in admin to not appear
on the storefront.
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timezone
import logging
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/discount-codes", tags=["discount-codes"])

# Supabase client + admin verifier - set by server.py at startup
supabase = None
_admin_verifier = None
_security = HTTPBearer(auto_error=False)


def set_supabase_client(client):
    """Set the Supabase client"""
    global supabase
    supabase = client
    logger.info("✅ Supabase client set for discount_codes route")


def set_admin_verifier(verifier):
    """Inject admin token verifier (callable(credentials) -> admin dict or None)."""
    global _admin_verifier
    _admin_verifier = verifier


def _require_admin(credentials: HTTPAuthorizationCredentials = Depends(_security)):
    if _admin_verifier is None:
        raise HTTPException(status_code=500, detail="Admin verifier not configured")
    admin = _admin_verifier(credentials)
    if not admin:
        raise HTTPException(status_code=401, detail="Niet geautoriseerd")
    return admin


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
async def create_discount_code(payload: dict, admin=Depends(_require_admin)):
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
async def update_discount_code(code_id: str, payload: dict, admin=Depends(_require_admin)):
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
async def delete_discount_code(code_id: str, admin=Depends(_require_admin)):
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

    Response shape (unified):
        {
            ok: bool,                  # true if the code is currently usable
            valid: bool,               # alias of `ok`, kept for legacy clients
            message: str,              # localized user-facing message
            code: str | null,          # echoed code (uppercased, trimmed)
            discount: float,           # discount amount in EUR (0 for free shipping)
            discount_amount: float,    # alias of `discount`
            discount_type: str | null, # 'percentage' | 'fixed' | 'free_shipping'
            discount_value: float,     # raw value as configured
            free_shipping: bool,
            error_code: str | null,    # machine-readable failure reason
        }
    """
    if supabase is None:
        return _error_response("Database niet beschikbaar", code=None, status_code=500)
    try:
        code = (data.get("code") or "").upper().strip()
        cart_total = float(data.get("cart_total", 0) or 0)
        if not code:
            return _error_response("Code is verplicht", code=None, error_code="MISSING_CODE")

        result = supabase.table("discount_codes").select("*").eq("code", code).limit(1).execute()
        if not result.data:
            return _error_response("Ongeldige kortingscode", code=code, error_code="NOT_FOUND")
        row = result.data[0]

        if not row.get("active", True):
            return _error_response("Deze kortingscode is niet meer actief", code=code, error_code="INACTIVE")

        if row.get("expires_at"):
            try:
                exp = datetime.fromisoformat(row["expires_at"].replace("Z", "+00:00"))
                if datetime.now(timezone.utc) > exp:
                    return _error_response("Deze kortingscode is verlopen", code=code, error_code="EXPIRED")
            except Exception:
                pass

        max_uses = row.get("max_uses")
        current_uses = row.get("current_uses", 0) or 0
        if max_uses is not None and current_uses >= max_uses:
            return _error_response("Deze kortingscode is al maximaal gebruikt", code=code, error_code="MAX_USES")

        min_amount = row.get("min_order_amount", 0) or 0
        if cart_total < min_amount:
            return _error_response(
                f"Minimaal bestelbedrag is €{min_amount:.2f}",
                code=code,
                error_code="MIN_ORDER",
            )

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
            "ok": True,
            "valid": True,
            "message": message,
            "code": code,
            "discount": discount,
            "discount_amount": discount,
            "discount_type": d_type,
            "discount_value": d_value,
            "free_shipping": d_type == "free_shipping",
            "error_code": None,
        }
    except Exception as e:
        logger.error(f"Error validating discount code: {e}")
        return _error_response("Er ging iets mis bij het valideren", code=None, error_code="SERVER_ERROR", status_code=500)


@router.post("/use")
async def use_discount_code(data: dict):
    """Atomically increment the usage counter for a discount code.

    Uses optimistic concurrency control (compare-and-swap on `current_uses`)
    so two simultaneous orders can't both go over `max_uses`. Retries up to
    5 times on contention.

    Response shape (unified):
        { ok: bool, message: str, code: str | null, current_uses: int | null,
          max_uses: int | null, error_code: str | null }
    """
    if supabase is None:
        return _error_response("Database niet beschikbaar", code=None, status_code=500)
    try:
        code = (data.get("code") or "").upper().strip()
        if not code:
            return _error_response("Code is verplicht", code=None, error_code="MISSING_CODE")

        MAX_RETRIES = 5
        for attempt in range(MAX_RETRIES):
            existing = supabase.table("discount_codes").select(
                "id, current_uses, max_uses, active"
            ).eq("code", code).limit(1).execute()
            if not existing.data:
                return _error_response("Code niet gevonden", code=code, error_code="NOT_FOUND")

            row = existing.data[0]
            if not row.get("active", True):
                return _error_response("Code niet meer actief", code=code, error_code="INACTIVE")

            prev = int(row.get("current_uses") or 0)
            max_uses = row.get("max_uses")
            if max_uses is not None and prev >= int(max_uses):
                return _error_response(
                    "Code is al maximaal gebruikt",
                    code=code,
                    error_code="MAX_USES",
                )

            new_uses = prev + 1
            # Compare-and-swap: only update if current_uses still equals `prev`
            update_q = supabase.table("discount_codes").update(
                {"current_uses": new_uses}
            ).eq("code", code).eq("current_uses", prev)
            result = update_q.execute()
            if result.data:
                logger.info(f"Discount code {code} used (count={new_uses}/{max_uses or '∞'})")
                return {
                    "ok": True,
                    "message": "Kortingscode gebruikt",
                    "code": code,
                    "current_uses": new_uses,
                    "max_uses": max_uses,
                    "error_code": None,
                }
            # Contention: another request updated first — retry
            logger.warning(f"Contention on discount code {code}, retry {attempt + 1}/{MAX_RETRIES}")

        return _error_response(
            "Code is op dit moment druk, probeer opnieuw",
            code=code,
            error_code="CONTENTION",
            status_code=409,
        )
    except Exception as e:
        logger.error(f"Error using discount code: {e}")
        return _error_response("Er ging iets mis", code=None, error_code="SERVER_ERROR", status_code=500)


# ────────────────────────────────────────────────────────────────────────────
# Helpers
# ────────────────────────────────────────────────────────────────────────────
def _error_response(message: str, *, code=None, error_code: str = "INVALID", status_code: int = 200):
    """Unified error envelope. Always 200 unless explicitly elevated so the
    frontend can show the user a friendly message without try/catch noise."""
    return {
        "ok": False,
        "valid": False,            # legacy alias for validate endpoint
        "message": message,
        "code": code,
        "discount": 0,
        "discount_amount": 0,
        "discount_type": None,
        "discount_value": 0,
        "free_shipping": False,
        "error_code": error_code,
    }


async def seed_discount_codes():
    """No-op kept for backward compatibility with server.py startup hook.

    Default codes (WELKOM10, LENTE25, EENMALIG2026) are seeded in Supabase
    by the project's SQL migrations.
    """
    return
