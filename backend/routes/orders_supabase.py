"""
Orders & Payments API Routes - Supabase PostgreSQL based
"""
from fastapi import APIRouter, HTTPException, Request
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
import logging
import uuid
import os
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from mollie.api.client import Client as MollieClient

logger = logging.getLogger(__name__)

router = APIRouter(tags=["orders"])

# Supabase client - will be set by main app
supabase = None

# MongoDB fallback - will be set by main app
mongo_db = None


def set_mongo_db(db):
    """Set MongoDB client for fallback order storage"""
    global mongo_db
    mongo_db = db
    logger.info("✅ MongoDB fallback set for orders route")

# SMTP config
SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.transip.email')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 465))
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
SMTP_FROM = os.environ.get('SMTP_FROM', 'info@droomvriendjes.com')
OWNER_EMAIL = "info@droomvriendjes.com"


def _send_email(to_email: str, subject: str, html_content: str, text_content: str):
    """Send email via Resend."""
    try:
        from services.email_sender import send_email as resend_send
        result = resend_send(
            to_email=to_email,
            subject=subject,
            html_content=html_content,
            text_content=text_content,
        )
        if result["success"]:
            logger.info(f"Email sent to {to_email}: {subject}")
            return True
        logger.warning(f"Email send to {to_email} did not succeed: {result.get('error')}")
        return False
    except Exception as e:
        logger.error(f"Email failed to {to_email}: {e}")
        return False


def _send_order_confirmation(order_data: dict, items: list):
    """Send order confirmation to customer after successful payment"""
    customer_email = order_data.get('customer_email')
    if not customer_email:
        return False
    customer_name = order_data.get('customer_name', 'Klant')
    order_number = order_data.get('order_number', order_data.get('id', '')[:8].upper())
    total_amount = order_data.get('total_amount', 0)

    items_html = ""
    for item in items:
        items_html += f"""
        <tr>
            <td style="padding:10px;border-bottom:1px solid #eee;">{item.get('product_name','Product')}</td>
            <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">{item.get('quantity',1)}x</td>
            <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">EUR {item.get('unit_price', item.get('price',0)):.2f}</td>
        </tr>"""

    html = f"""<!DOCTYPE html><html><head><meta charset="utf-8"></head>
    <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9f9f9;">
    <div style="background:#fff;border-radius:10px;padding:30px;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align:center;margin-bottom:30px;">
            <h1 style="color:#8B7355;margin:0;">Droomvriendjes</h1>
        </div>
        <h2 style="color:#333;">Bedankt voor je bestelling, {customer_name}!</h2>
        <p style="color:#666;line-height:1.6;">Je bestelling is succesvol ontvangen en wordt zo snel mogelijk verwerkt.</p>
        <div style="background:#fdf8f3;border-radius:8px;padding:15px;margin:20px 0;">
            <p style="margin:0;color:#8B7355;"><strong>Bestelnummer:</strong> {order_number}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <thead><tr style="background:#8B7355;color:white;">
                <th style="padding:10px;text-align:left;">Product</th>
                <th style="padding:10px;text-align:center;">Aantal</th>
                <th style="padding:10px;text-align:right;">Prijs</th>
            </tr></thead>
            <tbody>{items_html}</tbody>
            <tfoot><tr>
                <td colspan="2" style="padding:15px;font-weight:bold;font-size:18px;">Totaal</td>
                <td style="padding:15px;font-weight:bold;font-size:18px;text-align:right;color:#8B7355;">EUR {total_amount:.2f}</td>
            </tr></tfoot>
        </table>
        <div style="background:#e8f5e9;border-radius:8px;padding:15px;margin:20px 0;">
            <p style="margin:0;color:#2e7d32;">Gratis verzending - Voor 23:00 besteld, morgen in huis!</p>
        </div>
        <div style="border-top:1px solid #eee;margin-top:30px;padding-top:20px;text-align:center;color:#999;">
            <p>Vragen? Mail naar <a href="mailto:info@droomvriendjes.com" style="color:#8B7355;">info@droomvriendjes.com</a></p>
        </div>
    </div></body></html>"""

    text = f"Bedankt voor je bestelling, {customer_name}! Bestelnummer: {order_number}. Totaal: EUR {total_amount:.2f}"
    return _send_email(customer_email, f"Bedankt voor je bestelling! #{order_number}", html, text)


