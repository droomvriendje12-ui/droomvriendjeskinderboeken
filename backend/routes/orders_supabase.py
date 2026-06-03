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


def _send_digital_downloads_email(order_data: dict, entitlements: list, crosssell_code: Optional[str] = None):
    """Stuur een aparte mail met directe download links voor digitale producten.

    Wanneer `crosssell_code` is meegegeven wordt er onderaan de mail een
    "10% korting op je eerste knuffel"-blok getoond. Dit verbindt de digital
    funnel (PDF lezer) met de fysieke knuffel-verkoop.
    """
    customer_email = order_data.get('customer_email')
    if not customer_email or not entitlements:
        return False
    customer_name = order_data.get('customer_name', 'Klant')
    order_number = order_data.get('order_number', order_data.get('id', '')[:8].upper())

    frontend_url = os.environ.get('FRONTEND_URL', 'https://droomvriendjes.com').rstrip('/')

    rows = ""
    for ent in entitlements:
        link = f"{frontend_url}/mijn-download/{ent['token']}"
        rows += f"""
        <tr>
            <td style="padding:14px;border-bottom:1px solid #f1ede8;">
                <strong style="color:#44403c;">{ent.get('product_name','PDF Download')}</strong><br>
                <span style="color:#78716c;font-size:13px;">Geldig 24 uur · max {ent.get('max_downloads',3)} downloads</span>
            </td>
            <td style="padding:14px;border-bottom:1px solid #f1ede8;text-align:right;">
                <a href="{link}" style="background:#f59e0b;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;display:inline-block;">Download PDF</a>
            </td>
        </tr>"""

    crosssell_block = ""
    if crosssell_code:
        crosssell_block = f"""
        <div style="background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%);border-radius:14px;padding:24px;margin:24px 0;text-align:center;border:2px dashed #f59e0b;">
            <p style="color:#78350f;margin:0 0 6px;font-size:13px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Cadeau van Droomvriendjes</p>
            <h3 style="color:#92400e;margin:0 0 8px;font-size:22px;">10% korting op je eerste knuffel</h3>
            <p style="color:#78350f;margin:0 0 16px;font-size:14px;line-height:1.5;">Een knuffel maakt het slaapritueel uit deze PDF nóg krachtiger. Gebruik onderstaande code bij je eerste knuffel-bestelling — eenmalig geldig, 30 dagen lang.</p>
            <div style="background:#fff;display:inline-block;padding:14px 28px;border-radius:10px;font-family:Courier,monospace;font-size:22px;font-weight:700;letter-spacing:3px;color:#92400e;border:2px solid #f59e0b;">{crosssell_code}</div>
            <p style="margin:14px 0 0;"><a href="{frontend_url}/knuffels" style="background:#f59e0b;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;display:inline-block;">Bekijk de knuffels →</a></p>
        </div>"""

    html = f"""<!DOCTYPE html><html><head><meta charset="utf-8"></head>
    <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#fafaf9;">
    <div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 10px rgba(0,0,0,0.05);">
        <div style="text-align:center;margin-bottom:24px;">
            <h1 style="color:#f59e0b;margin:0;letter-spacing:0.5px;">DROOMVRIENDJES</h1>
            <p style="color:#78716c;margin:6px 0 0;font-size:13px;">Jouw digitale download is klaar</p>
        </div>
        <h2 style="color:#44403c;font-size:20px;">Bedankt {customer_name}!</h2>
        <p style="color:#57534e;line-height:1.6;">Hieronder vind je je downloads voor bestelling <strong>#{order_number}</strong>.
        Klik op de knop om direct te downloaden. De links zijn 24 uur geldig.</p>
        <table style="width:100%;border-collapse:collapse;margin:24px 0;background:#fffdf7;border-radius:10px;overflow:hidden;">
            {rows}
        </table>
        <div style="background:#fef3c7;border-radius:10px;padding:14px 18px;color:#78350f;font-size:13px;">
            <strong>Tip:</strong> Sla het bestand direct op je apparaat op. Je kunt het maximaal 3x downloaden binnen 24 uur.
        </div>
        {crosssell_block}
        <div style="border-top:1px solid #f1ede8;margin-top:28px;padding-top:18px;text-align:center;color:#a8a29e;font-size:12px;">
            <p>Vragen? Mail naar <a href="mailto:info@droomvriendjes.com" style="color:#f59e0b;">info@droomvriendjes.com</a></p>
        </div>
    </div></body></html>"""
    text_parts = [f"Bedankt {customer_name}! Je downloads voor bestelling #{order_number}: "]
    text_parts.append(" | ".join(
        [f"{e.get('product_name')}: {frontend_url}/mijn-download/{e['token']}" for e in entitlements]
    ))
    if crosssell_code:
        text_parts.append(f"\n\nCadeau: 10% korting op je eerste knuffel. Code: {crosssell_code} (eenmalig geldig, 30 dagen).")
    return _send_email(customer_email, f"Jouw downloads - bestelling #{order_number}", html, "".join(text_parts))


