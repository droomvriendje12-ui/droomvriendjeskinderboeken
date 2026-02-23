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
from mollie.api.client import Client as MollieClient

logger = logging.getLogger(__name__)

router = APIRouter(tags=["orders"])

# Supabase client - will be set by main app
supabase = None

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
    affiliate_code: Optional[str] = None


class PaymentCreate(BaseModel):
    order_id: str
    payment_method: str = "ideal"


def get_mollie_client():
    """Get configured Mollie client"""
    api_key = os.environ.get('MOLLIE_API_KEY', '')
    if not api_key:
        raise ValueError("MOLLIE_API_KEY not configured")
    client = MollieClient()
    client.set_api_key(api_key)
    return client


def get_frontend_url():
    """Get frontend URL for redirects"""
    return os.environ.get('FRONTEND_URL', 'https://droomvriendjes.nl')


def get_api_url():
    """Get API URL for webhooks"""
    return os.environ.get('API_URL', 'https://droomvriendjes.nl')


@router.post("/orders")
async def create_order(order: OrderCreate):
    """Create a new order in Supabase"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        order_id = str(uuid.uuid4())
        
        # Create order in Supabase
        order_data = {
            "id": order_id,
            "order_number": f"DV-{datetime.now().strftime('%Y%m%d')}-{order_id[:8].upper()}",
            "customer_email": order.customer_email,
            "customer_name": order.customer_name,
            "customer_phone": order.customer_phone or "",
            "shipping_address": order.customer_address,
            "shipping_city": order.customer_city,
            "shipping_zipcode": order.customer_zipcode,
            "customer_notes": order.customer_comment or "",
            "subtotal": order.subtotal or order.total_amount,
            "discount_amount": order.discount or 0,
            "total_amount": order.total_amount,
            "currency": "EUR",
            "status": "pending",
            "discount_code": order.discount_code,
            "affiliate_code": order.affiliate_code,
        }
        
        # Insert order
        result = supabase.table("orders").insert(order_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create order")
        
        # Insert order items
        for item in order.items:
            item_data = {
                "id": str(uuid.uuid4()),
                "order_id": order_id,
                "product_name": item.product_name,
                "product_sku": item.product_id,
                "quantity": item.quantity,
                "unit_price": item.price,
                "total_price": item.price * item.quantity,
            }
            supabase.table("order_items").insert(item_data).execute()
        
        logger.info(f"Order created in Supabase: {order_id}")
        return {"order_id": order_id, "status": "pending"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating order: {e}")
        raise HTTPException(status_code=500, detail=f"Order creation failed: {str(e)}")


@router.post("/payments/create")
async def create_payment(payment: PaymentCreate):
    """Create a Mollie payment for an order"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        # Get order from Supabase
        result = supabase.table("orders").select("*").eq("id", payment.order_id).limit(1).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Order not found")
        
        order = result.data[0]
        
        # Initialize Mollie client
        mollie_client = get_mollie_client()
        
        # Build URLs
        frontend_url = get_frontend_url()
        api_url = get_api_url()
        redirect_url = f"{frontend_url}/betaling-resultaat/{payment.order_id}"
        webhook_url = f"{api_url}/api/webhook/mollie"
        cancel_url = f"{frontend_url}/checkout"
        
        logger.info(f"Creating payment for order {payment.order_id}")
        logger.info(f"Redirect URL: {redirect_url}")
        logger.info(f"Webhook URL: {webhook_url}")
        
        # Base payment data
        payment_data = {
            'amount': {
                'currency': 'EUR',
                'value': f"{order['total_amount']:.2f}"
            },
            'description': f"Droomvriendjes Bestelling #{payment.order_id[:8].upper()}",
            'redirectUrl': redirect_url,
            'cancelUrl': cancel_url,
            'webhookUrl': webhook_url,
            'method': payment.payment_method,
            'metadata': {
                'order_id': payment.order_id,
                'customer_email': order['customer_email']
            }
        }
        
        # Add billing address for Klarna/iDEAL in3
        if payment.payment_method in ['klarna', 'klarnapaylater', 'klarnasliceit', 'in3', 'ideal_in3']:
            name_parts = order.get('customer_name', '').split(' ', 1)
            given_name = name_parts[0] if name_parts else ''
            family_name = name_parts[1] if len(name_parts) > 1 else name_parts[0]
            
            payment_data['billingAddress'] = {
                'givenName': given_name,
                'familyName': family_name,
                'email': order.get('customer_email', ''),
                'streetAndNumber': order.get('shipping_address', ''),
                'postalCode': order.get('shipping_zipcode', ''),
                'city': order.get('shipping_city', ''),
                'country': 'NL'
            }
            payment_data['shippingAddress'] = payment_data['billingAddress'].copy()
        
        # Create Mollie payment
        mollie_payment = mollie_client.payments.create(payment_data)
        
        # Update order with payment info
        supabase.table("orders").update({
            "mollie_payment_id": mollie_payment.id,
            "payment_method": payment.payment_method,
        }).eq("id", payment.order_id).execute()
        
        # Create payment record
        payment_record = {
            "id": str(uuid.uuid4()),
            "order_id": payment.order_id,
            "mollie_payment_id": mollie_payment.id,
            "status": "pending",
            "amount": order['total_amount'],
            "currency": "EUR",
            "method": payment.payment_method,
        }
        supabase.table("payments").insert(payment_record).execute()
        
        logger.info(f"Payment created: {mollie_payment.id}")
        
        return {
            "payment_id": mollie_payment.id,
            "checkout_url": mollie_payment.checkout_url,
            "status": mollie_payment.status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Payment creation error: {e}")
        raise HTTPException(status_code=500, detail=f"Payment creation failed: {str(e)}")


@router.post("/webhook/mollie")
async def mollie_webhook(request: Request):
    """Handle Mollie webhook notifications"""
    if supabase is None:
        return {"status": "error", "message": "Database not configured"}
    
    try:
        form_data = await request.form()
        payment_id = form_data.get("id")
        
        if not payment_id:
            logger.warning("Webhook received without payment ID")
            return {"status": "error", "message": "Missing payment ID"}
        
        logger.info(f"Webhook received for payment: {payment_id}")
        
        # Get Mollie payment status
        mollie_client = get_mollie_client()
        mollie_payment = mollie_client.payments.get(payment_id)
        
        # Find payment record in Supabase
        result = supabase.table("payments").select("*").eq("mollie_payment_id", payment_id).limit(1).execute()
        
        if not result.data:
            logger.warning(f"Payment not found: {payment_id}")
            return {"status": "error", "message": "Payment not found"}
        
        db_payment = result.data[0]
        order_id = db_payment["order_id"]
        
        # Map Mollie status to order status
        status_map = {
            'paid': 'paid',
            'pending': 'pending',
            'open': 'pending',
            'canceled': 'cancelled',
            'expired': 'cancelled',
            'failed': 'cancelled',
        }
        
        new_status = status_map.get(mollie_payment.status, 'pending')
        
        # Update payment status
        supabase.table("payments").update({
            "status": new_status,
        }).eq("mollie_payment_id", payment_id).execute()
        
        # Update order status
        supabase.table("orders").update({
            "status": new_status,
        }).eq("id", order_id).execute()
        
        logger.info(f"Payment {payment_id} status updated to: {new_status}")
        
        return {"status": "ok"}
        
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/orders/{order_id}")
async def get_order(order_id: str):
    """Get order by ID"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        result = supabase.table("orders").select("*").eq("id", order_id).limit(1).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Order not found")
        
        order = result.data[0]
        
        # Get order items
        items_result = supabase.table("order_items").select("*").eq("order_id", order_id).execute()
        order['items'] = items_result.data or []
        
        # Format response
        return {
            "id": order.get("id"),
            "order_number": order.get("order_number"),
            "customer_email": order.get("customer_email"),
            "customer_name": order.get("customer_name"),
            "total_amount": order.get("total_amount"),
            "status": order.get("status"),
            "mollie_payment_id": order.get("mollie_payment_id"),
            "items": order.get("items", []),
            "created_at": order.get("created_at"),
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting order: {e}")
        raise HTTPException(status_code=500, detail=str(e))