def _send_order_notification(order_data: dict, items: list, event_type: str):
    """Send order notification to shop owner"""
    order_number = order_data.get('order_number', order_data.get('id', '')[:8].upper())
    customer_email = order_data.get('customer_email', '')
    customer_name = order_data.get('customer_name', '')
    total = order_data.get('total_amount', 0)

    titles = {
        'order_placed': ('Nieuwe Bestelling', '#3b82f6'),
        'payment_success': ('Betaling Geslaagd', '#10b981'),
        'payment_failed': ('Betaling Mislukt', '#ef4444'),
    }
    title, color = titles.get(event_type, titles['order_placed'])

    html = f"""<html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
    <div style="background:{color};padding:15px;border-radius:8px 8px 0 0;"><h2 style="color:white;margin:0;">{title}</h2></div>
    <div style="padding:20px;border:1px solid #eee;">
        <p><strong>Order:</strong> {order_number}</p>
        <p><strong>Klant:</strong> {customer_name} ({customer_email})</p>
        <p><strong>Totaal:</strong> EUR {total:.2f}</p>
    </div></body></html>"""
    text = f"{title}: {order_number} - {customer_name} - EUR {total:.2f}"
    return _send_email(OWNER_EMAIL, f"{title} - #{order_number}", html, text)

def set_supabase_client(client):
    """Set the Supabase client"""
    global supabase
    supabase = client
    logger.info("✅ Supabase client set for orders route")


# Pydantic models
class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float


class OrderCreate(BaseModel):
    customer_email: str
    customer_name: str
    customer_phone: Optional[str] = None
    customer_address: str
    customer_city: str
    customer_zipcode: str
    customer_comment: Optional[str] = None
    items: List[OrderItem]
    subtotal: Optional[float] = None
    discount: Optional[float] = None
    total_amount: float
    discount_code: Optional[str] = None
    coupon_discount: Optional[float] = None
    affiliate_code: Optional[str] = None
    gift_wrap: Optional[bool] = False


class PaymentCreate(BaseModel):
    order_id: str
    payment_method: str = "ideal"


class ExpressCheckoutRequest(BaseModel):
    payment_method: str
    items: List[OrderItem]
    subtotal: Optional[float] = None
    discount: Optional[float] = None
    discount_code: Optional[str] = None
    coupon_discount: Optional[float] = None
    total_amount: float
    gift_wrap: Optional[bool] = False


import time as _time


def get_mollie_client():
    """Get configured Mollie client - uses live key in production, test key in dev"""
    api_key = os.environ.get('MOLLIE_API_KEY', '')
    if not api_key:
        raise ValueError("MOLLIE_API_KEY not configured")
    client = MollieClient()
    client.set_api_key(api_key)
    return client


def mollie_create_payment_with_retry(mollie_client, payment_data, retries=3, delay=1.0):
    """Create Mollie payment with retry logic for connection issues"""
    last_error = None
    for attempt in range(1, retries + 1):
        try:
            return mollie_client.payments.create(payment_data)
        except Exception as e:
            last_error = e
            err_str = str(e).lower()
            # Only retry on network/connection errors, not auth or validation
            if 'name or service not known' in err_str or 'connection' in err_str or 'timeout' in err_str:
                logger.warning(f"Mollie connection attempt {attempt}/{retries} failed: {e}")
                if attempt < retries:
                    _time.sleep(delay)
                continue
            raise  # Non-retryable error, raise immediately
    raise last_error


@router.get("/mollie-status")
async def mollie_status():
    """Health check: verify Mollie API connectivity and key validity"""
    try:
        client = get_mollie_client()
        # Try a lightweight API call to verify connectivity
        client.methods.list()
        return {"status": "ok", "message": "Mollie API bereikbaar en sleutel geldig"}
    except ValueError as e:
        return {"status": "error", "detail": str(e)}
    except Exception as e:
        err_str = str(e)
        if 'name or service not known' in err_str.lower() or 'connection' in err_str.lower():
            return {"status": "error", "detail": "Mollie API niet bereikbaar (netwerkfout). Probeer het later opnieuw."}
        return {"status": "error", "detail": err_str}


def get_frontend_url():
    """Get frontend URL for redirects"""
    return os.environ.get('FRONTEND_URL', 'https://droomvriendjes.com')


def get_api_url():
    """Get API URL for webhooks"""
    return os.environ.get('API_URL', 'https://droomvriendjes.com')


def _supabase_available():
    """Quick check if Supabase is reachable"""
    if supabase is None:
        return False
    try:
        supabase.table("orders").select("id").limit(1).execute()
        return True
    except Exception:
        return False