def _create_crosssell_discount_code(customer_email: str, order_id: str) -> Optional[str]:
    """Genereer een eenmalige 10% kortingscode voor de fysieke knuffel-shop.
    
    Wordt aangeroepen na een succesvolle digital-only of mixed order. Code:
      - Prefix `BEDANKT-` + 6-char hash van order_id
      - 10% korting, max_uses=1, 30 dagen geldig
      - min_order_amount=0 (werkt op elke knuffel)
    Returns None als generatie faalt.
    """
    if supabase is None:
        return None
    try:
        import hashlib
        from datetime import timedelta
        suffix = hashlib.sha256(f"{order_id}-{customer_email}".encode()).hexdigest()[:6].upper()
        code = f"BEDANKT{suffix}"
        # Idempotency: als deze code al bestaat, hergebruik 'm
        existing = supabase.table("discount_codes").select("code").eq("code", code).limit(1).execute()
        if existing.data:
            logger.info(f"Cross-sell code {code} already exists, reusing")
            return code
        row = {
            "id": str(uuid.uuid4())[:8].upper(),
            "code": code,
            "discount_type": "percentage",
            "discount_value": 10.0,
            "min_order_amount": 0,
            "max_uses": 1,
            "current_uses": 0,
            "active": True,
            "free_shipping": False,
            "description": f"Cross-sell: 10% op eerste knuffel (digital order {order_id[:8]})",
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        supabase.table("discount_codes").insert(row).execute()
        logger.info(f"✨ Cross-sell code {code} aangemaakt voor {customer_email} (order {order_id})")
        return code
    except Exception as e:
        logger.error(f"Cross-sell code generation failed: {e}")
        return None


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

        logger.info(
            f"Express checkout created: order={order_id}, payment={mollie_payment.id}, "
            f"method={req.payment_method} — klant-/adresgegevens worden na betaling "
            f"verrijkt vanuit Mollie (PayPal)."
        )
        return {"checkout_url": mollie_payment.checkout_url, "order_id": order_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Express checkout error: {e}")
        err_str = str(e).lower()
        if 'name or service not known' in err_str or 'connection' in err_str:
            raise HTTPException(status_code=503, detail="Betaaldienst tijdelijk niet bereikbaar. Probeer het over een paar seconden opnieuw.")
        raise HTTPException(status_code=500, detail=f"Betaling kon niet worden gestart: {str(e)}")


async def _alert(source, message, detail=None, level="error", meta=None):
    """Log a human-readable system alert (best-effort, never raises)."""
    try:
        from routes.system_alerts import log_alert
        await log_alert(source, message, detail=detail, level=level, meta=meta)
    except Exception as exc:
        logger.warning(f"Kon system alert niet loggen: {exc}")


# ───────────────────────────────────────────────────────────────────────────
# FASE 1 — Mollie/PayPal express checkout: klant- en adresgegevens teruglezen
# ───────────────────────────────────────────────────────────────────────────
# Bij een express-betaling (PayPal) maken we de order met placeholder-data aan;
# de echte klantnaam, e-mail en het verzendadres komen pas ná betaling van Mollie
# terug in `payment.details`. Onderstaande helpers lezen die data terug en vullen
# de order aan, zodat fysieke verzending mogelijk wordt (NL + BE).

EXPRESS_PLACEHOLDER_EMAIL = "express@pending.nl"
EXPRESS_PLACEHOLDER_NAME = "Express Checkout"


def _is_digital_item(item: dict) -> bool:
    sku = str(item.get("product_sku") or item.get("product_id") or "")
    return sku.startswith("digital-") or item.get("product_type") == "digital"


def _has_physical_items(items: list) -> bool:
    return any(not _is_digital_item(i) for i in (items or []))


def _order_missing_customer_data(order: dict) -> bool:
    """True wanneer de order nog express-placeholder / lege fulfilment-data heeft."""
    email = (order.get("customer_email") or "").strip().lower()
    name = (order.get("customer_name") or "").strip()
    addr = (order.get("shipping_address") or "").strip()
    return (
        email == EXPRESS_PLACEHOLDER_EMAIL
        or not email
        or name == EXPRESS_PLACEHOLDER_NAME
        or not addr
    )


def _extract_mollie_customer_details(mollie_payment) -> dict:
    """Lees klantnaam, e-mail en verzendadres uit een Mollie betaling.

    Werkt voornamelijk voor PayPal (payment.details.shippingAddress + consumerName
    + consumerAccount). Retourneert alleen de gevonden velden; ontbrekende velden
    worden weggelaten. Gooit nooit een exception.
    """
    out: dict = {}
    try:
        details = getattr(mollie_payment, "details", None)
        if not details:
            return out
        if not isinstance(details, dict):
            try:
                details = dict(details)
            except Exception:
                return out

        shipping = details.get("shippingAddress")
        shipping = shipping if isinstance(shipping, dict) else {}

        # Klantnaam: consumerName, anders uit shippingAddress
        name = details.get("consumerName")
        if not name and shipping:
            name = (
                shipping.get("recipient")
                or shipping.get("name")
                or " ".join(
                    p for p in [shipping.get("givenName"), shipping.get("familyName")] if p
                ).strip()
                or None
            )
        if name and str(name).strip():
            out["customer_name"] = str(name).strip()

        # E-mail: PayPal consumerAccount is het account-e-mailadres
        email = (
            details.get("consumerAccount")
            or details.get("consumerEmail")
            or details.get("email")
        )
        if email and "@" in str(email):
            out["customer_email"] = str(email).strip()

        # Verzendadres
        if shipping:
            street = shipping.get("streetAndNumber") or shipping.get("address")
            if street and str(street).strip():
                out["shipping_address"] = str(street).strip()
            if shipping.get("postalCode"):
                out["shipping_zipcode"] = str(shipping.get("postalCode")).strip()
            if shipping.get("city"):
                out["shipping_city"] = str(shipping.get("city")).strip()
            if shipping.get("country"):
                out["shipping_country"] = str(shipping.get("country")).strip().upper()
    except Exception as e:
        logger.warning(f"Kon Mollie payment.details niet uitlezen: {e}")
    return out


async def _enrich_order_from_mollie(order: dict, mollie_payment, source: str = "webhook") -> dict:
    """Vul ontbrekende klant-/adresgegevens van een (express) order aan met de data
    die Mollie na betaling teruggeeft. Idempotent: overschrijft uitsluitend
    placeholder/lege velden. Retourneert de (mogelijk) bijgewerkte order-dict.
    """
    if not _order_missing_customer_data(order):
        return order  # heeft al echte data → niets te doen

    raw_details = getattr(mollie_payment, "details", None)
    details_keys = (
        list(raw_details.keys()) if isinstance(raw_details, dict) else type(raw_details).__name__
    )
    extracted = _extract_mollie_customer_details(mollie_payment)
    masked = {k: ("***" if k == "customer_email" else v) for k, v in extracted.items()}
    logger.info(
        f"[Mollie enrich/{source}] order={order.get('id')} "
        f"method={getattr(mollie_payment, 'method', None)} "
        f"payment={getattr(mollie_payment, 'id', None)} "
        f"status={getattr(mollie_payment, 'status', None)} "
        f"details_keys={details_keys} extracted={masked}"
    )

    # Bepaal welke velden we daadwerkelijk bijwerken (alleen placeholders/leeg)
    update: dict = {}
    email = (order.get("customer_email") or "").strip().lower()
    if extracted.get("customer_email") and (email == EXPRESS_PLACEHOLDER_EMAIL or not email):
        update["customer_email"] = extracted["customer_email"]
    name = (order.get("customer_name") or "").strip()
    if extracted.get("customer_name") and name in ("", EXPRESS_PLACEHOLDER_NAME):
        update["customer_name"] = extracted["customer_name"]
    if extracted.get("shipping_address") and not (order.get("shipping_address") or "").strip():
        update["shipping_address"] = extracted["shipping_address"]
    if extracted.get("shipping_zipcode") and not (order.get("shipping_zipcode") or "").strip():
        update["shipping_zipcode"] = extracted["shipping_zipcode"]
    if extracted.get("shipping_city") and not (order.get("shipping_city") or "").strip():
        update["shipping_city"] = extracted["shipping_city"]
    if extracted.get("shipping_country") and not (order.get("shipping_country") or "").strip():
        update["shipping_country"] = extracted["shipping_country"]

    if not update:
        logger.info(
            f"[Mollie enrich/{source}] order={order.get('id')} — geen velden bijgewerkt "
            f"(Mollie leverde geen bruikbare klant-/adresdata; methode "
            f"{getattr(mollie_payment, 'method', None)} geeft vaak geen verzendadres)"
        )
        return order

    order_id = order.get("id")
    is_mongo = order.get("_storage") == "mongodb"
    try:
        if not is_mongo and supabase is not None:
            supabase.table("orders").update(update).eq("id", order_id).execute()
        if mongo_db is not None:
            await mongo_db["orders"].update_one({"id": order_id}, {"$set": update})
        order.update(update)
        logger.info(
            f"[Mollie enrich/{source}] order={order_id} bijgewerkt met velden: "
            f"{list(update.keys())}"
        )
    except Exception as e:
        logger.error(f"[Mollie enrich/{source}] DB-update faalde voor order {order_id}: {e}")
    return order


@router.post("/webhook/mollie")
async def mollie_webhook(request: Request):
    """Handle Mollie webhook notifications (supports both Supabase and MongoDB)"""
    try:
        form_data = await request.form()
        payment_id = form_data.get("id")

        if not payment_id:
            await _alert(
                "payment_webhook",
                "Mollie webhook ontvangen zonder payment ID — mogelijk een corrupte of incomplete payload.",
                level="warning",
            )
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
            await _alert(
                "payment_webhook",
                f"Betaling {payment_id} kwam binnen via Mollie, maar de bijbehorende bestelling werd niet gevonden in de database. Controleer of deze order correct is aangemaakt.",
                detail=f"payment_id={payment_id}, status={new_status}",
                level="error",
                meta={"payment_id": payment_id},
            )
            return {"status": "error", "message": "Payment not found"}

        logger.info(f"Payment {payment_id} status updated to: {new_status}")

        # Send emails on status change
        try:
            if order:
                if new_status == 'paid':
                    # FASE 1 FIX: verrijk een (express/PayPal) order met de klant- en
                    # adresgegevens die Mollie na betaling teruggeeft, VOORDAT we de
                    # bevestigingsmail sturen (anders gaat die naar express@pending.nl
                    # en mist fulfilment het verzendadres).
                    order = await _enrich_order_from_mollie(order, mollie_payment, source="webhook")
                    if _has_physical_items(items) and _order_missing_customer_data(order):
                        await _alert(
                            "payment_webhook",
                            f"Betaalde express-bestelling {order_id} mist nog verzendgegevens "
                            f"(Mollie gaf geen adres terug). Benader de klant of gebruik "
                            f"'Synchroniseer met Mollie' in het bestellingen-overzicht.",
                            detail=f"payment_id={payment_id}, method={getattr(mollie_payment, 'method', None)}",
                            level="error",
                            meta={"order_id": order_id, "payment_id": payment_id},
                        )
                    _send_order_confirmation(order, items)
                    _send_order_notification(order, items, 'payment_success')
                    # FASE 2: start generatie van een gepersonaliseerd kinderboek
                    # zodra de bijbehorende betaling binnen is (productie-pad).
                    try:
                        from routes.kids_book import maybe_start_book_generation
                        await maybe_start_book_generation(order_id)
                    except Exception as kb_err:
                        logger.warning(f"Kon kinderboek-generatie niet starten: {kb_err}")
                    # Digital products: maak entitlements + stuur download mail
                    try:
                        from routes.digital_products import create_entitlements_for_order
                        ents = create_entitlements_for_order(
                            order_id=order_id,
                            items=items,
                            customer_email=order.get('customer_email', ''),
                        )
                        if ents:
                            # Cross-sell: alleen ALS de bestelling fysieke knuffels nog mist.
                            # Klant heeft net een PDF gekocht → 10% korting op eerste knuffel.
                            has_physical = any(
                                not (item.get('product_id', '').startswith('digital-')
                                     or item.get('product_type') == 'digital')
                                for item in (items or [])
                            )
                            crosssell_code = None
                            if not has_physical:
                                crosssell_code = _create_crosssell_discount_code(
                                    customer_email=order.get('customer_email', ''),
                                    order_id=order_id,
                                )
                            _send_digital_downloads_email(order, ents, crosssell_code=crosssell_code)
                            logger.info(f"Aangemaakt: {len(ents)} digital entitlement(s) voor order {order_id} (cross-sell: {crosssell_code or 'no'})")
                    except Exception as dig_err:
                        logger.error(f"Digital entitlement creatie faalde: {dig_err}")
                        await _alert(
                            "digital_delivery",
                            f"Het klaarzetten van de digitale download(s) voor bestelling {order_id} is mislukt. De klant heeft mogelijk geen downloadlink ontvangen.",
                            detail=str(dig_err),
                            level="error",
                            meta={"order_id": order_id},
                        )
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
            await _alert(
                "order_email",
                f"Het versturen van de order-e-mail(s) voor bestelling {order_id} is mislukt.",
                detail=str(email_err),
                level="warning",
                meta={"order_id": order_id},
            )

        return {"status": "ok"}

    except Exception as e:
        logger.error(f"Webhook error: {e}")
        await _alert(
            "payment_webhook",
            "Er ging iets mis bij het verwerken van een Mollie betaal-webhook. Een bestelling is mogelijk niet correct bijgewerkt.",
            detail=str(e),
            level="error",
        )
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

        # FASE 1 FIX (vangnet): heeft een (express) order nog placeholder-data én een
        # Mollie-betaling, haal dan de klant-/adresgegevens alsnog bij Mollie op. Dit
        # werkt ook wanneer de webhook door timing/netwerk gemist is en laat de
        # bedankpagina direct het juiste adres/e-mail tonen.
        if order.get("mollie_payment_id") and _order_missing_customer_data(order):
            try:
                _mc = get_mollie_client()
                _mp = _mc.payments.get(order["mollie_payment_id"])
                order = await _enrich_order_from_mollie(order, _mp, source="order_fetch")
            except Exception as _e:
                logger.warning(f"[order_fetch] Mollie-verrijking faalde voor {order_id}: {_e}")

        return {"order": order, "items": items}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting order: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/orders/{order_id}/resync-mollie")
async def resync_order_from_mollie(order_id: str):
    """Admin-tool: haal klant-/adresgegevens opnieuw bij Mollie op en vul de order aan.

    Repareert (express) bestellingen waar de webhook de gegevens nog niet had
    teruggelezen (bijv. de bestaande orders met express@pending.nl) en dient
    tegelijk als debug-tool om te zien wat Mollie precies teruggeeft.
    """
    use_supabase = _supabase_available()
    order = None

    if use_supabase:
        try:
            res = supabase.table("orders").select("*").eq("id", order_id).limit(1).execute()
            if res.data:
                order = res.data[0]
        except Exception as e:
            logger.warning(f"[resync] Supabase lookup faalde: {e}")

    if not order and mongo_db is not None:
        order = await mongo_db["orders"].find_one({"id": order_id}, {"_id": 0})
        if order:
            order["_storage"] = "mongodb"

    if not order:
        raise HTTPException(status_code=404, detail="Bestelling niet gevonden")

    payment_id = order.get("mollie_payment_id")
    if not payment_id:
        raise HTTPException(
            status_code=400,
            detail="Deze bestelling heeft geen Mollie-betaling om mee te synchroniseren.",
        )

    try:
        mc = get_mollie_client()
        mp = mc.payments.get(payment_id)
    except Exception as e:
        logger.error(f"[resync] Mollie niet bereikbaar voor {payment_id}: {e}")
        raise HTTPException(status_code=502, detail=f"Mollie niet bereikbaar: {e}")

    was_missing = _order_missing_customer_data(order)
    extracted = _extract_mollie_customer_details(mp)
    order = await _enrich_order_from_mollie(order, mp, source="admin_resync")

    masked_found = {k: ("***" if k == "customer_email" else v) for k, v in extracted.items()}
    return {
        "ok": True,
        "order_id": order_id,
        "mollie_status": getattr(mp, "status", None),
        "mollie_method": getattr(mp, "method", None),
        "mollie_details_found": masked_found,
        "was_missing": was_missing,
        "still_missing": _order_missing_customer_data(order),
        "order": {
            "customer_name": order.get("customer_name"),
            "customer_email": order.get("customer_email"),
            "shipping_address": order.get("shipping_address"),
            "shipping_zipcode": order.get("shipping_zipcode"),
            "shipping_city": order.get("shipping_city"),
            "shipping_country": order.get("shipping_country"),
        },
    }
