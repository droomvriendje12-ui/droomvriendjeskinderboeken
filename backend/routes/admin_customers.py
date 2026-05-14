"""
Admin Customers Routes - aggregated customer data from orders table.
Mounted under /api/admin/customers via api_router.
"""
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/customers", tags=["admin", "customers"])

# Wired by server.py
_supabase = None
_admin_verifier = None

_security = HTTPBearer(auto_error=False)


def set_supabase_client(client):
    global _supabase
    _supabase = client


def set_admin_verifier(verifier):
    global _admin_verifier
    _admin_verifier = verifier


def _require_admin(credentials: HTTPAuthorizationCredentials = Depends(_security)):
    if _admin_verifier is None:
        raise HTTPException(status_code=500, detail="Admin verifier not configured")
    admin = _admin_verifier(credentials)
    if not admin:
        raise HTTPException(status_code=401, detail="Niet geautoriseerd")
    return admin


@router.get("")
async def list_customers(search: Optional[str] = None, page: int = 1, limit: int = 50,
                         admin=Depends(_require_admin)):
    """Aggregate customer overview from orders table."""
    if _supabase is None:
        return {"customers": [], "total": 0, "page": page, "limit": limit}

    try:
        r = _supabase.table("orders").select(
            "customer_email, customer_name, customer_phone, total_amount, status, created_at"
        ).execute()
        rows = r.data or []

        agg = {}
        for o in rows:
            email = (o.get("customer_email") or "").lower()
            if not email:
                continue
            c = agg.setdefault(email, {
                "email": email, "name": "", "phone": "",
                "total_orders": 0, "paid_orders": 0, "total_spent": 0.0,
                "first_order_at": None, "last_order_at": None,
            })
            if o.get("customer_name"):
                c["name"] = o["customer_name"]
            if o.get("customer_phone"):
                c["phone"] = o["customer_phone"]
            c["total_orders"] += 1
            if o.get("status") in ("paid", "shipped", "delivered"):
                c["paid_orders"] += 1
                c["total_spent"] += float(o.get("total_amount") or 0)
            created = o.get("created_at")
            if created:
                # ISO 8601 is lexicographically sortable, safe for min/max
                if not c["first_order_at"] or created < c["first_order_at"]:
                    c["first_order_at"] = created
                if not c["last_order_at"] or created > c["last_order_at"]:
                    c["last_order_at"] = created

        customers = list(agg.values())
        if search:
            s = search.lower()
            customers = [
                c for c in customers
                if s in c["email"]
                or s in (c["name"] or "").lower()
                or s in (c["phone"] or "").lower()
            ]
        customers.sort(key=lambda x: x.get("last_order_at") or "", reverse=True)

        total = len(customers)
        start = (page - 1) * limit
        return {
            "customers": customers[start:start + limit],
            "total": total,
            "page": page,
            "limit": limit,
        }
    except Exception as e:
        logger.error(f"Admin customers list error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{email}")
async def get_customer_detail(email: str, admin=Depends(_require_admin)):
    """Customer detail with all their orders."""
    if _supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")

    try:
        email_lc = email.lower()
        r = (_supabase.table("orders")
             .select("*")
             .ilike("customer_email", email_lc)
             .order("created_at", desc=True)
             .execute())
        orders = r.data or []
        if not orders:
            raise HTTPException(status_code=404, detail="Klant niet gevonden")

        latest = orders[0]
        total_spent = sum(
            float(o.get("total_amount") or 0)
            for o in orders
            if o.get("status") in ("paid", "shipped", "delivered")
        )
        return {
            "customer": {
                "email": email_lc,
                "name": latest.get("customer_name"),
                "phone": latest.get("customer_phone"),
                "shipping_address": latest.get("shipping_address"),
                "shipping_city": latest.get("shipping_city"),
                "shipping_zipcode": latest.get("shipping_zipcode"),
                "total_orders": len(orders),
                "total_spent": total_spent,
                "first_order_at": orders[-1].get("created_at"),
                "last_order_at": orders[0].get("created_at"),
            },
            "orders": orders,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Customer detail error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