@router.post("/orders")
async def create_order(order: OrderCreate):
    """Create a new order - tries Supabase first, falls back to MongoDB"""
    use_supabase = _supabase_available()

    if not use_supabase and mongo_db is None:
        raise HTTPException(status_code=503, detail="Bestelsysteem tijdelijk niet beschikbaar. Probeer het over een paar minuten opnieuw.")

    try:
        order_id = str(uuid.uuid4())
        order_number = f"DV-{datetime.now().strftime('%Y%m%d')}-{order_id[:8].upper()}"

        order_data = {
            "id": order_id,
            "order_number": order_number,
            "customer_email": order.customer_email,
            "customer_name": order.customer_name,
            "customer_phone": order.customer_phone or "",
            "shipping_address": order.customer_address,
            "shipping_city": order.customer_city,
            "shipping_zipcode": order.customer_zipcode,
            "customer_notes": order.customer_comment or "",
            "subtotal": order.subtotal or order.total_amount,
            "discount_amount": (order.discount or 0) + (order.coupon_discount or 0),
            "total_amount": order.total_amount,
            "currency": "EUR",
            "status": "pending",
            "discount_code": order.discount_code,
            "affiliate_code": order.affiliate_code,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        items_data = []
        for item in order.items:
            items_data.append({
                "id": str(uuid.uuid4()),
                "order_id": order_id,
                "product_name": item.product_name,
                "product_sku": item.product_id,
                "quantity": item.quantity,
                "unit_price": item.price,
                "total_price": item.price * item.quantity,
            })

        if use_supabase:
            supabase.table("orders").insert(order_data).execute()
            for item in items_data:
                supabase.table("order_items").insert(item).execute()
            logger.info(f"Order created in Supabase: {order_id}")
        else:
            # MongoDB fallback
            order_data["items"] = items_data
            order_data["_storage"] = "mongodb"
            await mongo_db['orders'].insert_one(order_data)
            logger.info(f"Order created in MongoDB (fallback): {order_id}")

        # Send notification
        try:
            _send_order_notification(order_data, [{"product_name": i.product_name, "quantity": i.quantity, "unit_price": i.price} for i in order.items], 'order_placed')
        except Exception as email_err:
            logger.error(f"Failed to send order notification: {email_err}")

        return {"order_id": order_id, "status": "pending"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating order: {e}")
        raise HTTPException(status_code=500, detail="Bestelling kon niet worden aangemaakt. Probeer het opnieuw.")


@router.post("/payments/create")
async def create_payment(payment: PaymentCreate):
    """Create a Mollie payment for an order (supports both Supabase and MongoDB)"""
    try:
        use_supabase = _supabase_available()
        order = None

        # Try to find order
        if use_supabase:
            result = supabase.table("orders").select("*").eq("id", payment.order_id).limit(1).execute()
            if result.data:
                order = result.data[0]

        if not order and mongo_db is not None:
            order = await mongo_db['orders'].find_one({"id": payment.order_id}, {"_id": 0})

        if not order:
            raise HTTPException(status_code=404, detail="Bestelling niet gevonden")

        # Initialize Mollie client
        mollie_client = get_mollie_client()

        # Build URLs
        frontend_url = get_frontend_url()
        api_url = get_api_url()

        payment_data = {
            'amount': {'currency': 'EUR', 'value': f"{order['total_amount']:.2f}"},
            'description': f"Droomvriendjes Bestelling #{payment.order_id[:8].upper()}",
            'redirectUrl': f"{frontend_url}/betaling-resultaat/{payment.order_id}",
            'cancelUrl': f"{frontend_url}/checkout",
            'webhookUrl': f"{api_url}/api/webhook/mollie",
            'method': payment.payment_method,
            'metadata': {'order_id': payment.order_id, 'customer_email': order.get('customer_email', '')}
        }

        # Add billing address for Klarna/iDEAL in3
        if payment.payment_method in ['klarna', 'klarnapaylater', 'klarnasliceit', 'in3', 'ideal_in3']:
            name_parts = order.get('customer_name', '').split(' ', 1)
            payment_data['billingAddress'] = {
                'givenName': name_parts[0] if name_parts else '',
                'familyName': name_parts[1] if len(name_parts) > 1 else name_parts[0] if name_parts else '',
                'email': order.get('customer_email', ''),
                'streetAndNumber': order.get('shipping_address', ''),
                'postalCode': order.get('shipping_zipcode', ''),
                'city': order.get('shipping_city', ''),
                'country': 'NL'
            }
            payment_data['shippingAddress'] = payment_data['billingAddress'].copy()

        mollie_payment = mollie_create_payment_with_retry(mollie_client, payment_data)

        # Update order with payment info
        payment_update = {"mollie_payment_id": mollie_payment.id, "payment_method": payment.payment_method}
        if use_supabase and not order.get('_storage') == 'mongodb':
            try:
                supabase.table("orders").update(payment_update).eq("id", payment.order_id).execute()
                supabase.table("payments").insert({
                    "id": str(uuid.uuid4()), "order_id": payment.order_id,
                    "mollie_payment_id": mollie_payment.id, "status": "pending",
                    "amount": order['total_amount'], "currency": "EUR", "method": payment.payment_method,
                }).execute()
            except Exception:
                pass
        if mongo_db is not None:
            await mongo_db['orders'].update_one({"id": payment.order_id}, {"$set": payment_update})

        logger.info(f"Payment created: {mollie_payment.id}")
        return {"payment_id": mollie_payment.id, "checkout_url": mollie_payment.checkout_url, "status": mollie_payment.status}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Payment creation error: {e}")
        err_str = str(e).lower()
        if 'name or service not known' in err_str or 'connection' in err_str:
            raise HTTPException(status_code=503, detail="Betaaldienst tijdelijk niet bereikbaar. Probeer het over een paar seconden opnieuw.")
        raise HTTPException(status_code=500, detail=f"Betaling kon niet worden gestart: {str(e)}")


@router.post("/express-checkout")
async def express_checkout(req: ExpressCheckoutRequest):
    """Express checkout: creates order + payment in one step, skipping address form."""
    use_supabase = _supabase_available()

    if not use_supabase and mongo_db is None:
        raise HTTPException(status_code=503, detail="Bestelsysteem tijdelijk niet beschikbaar.")

    try:
        order_id = str(uuid.uuid4())
        order_data = {
            "id": order_id,
            "order_number": f"DV-{datetime.now().strftime('%Y%m%d')}-{order_id[:8].upper()}",
            "customer_email": "express@pending.nl",
            "customer_name": "Express Checkout",
            "customer_phone": "",
            "shipping_address": "",
            "shipping_city": "",
            "shipping_zipcode": "",
            "customer_notes": f"Express checkout via {req.payment_method}",
            "subtotal": req.subtotal or req.total_amount,
            "discount_amount": (req.discount or 0) + (req.coupon_discount or 0),
            "total_amount": req.total_amount,
            "currency": "EUR",
            "status": "pending",
            "discount_code": req.discount_code,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        items_data = []
        for item in req.items:
            items_data.append({
                "id": str(uuid.uuid4()), "order_id": order_id,
                "product_name": item.product_name, "product_sku": item.product_id,
                "quantity": item.quantity, "unit_price": item.price,
                "total_price": item.price * item.quantity,
            })

        if use_supabase:
            supabase.table("orders").insert(order_data).execute()
            for it in items_data:
                supabase.table("order_items").insert(it).execute()
        else:
            order_data["items"] = items_data
            order_data["_storage"] = "mongodb"
            await mongo_db['orders'].insert_one(order_data)

        # Create Mollie payment
        mollie_client = get_mollie_client()
        frontend_url = get_frontend_url()
        api_url = get_api_url()

        payment_data = {
            'amount': {'currency': 'EUR', 'value': f"{req.total_amount:.2f}"},
            'description': f"Droomvriendjes Bestelling #{order_id[:8].upper()}",
            'redirectUrl': f"{frontend_url}/betaling-resultaat/{order_id}",
            'cancelUrl': f"{frontend_url}/checkout",
            'webhookUrl': f"{api_url}/api/webhook/mollie",
            'method': req.payment_method,
            'metadata': {'order_id': order_id},
        }

        mollie_payment = mollie_create_payment_with_retry(mollie_client, payment_data)

        # Update order with payment info
        payment_update = {"mollie_payment_id": mollie_payment.id, "payment_method": req.payment_method}
        if use_supabase and not order_data.get('_storage') == 'mongodb':
            try:
                supabase.table("orders").update(payment_update).eq("id", order_id).execute()
                supabase.table("payments").insert({
                    "id": str(uuid.uuid4()), "order_id": order_id,
                    "mollie_payment_id": mollie_payment.id, "status": "pending",
                    "amount": req.total_amount, "currency": "EUR", "method": req.payment_method,
                }).execute()
            except Exception:
                pass
        if mongo_db is not None:
            await mongo_db['orders'].update_one({"id": order_id}, {"$set": payment_update})

        logger.info(f"Express checkout created: order={order_id}, payment={mollie_payment.id}")
        return {"checkout_url": mollie_payment.checkout_url, "order_id": order_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Express checkout error: {e}")
        err_str = str(e).lower()
        if 'name or service not known' in err_str or 'connection' in err_str:
            raise HTTPException(status_code=503, detail="Betaaldienst tijdelijk niet bereikbaar. Probeer het over een paar seconden opnieuw.")
        raise HTTPException(status_code=500, detail=f"Betaling kon niet worden gestart: {str(e)}")


@router.post("/webhook/mollie")
async def mollie_webhook(request: Request):
    """Handle Mollie webhook notifications (supports both Supabase and MongoDB)"""
    try:
        form_data = await request.form()
        payment_id = form_data.get("id")

        if not payment_id:
            return {"status": "error", "message": "Missing payment ID"}

        logger.info(f"Webhook received for payment: {payment_id}")
        mollie_client = get_mollie_client()
        mollie_payment = mollie_client.payments.get(payment_id)

        status_map = {
            'paid': 'paid', 'pending': 'pending', 'open': 'pending',
            'canceled': 'cancelled', 'expired': 'cancelled', 'failed': 'cancelled',
        }
        new_status = status_map.get(mollie_payment.status, 'pending')

        order_id = None
        order = None
        items = []
        use_supabase = _supabase_available()

        # Try Supabase first
        if use_supabase:
            try:
                result = supabase.table("payments").select("*").eq("mollie_payment_id", payment_id).limit(1).execute()
                if result.data:
                    order_id = result.data[0]["order_id"]
                    supabase.table("payments").update({"status": new_status}).eq("mollie_payment_id", payment_id).execute()
                    supabase.table("orders").update({"status": new_status}).eq("id", order_id).execute()
                    order_res = supabase.table("orders").select("*").eq("id", order_id).limit(1).execute()
                    items_res = supabase.table("order_items").select("*").eq("order_id", order_id).execute()
                    order = order_res.data[0] if order_res.data else None
                    items = items_res.data or []
            except Exception as sb_err:
                logger.warning(f"Supabase webhook update failed, trying MongoDB: {sb_err}")

        # Try MongoDB
        if not order_id and mongo_db is not None:
            mongo_order = await mongo_db['orders'].find_one({"mollie_payment_id": payment_id}, {"_id": 0})
            if mongo_order:
                order_id = mongo_order["id"]
                await mongo_db['orders'].update_one({"id": order_id}, {"$set": {"status": new_status}})
                order = mongo_order
                items = mongo_order.get("items", [])

        if not order_id:
            logger.warning(f"Payment not found in any DB: {payment_id}")
            return {"status": "error", "message": "Payment not found"}

        logger.info(f"Payment {payment_id} status updated to: {new_status}")

        # Send emails on status change
        try:
            if order:
                if new_status == 'paid':
                    _send_order_confirmation(order, items)
                    _send_order_notification(order, items, 'payment_success')
                    if order.get('discount_code'):
                        try:
                            from routes.discount_codes import use_discount_code
                            await use_discount_code({"code": order['discount_code'], "order_id": order_id})
                        except Exception as dc_err:
                            logger.error(f"Failed to increment discount code usage: {dc_err}")
                elif new_status == 'cancelled':
                    _send_order_notification(order, items, 'payment_failed')
        except Exception as email_err:
            logger.error(f"Failed to send payment emails: {email_err}")

        return {"status": "ok"}

    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/orders/{order_id}")
async def get_order(order_id: str):
    """Get order by ID (supports both Supabase and MongoDB)"""
    try:
        use_supabase = _supabase_available()
        order = None
        items = []

        if use_supabase:
            try:
                result = supabase.table("orders").select("*").eq("id", order_id).limit(1).execute()
                if result.data:
                    order = result.data[0]
                    items_result = supabase.table("order_items").select("*").eq("order_id", order_id).execute()
                    items = items_result.data or []
            except Exception:
                pass

        if not order and mongo_db is not None:
            order = await mongo_db['orders'].find_one({"id": order_id}, {"_id": 0})
            if order:
                items = order.get("items", [])

        if not order:
            raise HTTPException(status_code=404, detail="Bestelling niet gevonden")

        return {"order": order, "items": items}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting order: {e}")
        raise HTTPException(status_code=500, detail=str(e))
