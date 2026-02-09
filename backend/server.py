from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from mollie.api.client import Client as MollieClient
from bson import ObjectId
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import httpx
import base64

# Configure logging FIRST (before any usage)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent

# Load .env file - this should work for both local dev and production
# In production, Kubernetes environment variables take precedence
env_path = ROOT_DIR / '.env'
if env_path.exists():
    # Use override=False so Kubernetes env vars take precedence in production
    load_dotenv(env_path, override=False)
    logger.info(f"Loaded environment from: {env_path}")
else:
    logger.warning(f"No .env file found at {env_path}, using system environment variables only")

# MongoDB connection - Support both local and Atlas MongoDB
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'droomvriendje')

# Initialize MongoDB client with SSL certificate handling for Atlas
try:
    import certifi
    # Use certifi for proper SSL certificate verification
    client = AsyncIOMotorClient(
        mongo_url,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=10000
    )
    db = client[db_name]
    logger.info(f"MongoDB connected to: {db_name}")
except ImportError:
    # Fallback without certifi
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    logger.info(f"MongoDB connected to: {db_name} (without certifi)")
except Exception as e:
    logger.error(f"MongoDB connection error: {e}")
    raise

# Mollie configuration - read fresh from environment each time
# This ensures Kubernetes environment variables are always used

def get_mollie_api_key():
    """Get Mollie API key fresh from environment - handles Kubernetes env vars"""
    api_key = os.environ.get('MOLLIE_API_KEY', '').strip()
    if not api_key:
        logger.error("❌ MOLLIE_API_KEY not configured or empty!")
        return None
    # Validate key format
    if not (api_key.startswith('live_') or api_key.startswith('test_')):
        logger.error(f"❌ Invalid Mollie API key format. Key should start with 'live_' or 'test_'. Got: {api_key[:10]}...")
        return None
    return api_key

def get_mollie_profile_id():
    """Get Mollie Profile ID fresh from environment"""
    return os.environ.get('MOLLIE_PROFILE_ID', '').strip()

def get_mollie_client():
    """Create a new Mollie client with API key from environment"""
    api_key = get_mollie_api_key()
    if not api_key:
        raise ValueError("MOLLIE_API_KEY not configured - add it to environment variables")
    mollie_client = MollieClient()
    mollie_client.set_api_key(api_key)
    logger.info(f"Mollie client created with key: {api_key[:15]}... (length: {len(api_key)})")
    return mollie_client

# Log Mollie configuration at startup for debugging
_startup_mollie_key = get_mollie_api_key()
if _startup_mollie_key:
    logger.info(f"✅ Mollie API key available at startup: {_startup_mollie_key[:20]}... (length: {len(_startup_mollie_key)})")
else:
    logger.warning("⚠️ MOLLIE_API_KEY not set at startup - will check again when needed")

# URL configuration - load from environment for production support
def get_frontend_url():
    """Get frontend URL from environment"""
    return os.environ.get('FRONTEND_URL', 'https://droomvriendjes.nl')

def get_api_url():
    """Get API URL from environment"""
    return os.environ.get('API_URL', 'https://droomvriendjes.nl')

FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://droomvriendjes.nl')
API_URL = os.environ.get('API_URL', 'https://droomvriendjes.nl')

# Sendcloud API configuration
SENDCLOUD_PUBLIC_KEY = os.environ.get('SENDCLOUD_PUBLIC_KEY', '')
SENDCLOUD_SECRET_KEY = os.environ.get('SENDCLOUD_SECRET_KEY', '')
SENDCLOUD_API_URL = "https://panel.sendcloud.sc/api/v2"

if SENDCLOUD_PUBLIC_KEY:
    logger.info(f"✅ Sendcloud API configured: {SENDCLOUD_PUBLIC_KEY[:15]}...")
else:
    logger.warning("⚠️ Sendcloud API keys not configured")

# SMTP Email configuration
SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.transip.email')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 465))
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
SMTP_FROM = os.environ.get('SMTP_FROM', 'info@droomvriendjes.nl')

# Owner notification email
OWNER_EMAIL = "info@droomvriendjes.nl"

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Import and setup modular routes
from routes import products as products_route
from routes import discount_codes as discount_codes_route
from routes import reviews as reviews_route
from routes import uploads as uploads_route

# Set database for routes
products_route.set_database(db)
discount_codes_route.set_database(db)
reviews_route.set_database(db)
uploads_route.set_database(db)

# Include modular routers
api_router.include_router(products_route.router)
api_router.include_router(discount_codes_route.router)
api_router.include_router(reviews_route.router)
api_router.include_router(uploads_route.router)

# ============== GOOGLE SHOPPING FEED CONSTANTS ==============
SHOP_URL = os.environ.get('SHOP_URL', 'https://droomvriendjes.nl')
MERCHANT_CENTER_ID = os.environ.get('GOOGLE_MERCHANT_CENTER_ID', '5713316340')

# Product data for Google Shopping Feed
PRODUCTS_DATA = [
    {
        "id": "KNUF_001",
        "title": "Baby Slaapmaatje Leeuw - Projector Nachtlamp met White Noise",
        "description": "Projector nachtlamp met rustgevende geluiden. Perfect voor een betere nachtrust.",
        "link": "/product/1",
        "image_link": "https://i.imgur.com/E4g3eOy.jpeg",
        "additional_image_links": ["https://i.imgur.com/zYLuTAg.jpeg", "https://i.imgur.com/WfHQKKr.jpeg"],
        "availability": "in_stock",
        "price": "49.95 EUR",
        "brand": "Droomvriendjes",
        "condition": "new",
        "google_product_category": "588 > 4186",
        "product_type": "Knuffels > Slaapknuffels > Wilde Dieren",
        "identifier_exists": "no",
        "age_group": "infant",
        "color": "Geel/Bruin",
        "material": "Pluche",
        "shipping_weight": "0.5 kg"
    },
    {
        "id": "KNUF_002",
        "title": "Baby Nachtlamp Schaap - Slaapknuffel met Sterrenprojector",
        "description": "Slaapknuffel met projector en white noise. Helpt je kind tot rust te komen.",
        "link": "/product/2",
        "image_link": "https://i.imgur.com/vYpeb4c.jpeg",
        "additional_image_links": ["https://i.imgur.com/62h7jyd.jpeg", "https://i.imgur.com/JxKouOL.jpeg"],
        "availability": "in_stock",
        "price": "59.95 EUR",
        "brand": "Droomvriendjes",
        "condition": "new",
        "google_product_category": "588 > 4186",
        "product_type": "Knuffels > Slaapknuffels > Boerderijdieren",
        "identifier_exists": "no",
        "age_group": "infant",
        "color": "Wit/Crème",
        "material": "Pluche",
        "shipping_weight": "0.5 kg"
    },
    {
        "id": "KNUF_003",
        "title": "Teddy Projector Knuffel - Bruine Beer met Nachtlicht",
        "description": "Bruine teddy met nachtlicht en rustgevende geluiden. Voor een rustige nachtrust.",
        "link": "/product/3",
        "image_link": "https://i.imgur.com/jM6J4oV.jpeg",
        "additional_image_links": ["https://i.imgur.com/bMpTi4F.jpeg", "https://i.imgur.com/LuZnyJN.jpeg"],
        "availability": "in_stock",
        "price": "59.95 EUR",
        "brand": "Droomvriendjes",
        "condition": "new",
        "google_product_category": "588 > 4186",
        "product_type": "Knuffels > Slaapknuffels > Beren",
        "identifier_exists": "no",
        "age_group": "infant",
        "color": "Bruin",
        "material": "Pluche",
        "shipping_weight": "0.5 kg"
    },
    {
        "id": "KNUF_004",
        "title": "Pinguïn Nachtlampje - Slaapknuffel met Projectie",
        "description": "Schattige pinguïn met sterrenprojector en rustgevende geluiden.",
        "link": "/product/4",
        "image_link": "https://i.imgur.com/sYVb8K4.jpeg",
        "additional_image_links": ["https://i.imgur.com/RqYk1oe.jpeg"],
        "availability": "in_stock",
        "price": "59.95 EUR",
        "brand": "Droomvriendjes",
        "condition": "new",
        "google_product_category": "588 > 4186",
        "product_type": "Knuffels > Slaapknuffels > Pooldieren",
        "identifier_exists": "no",
        "age_group": "infant",
        "color": "Blauw/Wit",
        "material": "Pluche",
        "shipping_weight": "0.5 kg"
    },
    {
        "id": "KNUF_005",
        "title": "Dinosaurus Slaapknuffel - Stoere Dino met Nachtlamp",
        "description": "Stoere dinosaurus met nachtlamp en white noise. Perfect voor avonturiers!",
        "link": "/product/5",
        "image_link": "https://i.imgur.com/z4cyllw.jpeg",
        "additional_image_links": ["https://i.imgur.com/mWJSBxI.jpeg"],
        "availability": "in_stock",
        "price": "59.95 EUR",
        "brand": "Droomvriendjes",
        "condition": "new",
        "google_product_category": "588 > 4186",
        "product_type": "Knuffels > Slaapknuffels > Fantasiedieren",
        "identifier_exists": "no",
        "age_group": "infant",
        "color": "Groen",
        "material": "Pluche",
        "shipping_weight": "0.5 kg"
    },
    {
        "id": "KNUF_006",
        "title": "Slaapknuffel Duo Schaap & Teddy - Voordeelset",
        "description": "Twee schattige slaapknuffels met nachtlampjes. Perfect voor broertjes en zusjes!",
        "link": "/product/6",
        "image_link": "https://i.imgur.com/4blLAM7.jpeg",
        "additional_image_links": ["https://i.imgur.com/1JbBGgT.jpeg"],
        "availability": "in_stock",
        "price": "89.95 EUR",
        "brand": "Droomvriendjes",
        "condition": "new",
        "google_product_category": "588 > 4186",
        "product_type": "Knuffels > Voordeelsets > Duo Sets",
        "identifier_exists": "no",
        "age_group": "infant",
        "color": "Wit/Bruin",
        "material": "Pluche",
        "shipping_weight": "1.0 kg"
    },
    {
        "id": "KNUF_007",
        "title": "Beer Sterrenprojector Nachtlamp - Slaapknuffel",
        "description": "Schattige beer met sterrenprojector en rustgevende slaapgeluiden.",
        "link": "/product/7",
        "image_link": "https://i.imgur.com/q2c7zsP.jpeg",
        "additional_image_links": ["https://i.imgur.com/xyXHy7f.jpeg"],
        "availability": "in_stock",
        "price": "59.95 EUR",
        "brand": "Droomvriendjes",
        "condition": "new",
        "google_product_category": "588 > 4186",
        "product_type": "Knuffels > Slaapknuffels > Beren",
        "identifier_exists": "no",
        "age_group": "infant",
        "color": "Beige",
        "material": "Pluche",
        "shipping_weight": "0.4 kg"
    },
    {
        "id": "KNUF_008",
        "title": "Schaap Knuffel Nachtlampje - Liggend Schaapje",
        "description": "Liggend schaapje met kalmerend licht en rustgevende geluiden. Super zacht!",
        "link": "/product/8",
        "image_link": "https://i.imgur.com/8mKVYOY.jpeg",
        "additional_image_links": ["https://i.imgur.com/N1vjMHQ.jpeg"],
        "availability": "in_stock",
        "price": "59.95 EUR",
        "brand": "Droomvriendjes",
        "condition": "new",
        "google_product_category": "588 > 4186",
        "product_type": "Knuffels > Slaapknuffels > Boerderijdieren",
        "identifier_exists": "no",
        "age_group": "infant",
        "color": "Wit/Crème",
        "material": "Pluche",
        "shipping_weight": "0.5 kg"
    },
    {
        "id": "KNUF_009",
        "title": "Kalmerende Eenhoorn Knuffel - Magische Unicorn",
        "description": "Magische eenhoorn met kalmerend licht. De perfecte slaaphulp!",
        "link": "/product/9",
        "image_link": "https://i.imgur.com/KRNfDsV.jpeg",
        "additional_image_links": ["https://i.imgur.com/x4PTZXD.png"],
        "availability": "in_stock",
        "price": "59.95 EUR",
        "brand": "Droomvriendjes",
        "condition": "new",
        "google_product_category": "588 > 4186",
        "product_type": "Knuffels > Slaapknuffels > Fantasiedieren",
        "identifier_exists": "no",
        "age_group": "infant",
        "color": "Roze/Regenboog",
        "material": "Pluche",
        "shipping_weight": "0.5 kg"
    },
    {
        "id": "KNUF_011",
        "title": "Panda Projector Knuffel - Slaapknuffel met Sterrenhemel",
        "description": "Schattige panda met rustgevende muziek en nachtlicht. Perfect voor rustige nachtjes!",
        "link": "/product/11",
        "image_link": "https://i.imgur.com/fhVs30E.jpeg",
        "additional_image_links": ["https://i.imgur.com/COWpWna.jpeg"],
        "availability": "in_stock",
        "price": "49.95 EUR",
        "brand": "Droomvriendjes",
        "condition": "new",
        "google_product_category": "588 > 4186",
        "product_type": "Knuffels > Slaapknuffels > Wilde Dieren",
        "identifier_exists": "no",
        "age_group": "infant",
        "color": "Zwart/Wit",
        "material": "Pluche",
        "shipping_weight": "0.5 kg"
    }
]


# ============== HEALTH CHECK ENDPOINT (Required for Kubernetes) ==============

@app.get("/health")
async def health_check():
    """Health check endpoint for Kubernetes liveness/readiness probes"""
    return {"status": "healthy", "service": "droomvriendje-backend"}

@app.get("/api/health")
async def api_health_check():
    """API health check with configuration status"""
    mollie_key = get_mollie_api_key()
    return {
        "status": "healthy",
        "service": "droomvriendje-backend",
        "config": {
            "mollie_configured": bool(mollie_key),
            "mollie_key_type": "live" if mollie_key and mollie_key.startswith("live_") else "test" if mollie_key else "none",
            "smtp_configured": bool(os.environ.get('SMTP_HOST')),
            "mongodb_connected": True
        }
    }


# ============== EMAIL FUNCTIONS ==============

def send_email(to_email: str, subject: str, html_content: str, text_content: str, reply_to: str = None):
    """Generic email sending function with logging"""
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f'Droomvriendjes <{SMTP_FROM}>'
        msg['To'] = to_email
        
        if reply_to:
            msg['Reply-To'] = reply_to
        
        msg.attach(MIMEText(text_content, 'plain'))
        msg.attach(MIMEText(html_content, 'html'))
        
        # Send email via SMTP SSL
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, to_email, msg.as_string())
        
        logger.info(f"✅ EMAIL SENT: To={to_email}, Subject={subject}")
        return True
        
    except Exception as e:
        logger.error(f"❌ EMAIL FAILED: To={to_email}, Subject={subject}, Error={str(e)}")
        return False


def send_contact_form_email(contact_data: dict):
    """Send contact form submission to owner (info@droomvriendjes.nl)"""
    naam = contact_data.get('naam', 'Onbekend')
    email = contact_data.get('email', 'Onbekend')
    telefoon = contact_data.get('telefoon', 'Niet opgegeven')
    onderwerp = contact_data.get('onderwerp', 'Geen onderwerp')
    bericht = contact_data.get('bericht', '')
    page_url = contact_data.get('page_url', 'Onbekend')
    timestamp = datetime.now(timezone.utc).strftime('%d-%m-%Y %H:%M:%S')
    
    subject = f"📬 Nieuw contactformulier: {onderwerp}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">📬 Nieuw Contactformulier</h1>
        </div>
        
        <div style="background: white; padding: 25px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">Naam:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee;">{naam}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                        <a href="mailto:{email}" style="color: #7c3aed;">{email}</a>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">Telefoon:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee;">{telefoon}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">Onderwerp:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee;">{onderwerp}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">Datum/tijd:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee;">{timestamp} (UTC)</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">Pagina:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-size: 12px;">{page_url}</td>
                </tr>
            </table>
            
            <div style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px;">
                <strong>Bericht:</strong>
                <p style="margin: 10px 0 0 0; white-space: pre-wrap;">{bericht}</p>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #dbeafe; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px;">
                    💡 <strong>Tip:</strong> Klik op "Beantwoorden" om direct te reageren naar {email}
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
    NIEUW CONTACTFORMULIER
    ======================
    
    Naam: {naam}
    Email: {email}
    Telefoon: {telefoon}
    Onderwerp: {onderwerp}
    Datum/tijd: {timestamp} (UTC)
    Pagina: {page_url}
    
    BERICHT:
    {bericht}
    """
    
    return send_email(OWNER_EMAIL, subject, html_content, text_content, reply_to=email)


def send_checkout_started_email(checkout_data: dict):
    """Send checkout started notification to owner"""
    customer_email = checkout_data.get('customer_email', 'Onbekend')
    cart_items = checkout_data.get('cart_items', [])
    total_amount = checkout_data.get('total_amount', 0)
    session_id = checkout_data.get('session_id', 'Onbekend')
    timestamp = datetime.now(timezone.utc).strftime('%d-%m-%Y %H:%M:%S')
    
    # Build items HTML
    items_html = ""
    for item in cart_items:
        items_html += f"""
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">{item.get('name', 'Product')}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">{item.get('quantity', 1)}x</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">€{item.get('price', 0):.2f}</td>
        </tr>
        """
    
    subject = f"🛒 Checkout gestart - {customer_email}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">🛒 Checkout Gestart!</h1>
        </div>
        
        <div style="background: white; padding: 25px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 16px;">
                    <strong>⚡ Actie vereist:</strong> Een klant is begonnen met afrekenen!
                </p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; width: 140px;">Klant email:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                        <a href="mailto:{customer_email}" style="color: #7c3aed; font-weight: bold;">{customer_email}</a>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">Datum/tijd:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee;">{timestamp} (UTC)</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">Session ID:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-size: 12px;">{session_id}</td>
                </tr>
            </table>
            
            <h3 style="color: #333; margin-bottom: 10px;">Winkelwagen:</h3>
            <table style="width: 100%; border-collapse: collapse; background: #f9fafb; border-radius: 8px;">
                <thead>
                    <tr style="background: #7c3aed; color: white;">
                        <th style="padding: 10px; text-align: left;">Product</th>
                        <th style="padding: 10px; text-align: center;">Aantal</th>
                        <th style="padding: 10px; text-align: right;">Prijs</th>
                    </tr>
                </thead>
                <tbody>
                    {items_html}
                </tbody>
                <tfoot>
                    <tr style="background: #f3f4f6;">
                        <td colspan="2" style="padding: 12px; font-weight: bold; font-size: 16px;">Totaal</td>
                        <td style="padding: 12px; font-weight: bold; font-size: 16px; text-align: right; color: #7c3aed;">
                            €{total_amount:.2f}
                        </td>
                    </tr>
                </tfoot>
            </table>
            
            <div style="margin-top: 20px; padding: 15px; background: #dbeafe; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px;">
                    💬 <strong>Tip:</strong> Stuur een chat/email naar {customer_email} om te helpen met de bestelling!
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
    CHECKOUT GESTART!
    =================
    
    Klant email: {customer_email}
    Datum/tijd: {timestamp} (UTC)
    Session ID: {session_id}
    
    WINKELWAGEN:
    """
    for item in cart_items:
        text_content += f"\n- {item.get('name', 'Product')} x{item.get('quantity', 1)} = €{item.get('price', 0):.2f}"
    text_content += f"\n\nTOTAAL: €{total_amount:.2f}"
    
    return send_email(OWNER_EMAIL, subject, html_content, text_content, reply_to=customer_email)


def send_order_notification_email(order_data: dict, event_type: str):
    """Send order event notification to owner"""
    order_id = str(order_data.get('_id', ''))[-8:].upper() if order_data.get('_id') else 'UNKNOWN'
    customer_email = order_data.get('customer_email', 'Onbekend')
    customer_name = order_data.get('customer_name', 'Onbekend')
    total_amount = order_data.get('total_amount', 0)
    items = order_data.get('items', [])
    timestamp = datetime.now(timezone.utc).strftime('%d-%m-%Y %H:%M:%S')
    
    # Event-specific styling
    event_config = {
        'order_placed': {
            'emoji': '📦',
            'title': 'Nieuwe Bestelling',
            'color': '#3b82f6',
            'message': 'Een nieuwe bestelling is geplaatst en wacht op betaling.'
        },
        'payment_success': {
            'emoji': '✅',
            'title': 'Betaling Geslaagd',
            'color': '#10b981',
            'message': 'De betaling is succesvol ontvangen! Bestelling kan worden verzonden.'
        },
        'payment_failed': {
            'emoji': '❌',
            'title': 'Betaling Mislukt/Afgebroken',
            'color': '#ef4444',
            'message': 'De betaling is mislukt of afgebroken door de klant.'
        }
    }
    
    config = event_config.get(event_type, event_config['order_placed'])
    
    # Build items HTML
    items_html = ""
    for item in items:
        items_html += f"""
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">{item.get('product_name', 'Product')}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">{item.get('quantity', 1)}x</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">€{item.get('price', 0):.2f}</td>
        </tr>
        """
    
    subject = f"{config['emoji']} {config['title']} - #{order_id} ({customer_email})"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: {config['color']}; padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">{config['emoji']} {config['title']}</h1>
        </div>
        
        <div style="background: white; padding: 25px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <div style="padding: 15px; background: #f3f4f6; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0;">{config['message']}</p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; width: 140px;">Order ID:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #7c3aed;">#{order_id}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">Klant naam:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee;">{customer_name}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">Klant email:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                        <a href="mailto:{customer_email}" style="color: #7c3aed;">{customer_email}</a>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">Datum/tijd:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #eee;">{timestamp} (UTC)</td>
                </tr>
            </table>
            
            <h3 style="color: #333; margin-bottom: 10px;">Bestelde producten:</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #7c3aed; color: white;">
                        <th style="padding: 10px; text-align: left;">Product</th>
                        <th style="padding: 10px; text-align: center;">Aantal</th>
                        <th style="padding: 10px; text-align: right;">Prijs</th>
                    </tr>
                </thead>
                <tbody>
                    {items_html}
                </tbody>
                <tfoot>
                    <tr style="background: #f3f4f6;">
                        <td colspan="2" style="padding: 12px; font-weight: bold; font-size: 16px;">Totaal</td>
                        <td style="padding: 12px; font-weight: bold; font-size: 16px; text-align: right; color: #7c3aed;">
                            €{total_amount:.2f}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
    {config['title'].upper()}
    {'=' * len(config['title'])}
    
    {config['message']}
    
    Order ID: #{order_id}
    Klant naam: {customer_name}
    Klant email: {customer_email}
    Datum/tijd: {timestamp} (UTC)
    
    BESTELDE PRODUCTEN:
    """
    for item in items:
        text_content += f"\n- {item.get('product_name', 'Product')} x{item.get('quantity', 1)} = €{item.get('price', 0):.2f}"
    text_content += f"\n\nTOTAAL: €{total_amount:.2f}"
    
    return send_email(OWNER_EMAIL, subject, html_content, text_content, reply_to=customer_email)


def send_order_confirmation_email(order_data: dict):
    """Send order confirmation email to customer"""
    try:
        customer_email = order_data.get('customer_email')
        customer_name = order_data.get('customer_name', 'Klant')
        order_id = str(order_data.get('_id', ''))[-8:].upper()
        total_amount = order_data.get('total_amount', 0)
        items = order_data.get('items', [])
        
        # Create email content
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'🧸 Bedankt voor je bestelling bij Droomvriendjes! #{order_id}'
        msg['From'] = f'Droomvriendjes <{SMTP_FROM}>'
        msg['To'] = customer_email
        
        # Build items HTML
        items_html = ""
        for item in items:
            items_html += f"""
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">
                    {item.get('product_name', 'Product')}
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
                    {item.get('quantity', 1)}x
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
                    €{item.get('price', 0):.2f}
                </td>
            </tr>
            """
        
        # HTML email template
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #7c3aed; margin: 0;">🧸 Droomvriendjes</h1>
                </div>
                
                <!-- Main Content -->
                <h2 style="color: #333;">Bedankt voor je bestelling, {customer_name}!</h2>
                
                <p style="color: #666; line-height: 1.6;">
                    Je bestelling is succesvol ontvangen en wordt zo snel mogelijk verwerkt. 
                    Hieronder vind je een overzicht van je bestelling.
                </p>
                
                <!-- Order Info -->
                <div style="background-color: #f3e8ff; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; color: #7c3aed;"><strong>Bestelnummer:</strong> #{order_id}</p>
                </div>
                
                <!-- Order Items -->
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <thead>
                        <tr style="background-color: #7c3aed; color: white;">
                            <th style="padding: 12px; text-align: left;">Product</th>
                            <th style="padding: 12px; text-align: center;">Aantal</th>
                            <th style="padding: 12px; text-align: right;">Prijs</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_html}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="2" style="padding: 15px; font-weight: bold; font-size: 18px;">Totaal</td>
                            <td style="padding: 15px; font-weight: bold; font-size: 18px; text-align: right; color: #7c3aed;">
                                €{total_amount:.2f}
                            </td>
                        </tr>
                    </tfoot>
                </table>
                
                <!-- Shipping Info -->
                <div style="background-color: #e8f5e9; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; color: #2e7d32;">
                        ✓ <strong>Gratis verzending</strong> - Voor 23:00 besteld, morgen in huis!
                    </p>
                </div>
                
                <!-- Footer -->
                <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px; text-align: center; color: #999;">
                    <p>Vragen over je bestelling?<br>
                    Neem contact op via <a href="mailto:info@droomvriendjes.nl" style="color: #7c3aed;">info@droomvriendjes.nl</a></p>
                    
                    <p style="font-size: 12px; margin-top: 20px;">
                        Droomvriendjes<br>
                        Schaesbergerweg 103, 6415 AD Heerlen<br>
                        KVK: 9921083
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Plain text alternative
        text_content = f"""
        Bedankt voor je bestelling bij Droomvriendjes!
        
        Beste {customer_name},
        
        Je bestelling #{order_id} is succesvol ontvangen.
        
        Totaal: €{total_amount:.2f}
        
        Je bestelling wordt zo snel mogelijk verzonden.
        Gratis verzending - Voor 23:00 besteld, morgen in huis!
        
        Vragen? Mail naar info@droomvriendjes.nl
        
        Met vriendelijke groet,
        Droomvriendjes
        """
        
        msg.attach(MIMEText(text_content, 'plain'))
        msg.attach(MIMEText(html_content, 'html'))
        
        # Send email via SMTP SSL
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, customer_email, msg.as_string())
        
        logger.info(f"✅ Order confirmation email sent to {customer_email}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to send order confirmation email: {str(e)}")
        return False


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Contact Form Model
class ContactFormCreate(BaseModel):
    naam: str
    email: str
    telefoon: Optional[str] = None
    onderwerp: str
    bericht: str
    page_url: Optional[str] = None

# Checkout Started Model
class CartItem(BaseModel):
    name: str
    price: float
    quantity: int

class CheckoutStartedCreate(BaseModel):
    customer_email: str
    cart_items: List[CartItem]
    total_amount: float
    session_id: Optional[str] = None

# Order Models
class OrderItem(BaseModel):
    product_id: str
    product_name: str
    price: float
    quantity: int
    image: Optional[str] = None

class OrderCreate(BaseModel):
    customer_email: str
    customer_name: str
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    customer_city: Optional[str] = None
    customer_zipcode: Optional[str] = None
    customer_comment: Optional[str] = None
    items: List[OrderItem]
    subtotal: Optional[float] = None
    discount: Optional[float] = 0
    total_amount: float
    discount_code: Optional[str] = None
    discount_amount: Optional[float] = 0

class PaymentCreate(BaseModel):
    order_id: str
    payment_method: str = "ideal"

class OrderResponse(BaseModel):
    order_id: str
    status: str
    total_amount: float
    customer_email: str
    payment_method: Optional[str] = None

# Discount Code Models
class DiscountCodeValidate(BaseModel):
    code: str
    cart_total: float

class GiftCardPurchase(BaseModel):
    amount: float
    sender_name: str
    sender_email: str
    recipient_name: str
    recipient_email: str
    message: Optional[str] = ""

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks


# ============== CONTACT & NOTIFICATION ENDPOINTS ==============

@api_router.post("/contact")
async def submit_contact_form(contact: ContactFormCreate):
    """Handle contact form submission and send email to owner"""
    try:
        # Store contact submission in database
        contact_dict = {
            "naam": contact.naam,
            "email": contact.email,
            "telefoon": contact.telefoon,
            "onderwerp": contact.onderwerp,
            "bericht": contact.bericht,
            "page_url": contact.page_url,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.contact_submissions.insert_one(contact_dict)
        logger.info(f"Contact form submission stored: {contact.email}")
        
        # Send email notification to owner
        email_sent = send_contact_form_email(contact_dict)
        
        if email_sent:
            return {"status": "success", "message": "Bericht succesvol verzonden"}
        else:
            # Still return success if stored in DB, but log the email failure
            logger.warning(f"Contact form stored but email failed for: {contact.email}")
            return {"status": "success", "message": "Bericht ontvangen (email notificatie uitgesteld)"}
            
    except Exception as e:
        logger.error(f"Contact form error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Er ging iets mis: {str(e)}")


@api_router.post("/checkout-started")
async def checkout_started(checkout: CheckoutStartedCreate):
    """Track checkout start and send notification to owner"""
    try:
        # Generate session ID if not provided
        session_id = checkout.session_id or str(uuid.uuid4())[:8].upper()
        
        # Store checkout event in database
        checkout_dict = {
            "customer_email": checkout.customer_email,
            "cart_items": [item.model_dump() for item in checkout.cart_items],
            "total_amount": checkout.total_amount,
            "session_id": session_id,
            "status": "started",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.checkout_events.insert_one(checkout_dict)
        logger.info(f"Checkout started: {checkout.customer_email} - Session: {session_id}")
        
        # Send email notification to owner
        email_sent = send_checkout_started_email(checkout_dict)
        
        return {
            "status": "success",
            "session_id": session_id,
            "email_sent": email_sent
        }
            
    except Exception as e:
        logger.error(f"Checkout started error: {str(e)}")
        # Don't fail the checkout process, just log the error
        return {"status": "success", "session_id": "UNKNOWN", "email_sent": False}


# ============== DISCOUNT CODE ENDPOINTS ==============

@api_router.post("/discount/validate")
async def validate_discount_code(data: DiscountCodeValidate):
    """Validate a discount code and return the discount amount"""
    try:
        code = data.code.strip().upper()
        logger.info(f"Validating discount code: {code}")
        
        # Check if it's a gift card code (starts with DV-)
        if code.startswith("DV-"):
            gift_card = await db.gift_cards.find_one({
                "code": code,
                "status": "active"
            })
            
            if gift_card:
                remaining = gift_card.get("remaining_amount", gift_card.get("amount", 0))
                discount = min(remaining, data.cart_total)
                return {
                    "valid": True,
                    "code": code,
                    "type": "gift_card",
                    "discount_amount": discount,
                    "message": f"Cadeaubon toegepast: -€{discount:.2f}"
                }
            else:
                return {
                    "valid": False,
                    "message": "Ongeldige of verlopen cadeaubon"
                }
        
        # Check regular discount codes
        discount_code = await db.discount_codes.find_one({
            "code": code,
            "active": True
        })
        
        logger.info(f"Discount code lookup result: {discount_code is not None}")
        
        if discount_code:
            # Check if code is expired
            expires_field = discount_code.get("expires_at") or discount_code.get("valid_until")
            if expires_field:
                try:
                    expires = datetime.fromisoformat(expires_field.replace('Z', '+00:00'))
                    if expires < datetime.now(timezone.utc):
                        return {"valid": False, "message": "Deze kortingscode is verlopen"}
                except:
                    pass
            
            # Check usage limit
            max_uses = discount_code.get("max_uses")
            current_uses = discount_code.get("uses", 0) or discount_code.get("current_uses", 0)
            if max_uses and current_uses >= max_uses:
                return {"valid": False, "message": "Deze kortingscode is niet meer geldig"}
            
            # Check minimum order amount
            min_order = discount_code.get("min_order", 0) or discount_code.get("min_order_amount", 0)
            if min_order and data.cart_total < min_order:
                return {"valid": False, "message": f"Minimale bestelwaarde: €{min_order:.2f}"}
            
            # Calculate discount - support both field naming conventions
            discount_type = discount_code.get("type") or discount_code.get("discount_type", "percentage")
            discount_value = discount_code.get("value") or discount_code.get("discount_value", 0)
            
            if discount_type == "percentage":
                discount_amount = data.cart_total * (discount_value / 100)
                message = f"{discount_value}% korting toegepast"
            elif discount_type == "free_shipping":
                discount_amount = 0
                message = "Gratis verzending toegepast"
            else:  # fixed amount
                discount_amount = min(discount_value, data.cart_total)
                message = f"€{discount_amount:.2f} korting toegepast"
            
            return {
                "valid": True,
                "code": code,
                "type": discount_type,
                "discount_amount": round(discount_amount, 2),
                "message": message
            }
        
        return {"valid": False, "message": "Ongeldige kortingscode"}
        
    except Exception as e:
        logger.error(f"Discount validation error: {str(e)}")
        return {"valid": False, "message": "Er ging iets mis bij het valideren"}


@api_router.post("/gift-card/purchase")
async def purchase_gift_card(data: GiftCardPurchase):
    """Create a gift card purchase and initiate payment"""
    try:
        # Verify Mollie API key is available - use fresh check
        api_key = get_mollie_api_key()
        if not api_key:
            logger.error("Mollie API key not configured for gift card purchase")
            raise HTTPException(status_code=500, detail="Betaalsysteem niet correct geconfigureerd. Neem contact op met support.")
        
        # Generate unique gift card code
        gift_card_code = f"DV-{uuid.uuid4().hex[:8].upper()}"
        
        # Create gift card record (inactive until paid)
        gift_card = {
            "code": gift_card_code,
            "amount": data.amount,
            "remaining_amount": data.amount,
            "sender_name": data.sender_name,
            "sender_email": data.sender_email,
            "recipient_name": data.recipient_name,
            "recipient_email": data.recipient_email,
            "message": data.message,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        result = await db.gift_cards.insert_one(gift_card)
        gift_card_id = str(result.inserted_id)
        
        # Create Mollie payment
        logger.info(f"Creating gift card payment with API key: {api_key[:15]}...")
        mollie_client = get_mollie_client()
        
        # Use dynamic URLs for production
        frontend_url = get_frontend_url()
        api_url = get_api_url()
        
        payment = mollie_client.payments.create({
            "amount": {
                "currency": "EUR",
                "value": f"{data.amount:.2f}"
            },
            "description": f"Droomvriendjes Cadeaubon €{data.amount:.2f}",
            "redirectUrl": f"{frontend_url}/cadeaubon/succes?id={gift_card_id}",
            "webhookUrl": f"{api_url}/api/webhook/gift-card",
            "metadata": {
                "gift_card_id": gift_card_id,
                "type": "gift_card"
            }
        })
        
        # Update gift card with payment ID
        await db.gift_cards.update_one(
            {"_id": result.inserted_id},
            {"$set": {"mollie_payment_id": payment.id}}
        )
        
        logger.info(f"Gift card purchase initiated: {gift_card_code} for €{data.amount}")
        
        return {
            "success": True,
            "gift_card_id": gift_card_id,
            "checkout_url": payment.checkout_url
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Gift card purchase error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Betaling aanmaken mislukt: {str(e)}")


@api_router.post("/webhook/gift-card")
async def gift_card_webhook(request: Request):
    """Handle Mollie webhook for gift card payments"""
    try:
        form_data = await request.form()
        payment_id = form_data.get("id")
        
        if not payment_id:
            return {"status": "ignored"}
        
        mollie_client = get_mollie_client()
        payment = mollie_client.payments.get(payment_id)
        
        # Find the gift card
        gift_card = await db.gift_cards.find_one({"mollie_payment_id": payment_id})
        
        if not gift_card:
            logger.warning(f"Gift card not found for payment: {payment_id}")
            return {"status": "not_found"}
        
        if payment.is_paid():
            # Activate the gift card
            await db.gift_cards.update_one(
                {"mollie_payment_id": payment_id},
                {"$set": {"status": "active", "paid_at": datetime.now(timezone.utc).isoformat()}}
            )
            
            # Send gift card email to recipient
            send_gift_card_email(gift_card)
            
            # Send confirmation to sender
            send_gift_card_confirmation_email(gift_card)
            
            logger.info(f"Gift card activated and emailed: {gift_card['code']}")
        
        elif payment.is_failed() or payment.is_canceled() or payment.is_expired():
            await db.gift_cards.update_one(
                {"mollie_payment_id": payment_id},
                {"$set": {"status": "failed"}}
            )
            logger.info(f"Gift card payment failed: {gift_card['code']}")
        
        return {"status": "processed"}
        
    except Exception as e:
        logger.error(f"Gift card webhook error: {str(e)}")
        return {"status": "error"}


def send_gift_card_email(gift_card: dict):
    """Send gift card code to recipient"""
    try:
        recipient_email = gift_card.get("recipient_email")
        recipient_name = gift_card.get("recipient_name", "")
        sender_name = gift_card.get("sender_name", "Iemand")
        amount = gift_card.get("amount", 0)
        code = gift_card.get("code")
        message = gift_card.get("message", "")
        
        subject = f"🎁 Je hebt een Droomvriendjes cadeaubon ontvangen!"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
            <div style="background: white; border-radius: 15px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #7c3aed; margin: 0;">🎁 Cadeaubon</h1>
                    <p style="color: #666; font-size: 18px;">Van {sender_name}</p>
                </div>
                
                <div style="background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); color: white; padding: 30px; border-radius: 15px; text-align: center; margin-bottom: 20px;">
                    <p style="margin: 0; font-size: 16px;">Waarde</p>
                    <p style="margin: 10px 0; font-size: 48px; font-weight: bold;">€{amount:.2f}</p>
                    <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px; margin-top: 20px;">
                        <p style="margin: 0; font-size: 14px;">Jouw kortingscode:</p>
                        <p style="margin: 10px 0 0 0; font-size: 28px; font-weight: bold; letter-spacing: 2px;">{code}</p>
                    </div>
                </div>
                
                {f'<div style="background: #f3e8ff; padding: 20px; border-radius: 10px; margin-bottom: 20px;"><p style="margin: 0; color: #7c3aed; font-style: italic;">"{message}"</p></div>' if message else ''}
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://droomvriendjes.nl" style="display: inline-block; background: #7c3aed; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                        Nu Besteden
                    </a>
                </div>
                
                <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #999; font-size: 14px;">
                    <p>Voer de code in bij het afrekenen om je korting te gebruiken.</p>
                    <p>Droomvriendjes - Slaapknuffels voor een betere nachtrust</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        CADEAUBON VAN {sender_name.upper()}
        
        Hoi {recipient_name}!
        
        Je hebt een Droomvriendjes cadeaubon ontvangen ter waarde van €{amount:.2f}!
        
        Jouw kortingscode: {code}
        
        {f'Bericht: "{message}"' if message else ''}
        
        Gebruik deze code bij het afrekenen op droomvriendjes.nl
        
        Veel plezier met je nieuwe Droomvriendjes!
        """
        
        return send_email(recipient_email, subject, html_content, text_content)
        
    except Exception as e:
        logger.error(f"Failed to send gift card email: {str(e)}")
        return False


def send_gift_card_confirmation_email(gift_card: dict):
    """Send confirmation to gift card purchaser"""
    try:
        sender_email = gift_card.get("sender_email")
        sender_name = gift_card.get("sender_name", "")
        recipient_name = gift_card.get("recipient_name", "")
        recipient_email = gift_card.get("recipient_email")
        amount = gift_card.get("amount", 0)
        code = gift_card.get("code")
        
        subject = f"✅ Je cadeaubon is verzonden naar {recipient_name}!"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h1 style="color: #10b981; text-align: center;">✅ Cadeaubon Verzonden!</h1>
                
                <p>Beste {sender_name},</p>
                
                <p>Je cadeaubon ter waarde van <strong>€{amount:.2f}</strong> is succesvol verzonden naar {recipient_name} ({recipient_email}).</p>
                
                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Code:</strong> {code}</p>
                    <p style="margin: 5px 0 0 0;"><strong>Ontvanger:</strong> {recipient_email}</p>
                </div>
                
                <p style="color: #666;">Bedankt voor je aankoop bij Droomvriendjes!</p>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        CADEAUBON VERZONDEN!
        
        Beste {sender_name},
        
        Je cadeaubon ter waarde van €{amount:.2f} is verzonden naar {recipient_name} ({recipient_email}).
        
        Code: {code}
        
        Bedankt voor je aankoop bij Droomvriendjes!
        """
        
        return send_email(sender_email, subject, html_content, text_content)
        
    except Exception as e:
        logger.error(f"Failed to send gift card confirmation: {str(e)}")
        return False


# ============== ORDER & PAYMENT ENDPOINTS ==============

@api_router.post("/orders")
async def create_order(order: OrderCreate):
    """Create a new order"""
    order_dict = {
        "customer_email": order.customer_email,
        "customer_name": order.customer_name,
        "customer_phone": order.customer_phone or "",
        "customer_address": order.customer_address,
        "customer_city": order.customer_city,
        "customer_zipcode": order.customer_zipcode,
        "customer_comment": order.customer_comment or "",
        "items": [item.model_dump() for item in order.items],
        "subtotal": order.subtotal or order.total_amount,
        "discount": order.discount or 0,
        "total_amount": order.total_amount,
        "currency": "EUR",
        "status": "pending",
        "mollie_payment_id": None,
        "payment_method": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.orders.insert_one(order_dict)
    order_id = str(result.inserted_id)
    
    # Send order notification to owner
    order_dict['_id'] = order_id
    send_order_notification_email(order_dict, 'order_placed')
    
    logger.info(f"Order created: {order_id}")
    return {"order_id": order_id, "status": "pending"}


@api_router.post("/payments/create")
async def create_payment(payment: PaymentCreate):
    """Create a Mollie payment for an order"""
    try:
        # Debug: Log API key status
        # Get API key dynamically for production support
        api_key = get_mollie_api_key()
        logger.info(f"Mollie API Key configured: {bool(api_key)}, Length: {len(api_key) if api_key else 0}")
        
        if not api_key or len(api_key) < 30:
            raise HTTPException(status_code=500, detail="Mollie API key not configured properly")
        
        # Retrieve order from database
        order = await db.orders.find_one({"_id": ObjectId(payment.order_id)})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Initialize Mollie client with fresh API key
        mollie_client = get_mollie_client()
        
        # Build redirect and webhook URLs - use dynamic getters for production
        frontend_url = get_frontend_url()
        api_url = get_api_url()
        redirect_url = f"{frontend_url}/betaling-resultaat/{payment.order_id}"
        webhook_url = f"{api_url}/api/webhook/mollie"
        cancel_url = f"{frontend_url}/checkout"
        
        logger.info(f"Creating payment - Frontend URL: {frontend_url}")
        logger.info(f"Creating payment - Redirect: {redirect_url}")
        logger.info(f"Creating payment - Cancel: {cancel_url}")
        logger.info(f"Creating payment - Webhook: {webhook_url}")
        logger.info(f"Order total: {order['total_amount']}, Method: {payment.payment_method}")
        
        # Base payment data
        payment_data = {
            'amount': {
                'currency': 'EUR',
                'value': f"{order['total_amount']:.2f}"
            },
            'description': f"Droomvriendjes Bestelling #{payment.order_id[-8:]}",
            'redirectUrl': redirect_url,
            'cancelUrl': cancel_url,
            'webhookUrl': webhook_url,
            'method': payment.payment_method,
            'metadata': {
                'order_id': payment.order_id,
                'customer_email': order['customer_email']
            }
        }
        
        # Add billing address for Klarna and iDEAL in3 (required by these methods)
        if payment.payment_method in ['klarna', 'klarnapaylater', 'klarnasliceit', 'in3', 'ideal_in3']:
            # Split name into given and family name
            name_parts = order.get('customer_name', '').split(' ', 1)
            given_name = name_parts[0] if name_parts else ''
            family_name = name_parts[1] if len(name_parts) > 1 else name_parts[0]
            
            payment_data['billingAddress'] = {
                'givenName': given_name,
                'familyName': family_name,
                'email': order.get('customer_email', ''),
                'streetAndNumber': order.get('customer_address', ''),
                'postalCode': order.get('customer_zipcode', ''),
                'city': order.get('customer_city', ''),
                'country': 'NL'
            }
            
            # Klarna also requires shipping address
            payment_data['shippingAddress'] = payment_data['billingAddress'].copy()
        
        # Klarna specifically requires order lines
        if payment.payment_method in ['klarna', 'klarnapaylater', 'klarnasliceit']:
            lines = []
            for item in order.get('items', []):
                item_total = float(item.get('price', 0)) * int(item.get('quantity', 1))
                lines.append({
                    'type': 'physical',
                    'description': item.get('product_name', 'Droomvriendjes Knuffel'),
                    'name': item.get('product_name', 'Product'),
                    'quantity': int(item.get('quantity', 1)),
                    'unitPrice': {
                        'currency': 'EUR',
                        'value': f"{float(item.get('price', 0)):.2f}"
                    },
                    'totalAmount': {
                        'currency': 'EUR',
                        'value': f"{item_total:.2f}"
                    },
                    'vatRate': '21.00',
                    'vatAmount': {
                        'currency': 'EUR',
                        'value': f"{item_total * 0.21 / 1.21:.2f}"
                    }
                })
            payment_data['lines'] = lines
        
        # Create payment with Mollie
        mollie_payment = mollie_client.payments.create(payment_data)
        
        # Store payment reference in order
        await db.orders.update_one(
            {"_id": ObjectId(payment.order_id)},
            {"$set": {
                "mollie_payment_id": mollie_payment.id,
                "payment_method": payment.payment_method,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Store payment record
        await db.payments.insert_one({
            "order_id": payment.order_id,
            "mollie_payment_id": mollie_payment.id,
            "status": mollie_payment.status,
            "amount": str(order['total_amount']),
            "currency": "EUR",
            "method": payment.payment_method,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
        
        logger.info(f"Payment created: {mollie_payment.id} for order {payment.order_id}")
        
        return {
            "payment_id": mollie_payment.id,
            "checkout_url": mollie_payment.checkout_url,
            "status": mollie_payment.status
        }
        
    except Exception as e:
        logger.error(f"Payment creation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Payment creation failed: {str(e)}")


@api_router.post("/webhook/mollie")
async def mollie_webhook(request: Request):
    """Handle Mollie webhook notifications"""
    try:
        form_data = await request.form()
        payment_id = form_data.get("id")
        
        if not payment_id:
            logger.warning("Webhook received without payment ID")
            return {"status": "error", "message": "Missing payment ID"}
        
        logger.info(f"Webhook received for payment: {payment_id}")
        
        # Initialize Mollie client with dynamic API key
        mollie_client = get_mollie_client()
        payment = mollie_client.payments.get(payment_id)
        
        # Find the payment record
        db_payment = await db.payments.find_one({"mollie_payment_id": payment_id})
        if not db_payment:
            logger.warning(f"Payment not found in DB: {payment_id}")
            return {"status": "error", "message": "Payment not found"}
        
        order_id = db_payment["order_id"]
        
        # Determine order status
        if payment.is_paid():
            order_status = "paid"
        elif payment.is_pending():
            order_status = "pending"
        elif payment.is_open():
            order_status = "open"
        elif payment.is_canceled():
            order_status = "cancelled"
        elif payment.is_expired():
            order_status = "expired"
        else:
            order_status = "failed"
        
        # Update payment status
        await db.payments.update_one(
            {"mollie_payment_id": payment_id},
            {"$set": {
                "status": payment.status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Update order status
        await db.orders.update_one(
            {"_id": ObjectId(order_id)},
            {"$set": {
                "status": order_status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        logger.info(f"Order {order_id} status updated to: {order_status}")
        
        # Send notifications based on payment status
        order = await db.orders.find_one({"_id": ObjectId(order_id)})
        if order:
            order['_id'] = order_id  # Use string ID for email
            
            if order_status == "paid":
                # Send confirmation email to customer
                send_order_confirmation_email(order)
                # Send success notification to owner
                send_order_notification_email(order, 'payment_success')
                
                # Mark any abandoned cart as recovered
                global email_service
                if email_service is None:
                    email_service = EmailService(db)
                await email_service.mark_cart_recovered(order["customer_email"], order_id)
                
            elif order_status in ["cancelled", "expired", "failed"]:
                # Send failure notification to owner
                send_order_notification_email(order, 'payment_failed')
        
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}


@api_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    """Get order details and current payment status"""
    try:
        order = await db.orders.find_one({"_id": ObjectId(order_id)})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # If order has a Mollie payment ID, check current status
        if order.get("mollie_payment_id"):
            try:
                mollie_client = get_mollie_client()
                payment = mollie_client.payments.get(order["mollie_payment_id"])
                
                # Determine current status
                if payment.is_paid():
                    current_status = "paid"
                elif payment.is_pending():
                    current_status = "pending"
                elif payment.is_open():
                    current_status = "open"
                elif payment.is_canceled():
                    current_status = "cancelled"
                else:
                    current_status = "failed"
                
                # Update if status changed
                if current_status != order["status"]:
                    await db.orders.update_one(
                        {"_id": ObjectId(order_id)},
                        {"$set": {
                            "status": current_status,
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }}
                    )
                    order["status"] = current_status
                    
            except Exception as e:
                logger.warning(f"Could not fetch Mollie status: {e}")
        
        return {
            "order_id": order_id,
            "status": order["status"],
            "total_amount": order["total_amount"],
            "customer_email": order["customer_email"],
            "customer_name": order["customer_name"],
            "payment_method": order.get("payment_method"),
            "items": order.get("items", []),
            "tracking_code": order.get("tracking_code"),
            "carrier": order.get("carrier")
        }
        
    except Exception as e:
        logger.error(f"Get order error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== ADMIN ENDPOINTS ==============

import hashlib
import secrets
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Admin credentials from environment variables (required - no fallback for security)
ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD')

# Validate admin credentials are set
if not ADMIN_USERNAME or not ADMIN_PASSWORD:
    logger.warning("⚠️ ADMIN_USERNAME or ADMIN_PASSWORD not set in environment - admin panel will be disabled")
    ADMIN_USERNAME = ADMIN_USERNAME or "admin_disabled"
    ADMIN_PASSWORD = ADMIN_PASSWORD or secrets.token_hex(32)  # Random password if not set

# Hash the password for comparison
ADMIN_PASSWORD_HASH = hashlib.sha256(ADMIN_PASSWORD.encode()).hexdigest()

# Simple token store (in production, use Redis or database)
admin_tokens = {}

security = HTTPBearer(auto_error=False)


class AdminLogin(BaseModel):
    username: str
    password: str


def verify_admin_token(credentials: HTTPAuthorizationCredentials = None):
    """Verify admin authentication token"""
    if not credentials:
        return None
    token = credentials.credentials
    if token in admin_tokens:
        return admin_tokens[token]
    return None


@api_router.post("/admin/login")
async def admin_login(login: AdminLogin):
    """Admin login endpoint"""
    password_hash = hashlib.sha256(login.password.encode()).hexdigest()
    
    if login.username == ADMIN_USERNAME and password_hash == ADMIN_PASSWORD_HASH:
        # Generate token
        token = secrets.token_urlsafe(32)
        admin_tokens[token] = {"username": login.username, "created_at": datetime.now(timezone.utc).isoformat()}
        
        logger.info(f"Admin login successful: {login.username}")
        return {
            "success": True,
            "token": token,
            "admin": {"username": login.username}
        }
    
    logger.warning(f"Admin login failed: {login.username}")
    raise HTTPException(status_code=401, detail="Ongeldige gebruikersnaam of wachtwoord")


@api_router.get("/admin/verify")
async def verify_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify admin token"""
    admin = verify_admin_token(credentials)
    if not admin:
        raise HTTPException(status_code=401, detail="Niet geautoriseerd")
    return {"valid": True, "admin": admin}


@api_router.get("/admin/dashboard")
async def get_admin_dashboard(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    days: int = 30,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Get admin dashboard data with date filtering
    
    Args:
        days: Number of days to look back (default 30, use 0 for all time)
        start_date: Custom start date (YYYY-MM-DD format)
        end_date: Custom end date (YYYY-MM-DD format)
    """
    admin = verify_admin_token(credentials)
    if not admin:
        raise HTTPException(status_code=401, detail="Niet geautoriseerd")
    
    try:
        # Calculate date range
        now = datetime.now(timezone.utc)
        today = now.date()
        
        if start_date and end_date:
            # Custom date range
            filter_start = datetime.fromisoformat(start_date).replace(tzinfo=timezone.utc)
            filter_end = datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
        elif days > 0:
            # Last N days
            filter_start = now - timedelta(days=days)
            filter_end = now
        else:
            # All time
            filter_start = datetime(2020, 1, 1, tzinfo=timezone.utc)
            filter_end = now
        
        # Helper function to parse dates
        def parse_date(date_str):
            if not date_str:
                return None
            try:
                return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            except:
                return None
        
        # Get orders with MongoDB date filter and projection for better performance
        # Use $gte and $lte on created_at string (ISO format sorts correctly)
        orders_query = {
            "created_at": {
                "$gte": filter_start.isoformat(),
                "$lte": filter_end.isoformat()
            }
        }
        orders_projection = {
            "_id": 1,
            "customer_email": 1,
            "customer_name": 1,
            "total_amount": 1,
            "status": 1,
            "created_at": 1,
            "items": 1
        }
        orders = await db.orders.find(orders_query, orders_projection).to_list(5000)
        
        # Also get all orders for today's stats (separate optimized query)
        today_str = today.isoformat()[:10]  # YYYY-MM-DD format
        all_orders_projection = {"_id": 1, "total_amount": 1, "status": 1, "created_at": 1, "items": 1}
        all_orders = await db.orders.find({}, all_orders_projection).to_list(10000)
        
        # Calculate stats for filtered period
        total_orders = len(orders)
        total_revenue = sum(o.get('total_amount', 0) for o in orders if o.get('status') in ['paid', 'shipped', 'delivered'])
        
        # Order status counts
        pending_orders = len([o for o in orders if o.get('status') == 'pending'])
        paid_orders = len([o for o in orders if o.get('status') == 'paid'])
        shipped_orders = len([o for o in orders if o.get('status') == 'shipped'])
        delivered_orders = len([o for o in orders if o.get('status') == 'delivered'])
        cancelled_orders = len([o for o in orders if o.get('status') in ['cancelled', 'failed']])
        
        # Today's stats (always show today regardless of filter)
        today_str = today.isoformat()
        today_orders = [o for o in all_orders if o.get('created_at', '').startswith(today_str)]
        orders_today = len(today_orders)
        revenue_today = sum(o.get('total_amount', 0) for o in today_orders if o.get('status') in ['paid', 'shipped', 'delivered'])
        
        # Calculate previous period for comparison
        period_length = (filter_end - filter_start).days or 1
        prev_start = filter_start - timedelta(days=period_length)
        prev_end = filter_start
        
        prev_orders = []
        for o in all_orders:
            order_date = parse_date(o.get('created_at', ''))
            if order_date and prev_start <= order_date < prev_end:
                prev_orders.append(o)
        
        prev_revenue = sum(o.get('total_amount', 0) for o in prev_orders if o.get('status') in ['paid', 'shipped', 'delivered'])
        
        # Calculate growth percentage
        if prev_revenue > 0:
            revenue_growth = round(((total_revenue - prev_revenue) / prev_revenue) * 100, 1)
        else:
            revenue_growth = 100 if total_revenue > 0 else 0
        
        # Daily breakdown for chart
        daily_data = {}
        for o in orders:
            order_date = parse_date(o.get('created_at', ''))
            if order_date:
                day_key = order_date.date().isoformat()
                if day_key not in daily_data:
                    daily_data[day_key] = {'date': day_key, 'orders': 0, 'revenue': 0}
                daily_data[day_key]['orders'] += 1
                if o.get('status') in ['paid', 'shipped', 'delivered']:
                    daily_data[day_key]['revenue'] += o.get('total_amount', 0)
        
        # Sort daily data by date
        daily_breakdown = sorted(daily_data.values(), key=lambda x: x['date'])
        
        # Average order value
        paid_order_count = len([o for o in orders if o.get('status') in ['paid', 'shipped', 'delivered']])
        avg_order_value = total_revenue / paid_order_count if paid_order_count > 0 else 0
        
        # Unique customers
        customer_emails = set(o.get('customer_email', '').lower() for o in orders if o.get('customer_email'))
        total_customers = len(customer_emails)
        
        # To ship count
        to_ship = len([o for o in orders if o.get('status') == 'paid' and not o.get('tracking_code')])
        
        # Top customers
        customer_spending = {}
        for order in orders:
            email = order.get('customer_email', '').lower()
            if email and order.get('status') in ['paid', 'shipped', 'delivered']:
                if email not in customer_spending:
                    customer_spending[email] = {
                        'email': email,
                        'name': order.get('customer_name', 'Onbekend'),
                        'total_spent': 0,
                        'order_count': 0
                    }
                customer_spending[email]['total_spent'] += order.get('total_amount', 0)
                customer_spending[email]['order_count'] += 1
        
        top_customers = sorted(customer_spending.values(), key=lambda x: x['total_spent'], reverse=True)[:5]
        
        # Recent orders
        recent_orders = sorted(orders, key=lambda x: x.get('created_at', ''), reverse=True)[:10]
        recent_orders_data = [{
            'order_id': str(o.get('_id', '')),
            'customer_name': o.get('customer_name', ''),
            'customer_email': o.get('customer_email', ''),
            'total_amount': o.get('total_amount', 0),
            'status': o.get('status', 'pending'),
            'created_at': o.get('created_at', '')
        } for o in recent_orders]
        
        # ============== FUNNEL ANALYTICS ==============
        # Get checkout events for funnel analysis with date filter and projection
        checkout_query = {
            "created_at": {
                "$gte": filter_start.isoformat(),
                "$lte": filter_end.isoformat()
            }
        }
        checkout_projection = {
            "_id": 1,
            "customer_email": 1,
            "cart_items": 1,
            "total_amount": 1,
            "created_at": 1
        }
        checkout_events = await db.checkout_events.find(checkout_query, checkout_projection).to_list(5000)
        
        # Calculate funnel metrics
        # Step 1: Checkout Started (from checkout_events)
        checkout_started = len(checkout_events)
        
        # Step 2: Orders Created (from orders - means they clicked pay)
        orders_created = total_orders
        
        # Step 3: Payments Completed (paid orders)
        payments_completed = paid_orders + shipped_orders + delivered_orders
        
        # Calculate drop-off rates
        checkout_to_order_rate = (orders_created / checkout_started * 100) if checkout_started > 0 else 0
        order_to_payment_rate = (payments_completed / orders_created * 100) if orders_created > 0 else 0
        
        # Overall conversion rate (checkout to paid)
        overall_conversion = (payments_completed / checkout_started * 100) if checkout_started > 0 else 0
        
        # Abandoned carts (started checkout but no order created)
        abandoned_checkouts = checkout_started - orders_created
        abandoned_rate = (abandoned_checkouts / checkout_started * 100) if checkout_started > 0 else 0
        
        # Payment failures/cancellations
        payment_failures = cancelled_orders + pending_orders
        payment_failure_rate = (payment_failures / orders_created * 100) if orders_created > 0 else 0
        
        # Popular products (from completed orders)
        product_counts = {}
        for order in orders:
            if order.get('status') in ['paid', 'shipped', 'delivered']:
                for item in order.get('items', []):
                    product_name = item.get('product_name', 'Onbekend')
                    product_id = item.get('product_id', '')
                    qty = item.get('quantity', 1)
                    key = product_name
                    if key not in product_counts:
                        product_counts[key] = {'name': product_name, 'product_id': product_id, 'count': 0, 'revenue': 0}
                    product_counts[key]['count'] += qty
                    product_counts[key]['revenue'] += item.get('price', 0) * qty
        
        popular_products = sorted(product_counts.values(), key=lambda x: x['revenue'], reverse=True)[:5]
        
        # Recent checkout events (last 10 abandoned)
        abandoned_emails = set()
        for ce in checkout_events:
            email = ce.get('customer_email', '').lower()
            if email:
                # Check if this email has a successful order
                has_order = any(o.get('customer_email', '').lower() == email and o.get('status') in ['paid', 'shipped', 'delivered'] for o in orders)
                if not has_order:
                    abandoned_emails.add(email)
        
        recent_abandoned = []
        for ce in sorted(checkout_events, key=lambda x: x.get('created_at', ''), reverse=True):
            email = ce.get('customer_email', '').lower()
            if email in abandoned_emails and len(recent_abandoned) < 10:
                recent_abandoned.append({
                    'email': email,
                    'total_amount': ce.get('total_amount', 0),
                    'items_count': len(ce.get('cart_items', [])),
                    'created_at': ce.get('created_at', '')
                })
                abandoned_emails.discard(email)  # Only show each email once
        
        return {
            'date_range': {
                'start': filter_start.isoformat(),
                'end': filter_end.isoformat(),
                'days': days,
                'label': f"Laatste {days} dagen" if days > 0 else "Alle tijd"
            },
            'stats': {
                'total_revenue': total_revenue,
                'total_orders': total_orders,
                'total_customers': total_customers,
                'avg_order_value': avg_order_value,
                'pending_orders': pending_orders,
                'paid_orders': paid_orders,
                'shipped_orders': shipped_orders,
                'delivered_orders': delivered_orders,
                'cancelled_orders': cancelled_orders,
                'orders_today': orders_today,
                'revenue_today': revenue_today,
                'to_ship': to_ship,
                'revenue_growth': revenue_growth,
                'conversion_rate': round(overall_conversion, 1),
                'new_customers_week': 5,
                'new_customers_today': 1
            },
            'daily_breakdown': daily_breakdown,
            'funnel': {
                'checkout_started': checkout_started,
                'orders_created': orders_created,
                'payments_completed': payments_completed,
                'checkout_to_order_rate': round(checkout_to_order_rate, 1),
                'order_to_payment_rate': round(order_to_payment_rate, 1),
                'overall_conversion': round(overall_conversion, 1),
                'abandoned_checkouts': abandoned_checkouts,
                'abandoned_rate': round(abandoned_rate, 1),
                'payment_failures': payment_failures,
                'payment_failure_rate': round(payment_failure_rate, 1)
            },
            'popular_products': popular_products,
            'abandoned_carts': recent_abandoned,
            'recent_orders': recent_orders_data,
            'top_customers': top_customers
        }
        
    except Exception as e:
        logger.error(f"Dashboard error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Carrier tracking URL configurations
CARRIERS = {
    "postnl": {
        "name": "PostNL",
        "tracking_url": "https://postnl.nl/tracktrace/?B={code}&P=&D=NL&T=C"
    },
    "dhl": {
        "name": "DHL",
        "tracking_url": "https://www.dhl.com/nl-nl/home/tracking/tracking-parcel.html?submit=1&tracking-id={code}"
    },
    "dpd": {
        "name": "DPD",
        "tracking_url": "https://tracking.dpd.de/parcelstatus?locale=nl_NL&query={code}"
    },
    "gls": {
        "name": "GLS",
        "tracking_url": "https://gls-group.eu/NL/nl/volg-je-pakket?match={code}"
    },
    "bpost": {
        "name": "bpost",
        "tracking_url": "https://track.bpost.cloud/btr/web/#/search?itemCode={code}"
    }
}

class TrackingUpdate(BaseModel):
    tracking_code: str
    carrier: str = "postnl"
    send_email: bool = True


@api_router.get("/admin/orders")
async def get_admin_orders():
    """Get all orders for admin panel"""
    try:
        # Use projection to fetch only needed fields for better performance
        orders_projection = {
            "_id": 1,
            "customer_email": 1,
            "customer_name": 1,
            "total_amount": 1,
            "status": 1,
            "tracking_code": 1,
            "carrier": 1,
            "created_at": 1,
            "items": 1
        }
        orders = await db.orders.find({}, orders_projection).sort("created_at", -1).to_list(500)
        
        result = []
        for order in orders:
            result.append({
                "order_id": str(order["_id"]),
                "customer_email": order.get("customer_email", ""),
                "customer_name": order.get("customer_name", ""),
                "total_amount": order.get("total_amount", 0),
                "status": order.get("status", "pending"),
                "tracking_code": order.get("tracking_code"),
                "carrier": order.get("carrier"),
                "created_at": order.get("created_at", ""),
                "items": order.get("items", [])
            })
        
        return {"orders": result, "count": len(result)}
        
    except Exception as e:
        logger.error(f"Get admin orders error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/admin/orders/{order_id}/tracking")
async def update_order_tracking(order_id: str, tracking: TrackingUpdate):
    """Add or update tracking code for an order"""
    try:
        order = await db.orders.find_one({"_id": ObjectId(order_id)})
        if not order:
            raise HTTPException(status_code=404, detail="Bestelling niet gevonden")
        
        # Update order with tracking info
        await db.orders.update_one(
            {"_id": ObjectId(order_id)},
            {"$set": {
                "tracking_code": tracking.tracking_code,
                "carrier": tracking.carrier,
                "status": "shipped",
                "shipped_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        logger.info(f"Tracking added to order {order_id}: {tracking.carrier} - {tracking.tracking_code}")
        
        # Send tracking email to customer
        if tracking.send_email:
            email_sent = send_tracking_email(order, tracking.tracking_code, tracking.carrier)
        else:
            email_sent = False
        
        return {
            "success": True,
            "message": "Tracking code toegevoegd",
            "email_sent": email_sent
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update tracking error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


def send_tracking_email(order: dict, tracking_code: str, carrier: str):
    """Send tracking information email to customer"""
    try:
        customer_email = order.get("customer_email")
        customer_name = order.get("customer_name", "Klant")
        order_id = str(order.get("_id", ""))[-8:].upper()
        
        carrier_info = CARRIERS.get(carrier, CARRIERS["postnl"])
        tracking_url = carrier_info["tracking_url"].replace("{code}", tracking_code)
        carrier_name = carrier_info["name"]
        
        subject = f"🚚 Je bestelling is onderweg! - #{order_id}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
            <div style="background: white; border-radius: 15px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #7c3aed; margin: 0;">🚚 Je pakket is onderweg!</h1>
                </div>
                
                <p>Beste {customer_name},</p>
                
                <p>Goed nieuws! Je bestelling <strong>#{order_id}</strong> is verzonden en is onderweg naar jou.</p>
                
                <div style="background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); color: white; padding: 25px; border-radius: 12px; text-align: center; margin: 25px 0;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">TRACK & TRACE CODE</p>
                    <p style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px; font-family: monospace;">{tracking_code}</p>
                    <p style="margin: 15px 0 0 0; font-size: 14px; opacity: 0.9;">Verzonden via {carrier_name}</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{tracking_url}" 
                       style="display: inline-block; background: #7c3aed; color: white; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                        📍 Volg je pakket
                    </a>
                </div>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 25px 0;">
                    <h3 style="margin: 0 0 15px 0; color: #333;">📦 Wat kun je verwachten?</h3>
                    <ul style="margin: 0; padding-left: 20px; color: #666;">
                        <li>Je pakket wordt meestal binnen 1-2 werkdagen bezorgd</li>
                        <li>Je ontvangt een melding wanneer de bezorger onderweg is</li>
                        <li>Niet thuis? Het pakket wordt bij de buren of afhaalpunt afgeleverd</li>
                    </ul>
                </div>
                
                <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px; text-align: center; color: #999; font-size: 14px;">
                    <p>Vragen over je bestelling?<br>
                    Neem contact op via <a href="mailto:info@droomvriendjes.nl" style="color: #7c3aed;">info@droomvriendjes.nl</a></p>
                    
                    <p style="margin-top: 20px;">
                        Droomvriendjes 🧸<br>
                        <span style="font-size: 12px;">Slaapknuffels voor een betere nachtrust</span>
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        JE PAKKET IS ONDERWEG!
        
        Beste {customer_name},
        
        Goed nieuws! Je bestelling #{order_id} is verzonden.
        
        Track & Trace Code: {tracking_code}
        Verzonden via: {carrier_name}
        
        Volg je pakket: {tracking_url}
        
        Je pakket wordt meestal binnen 1-2 werkdagen bezorgd.
        
        Vragen? Mail naar info@droomvriendjes.nl
        
        Droomvriendjes
        """
        
        return send_email(customer_email, subject, html_content, text_content)
        
    except Exception as e:
        logger.error(f"Failed to send tracking email: {str(e)}")
        return False


# ============== SENDCLOUD API INTEGRATION ==============

def get_sendcloud_auth():
    """Get Sendcloud Basic Auth header"""
    if not SENDCLOUD_PUBLIC_KEY or not SENDCLOUD_SECRET_KEY:
        return None
    credentials = f"{SENDCLOUD_PUBLIC_KEY}:{SENDCLOUD_SECRET_KEY}"
    encoded = base64.b64encode(credentials.encode()).decode()
    return f"Basic {encoded}"


@api_router.get("/sendcloud/shipping-methods")
async def get_sendcloud_shipping_methods():
    """Get available shipping methods from Sendcloud"""
    try:
        auth = get_sendcloud_auth()
        if not auth:
            raise HTTPException(status_code=500, detail="Sendcloud niet geconfigureerd")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SENDCLOUD_API_URL}/shipping_methods",
                headers={"Authorization": auth}
            )
            
            if response.status_code == 200:
                data = response.json()
                methods = []
                for method in data.get("shipping_methods", []):
                    methods.append({
                        "id": method.get("id"),
                        "name": method.get("name"),
                        "carrier": method.get("carrier"),
                        "min_weight": method.get("min_weight"),
                        "max_weight": method.get("max_weight"),
                        "countries": [c.get("iso_2") for c in method.get("countries", [])]
                    })
                return {"shipping_methods": methods}
            else:
                logger.error(f"Sendcloud API error: {response.status_code} - {response.text}")
                raise HTTPException(status_code=response.status_code, detail="Sendcloud API fout")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Sendcloud shipping methods error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


class SendcloudParcelCreate(BaseModel):
    order_id: str
    shipping_method_id: int
    weight: float = 0.5  # Default weight in kg
    request_label: bool = True


@api_router.post("/sendcloud/create-parcel")
async def create_sendcloud_parcel(data: SendcloudParcelCreate):
    """Create a parcel/shipment in Sendcloud for an order"""
    try:
        auth = get_sendcloud_auth()
        if not auth:
            raise HTTPException(status_code=500, detail="Sendcloud niet geconfigureerd")
        
        # Get order details
        order = await db.orders.find_one({"_id": ObjectId(data.order_id)})
        if not order:
            raise HTTPException(status_code=404, detail="Bestelling niet gevonden")
        
        # Parse customer address
        address_parts = (order.get("customer_address") or "").split()
        house_number = ""
        street = order.get("customer_address", "")
        
        # Try to extract house number from end of address
        if address_parts:
            last_part = address_parts[-1]
            if any(c.isdigit() for c in last_part):
                house_number = last_part
                street = " ".join(address_parts[:-1])
        
        # Prepare parcel data for Sendcloud
        parcel_data = {
            "parcel": {
                "name": order.get("customer_name", "Klant"),
                "company_name": "",
                "address": street or "Adres onbekend",
                "house_number": house_number or "1",
                "city": order.get("customer_city", ""),
                "postal_code": order.get("customer_zipcode", ""),
                "country": "NL",  # Default to Netherlands
                "email": order.get("customer_email", ""),
                "telephone": order.get("customer_phone", ""),
                "order_number": str(order["_id"])[-8:].upper(),
                "weight": str(int(data.weight * 1000)),  # Convert kg to grams
                "shipment": {
                    "id": data.shipping_method_id
                },
                "request_label": data.request_label
            }
        }
        
        logger.info(f"Creating Sendcloud parcel for order {data.order_id}")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SENDCLOUD_API_URL}/parcels",
                headers={
                    "Authorization": auth,
                    "Content-Type": "application/json"
                },
                json=parcel_data
            )
            
            if response.status_code in [200, 201]:
                result = response.json()
                parcel = result.get("parcel", {})
                
                tracking_number = parcel.get("tracking_number", "")
                tracking_url = parcel.get("tracking_url", "")
                carrier = parcel.get("carrier", {}).get("code", "sendcloud")
                label_url = None
                
                # Get label URL if available
                if parcel.get("label"):
                    label_url = parcel["label"].get("normal_printer", [None])[0]
                
                # Update order with tracking info
                await db.orders.update_one(
                    {"_id": ObjectId(data.order_id)},
                    {"$set": {
                        "tracking_code": tracking_number,
                        "tracking_url": tracking_url,
                        "carrier": carrier,
                        "sendcloud_parcel_id": parcel.get("id"),
                        "label_url": label_url,
                        "status": "shipped",
                        "shipped_at": datetime.now(timezone.utc).isoformat(),
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                
                # Send tracking email to customer
                if tracking_number:
                    send_tracking_email(order, tracking_number, carrier)
                
                logger.info(f"Sendcloud parcel created: {parcel.get('id')} - Tracking: {tracking_number}")
                
                return {
                    "success": True,
                    "parcel_id": parcel.get("id"),
                    "tracking_number": tracking_number,
                    "tracking_url": tracking_url,
                    "label_url": label_url,
                    "carrier": carrier
                }
            else:
                error_msg = response.json() if response.text else response.status_code
                logger.error(f"Sendcloud create parcel error: {error_msg}")
                raise HTTPException(status_code=response.status_code, detail=f"Sendcloud fout: {error_msg}")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create Sendcloud parcel error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/sendcloud/parcel/{parcel_id}")
async def get_sendcloud_parcel(parcel_id: int):
    """Get parcel details from Sendcloud"""
    try:
        auth = get_sendcloud_auth()
        if not auth:
            raise HTTPException(status_code=500, detail="Sendcloud niet geconfigureerd")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SENDCLOUD_API_URL}/parcels/{parcel_id}",
                headers={"Authorization": auth}
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(status_code=response.status_code, detail="Parcel niet gevonden")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get Sendcloud parcel error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/sendcloud/label/{parcel_id}")
async def get_sendcloud_label(parcel_id: int):
    """Get shipping label URL from Sendcloud"""
    try:
        auth = get_sendcloud_auth()
        if not auth:
            raise HTTPException(status_code=500, detail="Sendcloud niet geconfigureerd")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SENDCLOUD_API_URL}/labels/{parcel_id}",
                headers={"Authorization": auth}
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(status_code=response.status_code, detail="Label niet gevonden")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get Sendcloud label error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/payment-methods")
async def get_payment_methods():
    """Get available payment methods from Mollie"""
    try:
        mollie_client = get_mollie_client()
        methods = mollie_client.methods.list()
        
        result_methods = []
        for m in methods:
            # Handle image attribute safely
            image_url = ""
            if hasattr(m, 'image') and m.image:
                if isinstance(m.image, dict):
                    image_url = m.image.get("svg", m.image.get("size2x", ""))
                elif hasattr(m.image, 'svg'):
                    image_url = m.image.svg
            
            result_methods.append({
                "id": m.id, 
                "description": m.description, 
                "image": image_url
            })
        
        return {"methods": result_methods}
    except Exception as e:
        logger.error(f"Get payment methods error: {str(e)}")
        # Return default methods including Apple Pay if API fails
        return {
            "methods": [
                {"id": "ideal", "description": "iDEAL", "image": ""},
                {"id": "creditcard", "description": "Creditcard", "image": ""},
                {"id": "applepay", "description": "Apple Pay", "image": ""},
                {"id": "paypal", "description": "PayPal", "image": ""},
                {"id": "klarna", "description": "Klarna", "image": ""},
                {"id": "bancontact", "description": "Bancontact", "image": ""}
            ]
        }


@api_router.post("/test-email")
async def test_email(email: str = "info@droomvriendjes.nl"):
    """Test email sending (for debugging only)"""
    test_order = {
        "_id": "TEST123456",
        "customer_email": email,
        "customer_name": "Test Klant",
        "total_amount": 59.95,
        "items": [
            {"product_name": "Leeuw Slaapknuffel", "quantity": 1, "price": 59.95}
        ]
    }
    
    success = send_order_confirmation_email(test_order)
    
    if success:
        return {"status": "success", "message": f"Test email sent to {email}"}
    else:
        return {"status": "error", "message": "Failed to send test email"}


@api_router.get("/debug/env")
async def debug_env():
    """Debug endpoint to check environment configuration - REMOVE IN PRODUCTION"""
    mollie_key = os.environ.get('MOLLIE_API_KEY', '')
    return {
        "mollie_key_set": bool(mollie_key),
        "mollie_key_length": len(mollie_key) if mollie_key else 0,
        "mollie_key_prefix": mollie_key[:10] + "..." if mollie_key and len(mollie_key) > 10 else "NOT SET",
        "profile_id": os.environ.get('MOLLIE_PROFILE_ID', 'NOT SET'),
        "frontend_url": os.environ.get('FRONTEND_URL', 'NOT SET'),
        "api_url": os.environ.get('API_URL', 'NOT SET'),
        "env_file_exists": (ROOT_DIR / '.env').exists(),
        "db_name": os.environ.get('DB_NAME', 'NOT SET')
    }


# Feed products JSON endpoint (moet voor include_router)
@api_router.get("/feed/products")
async def get_feed_products():
    """Get all products formatted for Google Shopping feed (JSON)"""
    return {
        "merchant_center_id": MERCHANT_CENTER_ID,
        "shop_url": SHOP_URL,
        "products_count": len(PRODUCTS_DATA),
        "products": PRODUCTS_DATA,
        "feed_url": f"{SHOP_URL}/api/feed/google-shopping.xml"
    }


# ============== GOOGLE ADS API ENDPOINTS ==============

class CreateCampaignRequest(BaseModel):
    campaign_name: str
    daily_budget: float
    merchant_id: Optional[int] = None

@api_router.get("/google-ads/status")
async def google_ads_status():
    """Check Google Ads API configuration status"""
    from services.google_ads_service import google_ads_service, GOOGLE_ADS_CONFIG, CUSTOMER_ID, MERCHANT_CENTER_ID
    
    return {
        "configured": google_ads_service.is_configured,
        "has_refresh_token": bool(GOOGLE_ADS_CONFIG.get("refresh_token")),
        "customer_id": CUSTOMER_ID,
        "merchant_center_id": MERCHANT_CENTER_ID,
        "developer_token_set": bool(GOOGLE_ADS_CONFIG.get("developer_token")),
        "client_id_set": bool(GOOGLE_ADS_CONFIG.get("client_id")),
        "client_secret_set": bool(GOOGLE_ADS_CONFIG.get("client_secret")),
    }

# Store OAuth states for CSRF protection
oauth_states = {}

@api_router.get("/google-ads/oauth-url")
async def get_google_ads_oauth_url(request: Request):
    """Get OAuth authorization URL for Google Ads with CSRF protection"""
    from services.google_ads_service import google_ads_service
    import secrets
    
    # Use the request's origin for dynamic redirect URI
    origin = request.headers.get("origin") or request.headers.get("referer", "").rstrip("/")
    if origin:
        from urllib.parse import urlparse
        parsed = urlparse(origin)
        base_url = f"{parsed.scheme}://{parsed.netloc}"
    else:
        base_url = get_frontend_url()
    
    redirect_uri = f"{base_url}/admin/google-ads/callback"
    
    # Generate state for CSRF protection
    state = secrets.token_urlsafe(32)
    oauth_states[state] = {
        "redirect_uri": redirect_uri,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    try:
        result = google_ads_service.get_oauth_url(redirect_uri, state)
        return result
    except Exception as e:
        logger.error(f"Error generating OAuth URL: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class OAuthCallbackRequest(BaseModel):
    code: str
    state: str
    origin: Optional[str] = None


@api_router.post("/google-ads/oauth-callback")
async def google_ads_oauth_callback(request: OAuthCallbackRequest):
    """Exchange OAuth code for tokens with CSRF verification"""
    from services.google_ads_service import google_ads_service
    
    # Verify state for CSRF protection
    if request.state not in oauth_states:
        logger.warning(f"Invalid OAuth state received: {request.state}")
        raise HTTPException(status_code=400, detail="Invalid state - possible CSRF attack")
    
    stored_state = oauth_states.pop(request.state)  # Remove used state
    redirect_uri = stored_state["redirect_uri"]
    
    logger.info(f"OAuth callback - state verified, using redirect_uri: {redirect_uri}")
    
    try:
        tokens = google_ads_service.exchange_code_for_tokens(request.code, redirect_uri)
        
        # Store refresh token in database for future use
        await db.google_ads_tokens.update_one(
            {"type": "google_ads"},
            {"$set": {
                "refresh_token": tokens.get("refresh_token"),
                "access_token": tokens.get("access_token"),
                "token_expiry": tokens.get("expiry"),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )
        
        # Also update environment variable for immediate use
        os.environ["GOOGLE_ADS_REFRESH_TOKEN"] = tokens.get("refresh_token", "")
        
        return {
            "success": True, 
            "message": "Google Ads account succesvol verbonden!",
            "has_refresh_token": bool(tokens.get("refresh_token"))
        }
    except Exception as e:
        logger.error(f"OAuth callback error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/google-ads/campaigns")
async def get_google_ads_campaigns():
    """Get all Shopping campaigns from Google Ads"""
    from services.google_ads_service import google_ads_service
    
    try:
        campaigns = google_ads_service.get_shopping_campaigns()
        return {"campaigns": campaigns, "count": len(campaigns)}
    except Exception as e:
        logger.error(f"Error fetching campaigns: {e}")
        return {"campaigns": [], "count": 0, "error": str(e)}

@api_router.post("/google-ads/campaigns/create")
async def create_google_ads_campaign(request: CreateCampaignRequest):
    """Create a new Shopping campaign"""
    from services.google_ads_service import google_ads_service
    
    try:
        result = google_ads_service.create_shopping_campaign(
            campaign_name=request.campaign_name,
            daily_budget=request.daily_budget,
            merchant_id=request.merchant_id
        )
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result)
            
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating campaign: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/google-ads/account")
async def get_google_ads_account():
    """Get Google Ads account information"""
    from services.google_ads_service import google_ads_service
    
    try:
        account_info = google_ads_service.get_account_info()
        return account_info
    except Exception as e:
        logger.error(f"Error fetching account info: {e}")
        return {"error": str(e)}


class BulkCampaignRequest(BaseModel):
    campaigns: List[dict]


class PredefinedCampaignsRequest(BaseModel):
    campaign_ids: Optional[List[int]] = None  # If None, create all 20


# Predefined 20 Shopping Campaigns for Droomvriendjes
PREDEFINED_CAMPAIGNS = [
    # Performance Max (5)
    {"id": 1, "name": "PMAX - Slaapknuffels Algemeen", "type": "Performance Max", "dailyBudget": 25.00, "targetRoas": 400},
    {"id": 2, "name": "PMAX - Baby & Peuter", "type": "Performance Max", "dailyBudget": 20.00, "targetRoas": 350},
    {"id": 3, "name": "PMAX - Cadeau & Seizoen", "type": "Performance Max", "dailyBudget": 30.00, "targetRoas": 300},
    {"id": 4, "name": "PMAX - Premium Producten", "type": "Performance Max", "dailyBudget": 15.00, "targetRoas": 500},
    {"id": 5, "name": "PMAX - Retargeting Converters", "type": "Performance Max", "dailyBudget": 15.00, "targetRoas": 600},
    # Standard Shopping (5)
    {"id": 6, "name": "Shopping - Bestsellers", "type": "Standard Shopping", "dailyBudget": 20.00, "targetRoas": 450},
    {"id": 7, "name": "Shopping - Nieuwe Producten", "type": "Standard Shopping", "dailyBudget": 10.00, "targetRoas": None},
    {"id": 8, "name": "Shopping - Budget Vriendelijk", "type": "Standard Shopping", "dailyBudget": 12.00, "targetRoas": 350},
    {"id": 9, "name": "Shopping - België Focus", "type": "Standard Shopping", "dailyBudget": 15.00, "targetRoas": 380},
    {"id": 10, "name": "Shopping - Bundels & Sets", "type": "Standard Shopping", "dailyBudget": 18.00, "targetRoas": 420},
    # Demand Gen (5)
    {"id": 11, "name": "Demand Gen - Slaapproblemen", "type": "Demand Gen", "dailyBudget": 15.00, "targetCpa": 12.00},
    {"id": 12, "name": "Demand Gen - Emotioneel Verhaal", "type": "Demand Gen", "dailyBudget": 12.00, "targetCpa": 15.00},
    {"id": 13, "name": "Demand Gen - YouTube Discovery", "type": "Demand Gen", "dailyBudget": 20.00, "targetRoas": None},
    {"id": 14, "name": "Demand Gen - Gmail Ads", "type": "Demand Gen", "dailyBudget": 8.00, "targetCpa": 10.00},
    {"id": 15, "name": "Demand Gen - Discover Feed", "type": "Demand Gen", "dailyBudget": 10.00, "targetRoas": None},
    # Search/SEA (5)
    {"id": 16, "name": "Search - Brand Terms", "type": "Search", "dailyBudget": 5.00, "targetRoas": None, 
     "keywords": {"exact": ["droomvriendjes", "droomvriendje"]},
     "adCopy": {"headlines": ["Droomvriendjes® Officiële Shop", "Gratis Verzending", "4.9★ Trustpilot"], 
                "descriptions": ["Slaapknuffels met Nachtlampje & White Noise. 10.000+ Tevreden Klanten."]}},
    {"id": 17, "name": "Search - High Intent Keywords", "type": "Search", "dailyBudget": 25.00, "targetRoas": 400,
     "keywords": {"exact": ["slaapknuffel kopen", "knuffel nachtlampje kopen"]},
     "adCopy": {"headlines": ["Slaapknuffel Met Nachtlampje", "Nu €49,95", "Morgen in Huis"],
                "descriptions": ["86% Slaapt Beter. Gratis Verzending. 14 Dagen Retour."]}},
    {"id": 18, "name": "Search - Problem-Aware Keywords", "type": "Search", "dailyBudget": 20.00, "targetRoas": None,
     "keywords": {"broad": ["kind slaapt niet door", "baby huilt nachts"]},
     "adCopy": {"headlines": ["Kind Slaapt Niet Door?", "De Oplossing: Droomvriendjes"],
                "descriptions": ["Slaapknuffels met Rustgevend Licht & Geluid. Probeer Risico-Vrij!"]}},
    {"id": 19, "name": "Search - Competitor Keywords", "type": "Search", "dailyBudget": 15.00, "targetCpa": 15.00,
     "keywords": {"broad": ["cloud b knuffel", "skip hop nachtlamp"]},
     "adCopy": {"headlines": ["Premium Alternatief", "Vergelijk & Bespaar"],
                "descriptions": ["Betere Reviews, Betere Prijs. Gratis Verzending."]}},
    {"id": 20, "name": "Search - Gift Keywords", "type": "Search", "dailyBudget": 18.00, "targetRoas": 350,
     "keywords": {"exact": ["kraamcadeau origineel", "cadeau babyshower"]},
     "adCopy": {"headlines": ["Het Perfecte Kraamcadeau", "Origineel & Praktisch"],
                "descriptions": ["Geef Een Droomvriendje! Gratis Cadeauverpakking."]}},
]


@api_router.post("/google-ads/campaigns/bulk-create")
async def bulk_create_campaigns(request: BulkCampaignRequest):
    """Create multiple campaigns at once"""
    from services.google_ads_service import google_ads_service
    
    try:
        result = google_ads_service.create_bulk_campaigns(request.campaigns)
        return result
    except Exception as e:
        logger.error(f"Error in bulk campaign creation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/google-ads/campaigns/create-predefined")
async def create_predefined_campaigns(request: PredefinedCampaignsRequest = None):
    """Create predefined Droomvriendjes campaigns (all 20 or selected by ID)"""
    from services.google_ads_service import google_ads_service
    
    try:
        # Select campaigns to create
        if request and request.campaign_ids:
            campaigns_to_create = [c for c in PREDEFINED_CAMPAIGNS if c["id"] in request.campaign_ids]
        else:
            campaigns_to_create = PREDEFINED_CAMPAIGNS
        
        if not campaigns_to_create:
            return {"error": "Geen campagnes gevonden om aan te maken", "created": [], "failed": []}
        
        result = google_ads_service.create_bulk_campaigns(campaigns_to_create)
        return result
    except Exception as e:
        logger.error(f"Error creating predefined campaigns: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/google-ads/campaigns/predefined")
async def get_predefined_campaigns():
    """Get list of all predefined campaigns that can be created"""
    total_budget = sum(c["dailyBudget"] for c in PREDEFINED_CAMPAIGNS)
    
    by_type = {}
    for c in PREDEFINED_CAMPAIGNS:
        campaign_type = c["type"]
        if campaign_type not in by_type:
            by_type[campaign_type] = {"count": 0, "budget": 0}
        by_type[campaign_type]["count"] += 1
        by_type[campaign_type]["budget"] += c["dailyBudget"]
    
    return {
        "campaigns": PREDEFINED_CAMPAIGNS,
        "total_count": len(PREDEFINED_CAMPAIGNS),
        "total_daily_budget": total_budget,
        "by_type": by_type
    }


# ============== QR CODE & OFFLINE MARKETING TRACKING ==============

class QRScanTrackingData(BaseModel):
    channel: str
    code: Optional[str] = None
    timestamp: Optional[str] = None
    referrer: Optional[str] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None


@api_router.post("/tracking/qr-scan")
async def track_qr_scan(data: QRScanTrackingData):
    """Track QR code scans for offline marketing campaigns"""
    try:
        tracking_data = {
            "channel": data.channel,
            "discount_code": data.code,
            "scanned_at": data.timestamp or datetime.now(timezone.utc).isoformat(),
            "referrer": data.referrer,
            "utm_source": data.utm_source,
            "utm_medium": data.utm_medium,
            "utm_campaign": data.utm_campaign,
            "converted": False
        }
        
        await db.qr_scans.insert_one(tracking_data)
        
        # Update channel stats
        await db.offline_campaign_stats.update_one(
            {"channel": data.channel},
            {
                "$inc": {"scans": 1},
                "$set": {"last_scan": datetime.now(timezone.utc).isoformat()}
            },
            upsert=True
        )
        
        return {"status": "tracked"}
    except Exception as e:
        logger.error(f"Error tracking QR scan: {e}")
        return {"status": "error"}


class SeoVisitData(BaseModel):
    keyword: str
    page_title: Optional[str] = None
    timestamp: Optional[str] = None


@api_router.post("/tracking/seo-visit")
async def track_seo_visit(data: SeoVisitData):
    """Track SEO landing page visits"""
    try:
        await db.seo_visits.insert_one({
            "keyword": data.keyword,
            "page_title": data.page_title,
            "visited_at": data.timestamp or datetime.now(timezone.utc).isoformat()
        })
        
        # Update keyword stats
        await db.seo_keyword_stats.update_one(
            {"keyword": data.keyword},
            {
                "$inc": {"visits": 1},
                "$set": {"last_visit": datetime.now(timezone.utc).isoformat()}
            },
            upsert=True
        )
        
        return {"status": "tracked"}
    except Exception as e:
        logger.error(f"Error tracking SEO visit: {e}")
        return {"status": "error"}


@api_router.get("/tracking/offline-stats")
async def get_offline_marketing_stats():
    """Get statistics for offline marketing campaigns"""
    try:
        # Get scan stats per channel
        pipeline = [
            {"$group": {
                "_id": "$channel",
                "total_scans": {"$sum": 1},
                "last_scan": {"$max": "$scanned_at"}
            }},
            {"$sort": {"total_scans": -1}}
        ]
        
        scan_stats = await db.qr_scans.aggregate(pipeline).to_list(100)
        
        # Get discount code usage
        discount_pipeline = [
            {"$match": {"channel": {"$exists": True}}},
            {"$group": {
                "_id": "$code",
                "uses": {"$first": "$uses"},
                "channel": {"$first": "$channel"},
                "value": {"$first": "$value"},
                "type": {"$first": "$type"}
            }}
        ]
        
        discount_stats = await db.discounts.aggregate(discount_pipeline).to_list(100)
        
        # Calculate totals
        total_scans = sum(s["total_scans"] for s in scan_stats)
        
        return {
            "total_scans": total_scans,
            "by_channel": {s["_id"]: {"scans": s["total_scans"], "last_scan": s.get("last_scan")} for s in scan_stats},
            "discount_codes": discount_stats,
            "summary": {
                "channels_active": len(scan_stats),
                "codes_active": len([d for d in discount_stats if d.get("uses", 0) > 0])
            }
        }
    except Exception as e:
        logger.error(f"Error getting offline stats: {e}")
        return {"error": str(e)}


# ============== MERCHANT CENTER SFTP UPLOAD ==============

@api_router.post("/feed/upload-to-merchant-center")
async def upload_feed_to_merchant_center():
    """Upload product feed to Google Merchant Center via SFTP"""
    import paramiko
    import io
    
    # SFTP credentials from environment
    sftp_server = os.environ.get("MERCHANT_SFTP_SERVER", "partnerupload.google.com")
    sftp_port = int(os.environ.get("MERCHANT_SFTP_PORT", "19321"))
    sftp_username = os.environ.get("MERCHANT_SFTP_USERNAME", "")
    sftp_password = os.environ.get("MERCHANT_SFTP_PASSWORD", "")
    
    if not sftp_username or not sftp_password:
        raise HTTPException(status_code=500, detail="SFTP credentials niet geconfigureerd")
    
    # Generate XML feed content
    xml_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Droomvriendjes - Slaapknuffels met Nachtlampje</title>
    <link>{SHOP_URL}</link>
    <description>Ontdek onze slaapknuffels met sterrenprojector en rustgevende geluiden.</description>
'''
    
    for product in PRODUCTS_DATA:
        xml_content += f'''
    <item>
      <g:id>{product["id"]}</g:id>
      <g:title><![CDATA[{product["title"]}]]></g:title>
      <g:description><![CDATA[{product["description"]}]]></g:description>
      <g:link>{SHOP_URL}{product["link"]}</g:link>
      <g:image_link>{product["image_link"]}</g:image_link>
      <g:availability>{product["availability"]}</g:availability>
      <g:price>{product["price"]}</g:price>
      <g:brand>{product["brand"]}</g:brand>
      <g:condition>{product["condition"]}</g:condition>
      <g:google_product_category>{product["google_product_category"]}</g:google_product_category>
      <g:product_type><![CDATA[{product["product_type"]}]]></g:product_type>
      <g:identifier_exists>{product["identifier_exists"]}</g:identifier_exists>
      <g:age_group>{product["age_group"]}</g:age_group>
      <g:color>{product["color"]}</g:color>
      <g:material>{product["material"]}</g:material>
      <g:shipping>
        <g:country>NL</g:country>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>BE</g:country>
        <g:price>4.95 EUR</g:price>
      </g:shipping>
    </item>
'''
    
    xml_content += '''  </channel>
</rss>'''
    
    try:
        # Connect to SFTP
        transport = paramiko.Transport((sftp_server, sftp_port))
        transport.connect(username=sftp_username, password=sftp_password)
        sftp = paramiko.SFTPClient.from_transport(transport)
        
        # Upload the file
        file_obj = io.BytesIO(xml_content.encode('utf-8'))
        remote_path = "/droomvriendjes_products.xml"
        sftp.putfo(file_obj, remote_path)
        
        # Close connections
        sftp.close()
        transport.close()
        
        logger.info(f"Product feed uploaded to Merchant Center: {remote_path}")
        
        return {
            "success": True,
            "message": "Product feed succesvol geüpload naar Google Merchant Center!",
            "file": remote_path,
            "products_count": len(PRODUCTS_DATA)
        }
        
    except Exception as e:
        logger.error(f"SFTP upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload mislukt: {str(e)}")


# ============== EMAIL MARKETING API ==============

from services.email_service import EmailService, EMAIL_TEMPLATES

# Initialize email service (will be set on startup)
email_service = None

# Pydantic models for email API
class AbandonedCartCreate(BaseModel):
    email: str
    name: Optional[str] = ""
    items: List[dict] = []
    total: float = 0
class CheckoutTrackRequest(BaseModel):
    """Request model for tracking checkout sessions"""
    email: str
    name: Optional[str] = ""
    items: List[dict] = []
    total: float = 0

class ManualEmailSend(BaseModel):
    template_id: str
    recipient_email: str
    recipient_name: Optional[str] = ""
    variables: Optional[dict] = {}

class SubscriberCreate(BaseModel):
    email: str
    name: Optional[str] = ""

@api_router.get("/email/stats")
async def get_email_stats(days: int = 30):
    """Get email marketing statistics"""
    global email_service
    if email_service is None:
        email_service = EmailService(db)
    stats = await email_service.get_email_stats(days)
    return stats

@api_router.get("/email/templates")
async def get_email_templates():
    """Get all email templates"""
    global email_service
    if email_service is None:
        email_service = EmailService(db)
    templates = await email_service.get_templates()
    return {"templates": templates}

@api_router.get("/email/abandoned-carts")
async def get_abandoned_carts(status: Optional[str] = None, limit: int = 100):
    """Get abandoned carts"""
    global email_service
    if email_service is None:
        email_service = EmailService(db)
    carts = await email_service.get_abandoned_carts(status, limit)
    return {"carts": carts}

@api_router.post("/email/abandoned-cart")
async def create_abandoned_cart(cart: AbandonedCartCreate):
    """Create an abandoned cart record"""
    global email_service
    if email_service is None:
        email_service = EmailService(db)
    cart_id = await email_service.create_abandoned_cart(cart.model_dump())
    return {"cart_id": cart_id, "status": "created"}

@api_router.post("/email/abandoned-cart/{cart_id}/start-flow")
async def start_abandoned_cart_flow(cart_id: str):
    """Start the abandoned cart email flow"""
    global email_service
    if email_service is None:
        email_service = EmailService(db)
    success = await email_service.start_abandoned_cart_flow(cart_id)
    if success:
        return {"status": "flow_started", "cart_id": cart_id}
    raise HTTPException(status_code=400, detail="Could not start flow - cart not found or already recovered")

@api_router.post("/email/track-checkout")
async def track_checkout_session(checkout_data: CheckoutTrackRequest):
    """
    Track a checkout session for abandoned cart recovery.
    Call this when a customer enters their email on the checkout page.
    Automatically schedules the abandoned cart email flow to start after 1 hour.
    """
    global email_service
    if email_service is None:
        email_service = EmailService(db)
    result = await email_service.track_checkout_session(checkout_data.model_dump())
    return result

@api_router.post("/email/process-scheduled-carts")
async def process_scheduled_abandoned_carts():
    """
    Process abandoned carts that have passed their scheduled flow time.
    This will automatically start the email flow for carts that have been
    abandoned for more than 1 hour.
    """
    global email_service
    if email_service is None:
        email_service = EmailService(db)
    flows_started = await email_service.process_scheduled_abandoned_carts()
    return {"status": "processed", "flows_started": flows_started}

@api_router.post("/email/subscribe")
async def subscribe_email(subscriber: SubscriberCreate):
    """Subscribe to newsletter and start welcome flow"""
    global email_service
    if email_service is None:
        email_service = EmailService(db)
    success = await email_service.start_welcome_flow(subscriber.email, subscriber.name)
    if success:
        return {"status": "subscribed", "email": subscriber.email}
    return {"status": "already_subscribed", "email": subscriber.email}

@api_router.post("/email/send")
async def send_manual_email(email_data: ManualEmailSend):
    """Send a manual email"""
    global email_service
    if email_service is None:
        email_service = EmailService(db)
    success = await email_service.send_manual_email(
        template_id=email_data.template_id,
        recipient_email=email_data.recipient_email,
        recipient_name=email_data.recipient_name,
        variables=email_data.variables
    )
    if success:
        return {"status": "sent", "recipient": email_data.recipient_email}
    raise HTTPException(status_code=500, detail="Failed to send email")

@api_router.post("/email/process-queue")
async def process_email_queue():
    """Process the email queue (send pending emails)"""
    global email_service
    if email_service is None:
        email_service = EmailService(db)
    sent_count = await email_service.process_email_queue()
    return {"status": "processed", "emails_sent": sent_count}

@api_router.get("/email/queue")
async def get_email_queue(status: Optional[str] = None, limit: int = 100):
    """Get emails in the queue"""
    query = {}
    if status:
        query["status"] = status
    
    emails = await db.email_queue.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {"emails": emails}

@api_router.get("/email/track/open/{email_id}")
async def track_email_open(email_id: str):
    """Track email open (via tracking pixel)"""
    global email_service
    if email_service is None:
        email_service = EmailService(db)
    await email_service.track_email_open(email_id)
    # Return 1x1 transparent GIF
    gif_data = base64.b64decode("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7")
    return Response(content=gif_data, media_type="image/gif")

@api_router.get("/email/track/click/{email_id}")
async def track_email_click(email_id: str, url: str = ""):
    """Track email click and redirect"""
    global email_service
    if email_service is None:
        email_service = EmailService(db)
    await email_service.track_email_click(email_id, url)
    from fastapi.responses import RedirectResponse
    redirect_url = url if url else os.environ.get('FRONTEND_URL', 'https://droomvriendjes.nl')
    return RedirectResponse(url=redirect_url)

@api_router.get("/email/subscribers")
async def get_subscribers(limit: int = 100):
    """Get email subscribers"""
    subscribers = await db.email_subscribers.find(
        {},
        {"_id": 0}
    ).sort("subscribed_at", -1).limit(limit).to_list(limit)
    
    total = await db.email_subscribers.count_documents({})
    active = await db.email_subscribers.count_documents({"status": "active"})
    
    return {
        "subscribers": subscribers,
        "total": total,
        "active": active
    }

@api_router.post("/email/start-post-purchase/{order_id}")
async def start_post_purchase_flow(order_id: str):
    """Start post-purchase email flow for an order"""
    global email_service
    if email_service is None:
        email_service = EmailService(db)
    
    order = await db.orders.find_one({"order_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    success = await email_service.start_post_purchase_flow(order)
    if success:
        return {"status": "flow_started", "order_id": order_id}
    raise HTTPException(status_code=500, detail="Failed to start flow")


# Include the router in the main app
app.include_router(api_router)

# ============== GOOGLE SHOPPING XML FEED ==============

from fastapi.responses import Response

@app.get("/api/feed/google-shopping.xml")
async def google_shopping_feed():
    """Generate Google Shopping Product Feed in XML format"""
    
    xml_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Droomvriendjes - Slaapknuffels met Nachtlampje</title>
    <link>{SHOP_URL}</link>
    <description>Ontdek onze slaapknuffels met sterrenprojector en rustgevende geluiden. Gratis verzending en 14 dagen retour.</description>
'''
    
    for product in PRODUCTS_DATA:
        xml_content += f'''
    <item>
      <g:id>{product["id"]}</g:id>
      <g:title><![CDATA[{product["title"]}]]></g:title>
      <g:description><![CDATA[{product["description"]}]]></g:description>
      <g:link>{SHOP_URL}{product["link"]}</g:link>
      <g:image_link>{product["image_link"]}</g:image_link>
'''
        # Additional images
        for img in product.get("additional_image_links", []):
            xml_content += f'''      <g:additional_image_link>{img}</g:additional_image_link>
'''
        
        xml_content += f'''      <g:availability>{product["availability"]}</g:availability>
      <g:price>{product["price"]}</g:price>
'''
        if "sale_price" in product:
            xml_content += f'''      <g:sale_price>{product["sale_price"]}</g:sale_price>
'''
        
        xml_content += f'''      <g:brand>{product["brand"]}</g:brand>
      <g:condition>{product["condition"]}</g:condition>
      <g:google_product_category>{product["google_product_category"]}</g:google_product_category>
      <g:product_type><![CDATA[{product["product_type"]}]]></g:product_type>
      <g:identifier_exists>{product["identifier_exists"]}</g:identifier_exists>
      <g:age_group>{product["age_group"]}</g:age_group>
      <g:color>{product["color"]}</g:color>
      <g:material>{product["material"]}</g:material>
      <g:shipping>
        <g:country>NL</g:country>
        <g:service>Gratis Verzending</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>BE</g:country>
        <g:service>Standaard Verzending</g:service>
        <g:price>4.95 EUR</g:price>
      </g:shipping>
      <g:shipping_weight>{product["shipping_weight"]}</g:shipping_weight>
      <g:return_policy_label>14_dagen_retour</g:return_policy_label>
    </item>
'''
    
    xml_content += '''  </channel>
</rss>'''
    
    return Response(content=xml_content, media_type="application/xml")


# ============== EMAIL MARKETING API ==============

from services.email_service import EmailService, EMAIL_TEMPLATES

# Initialize email service
email_service = None

# Background task for processing scheduled abandoned carts
abandoned_cart_scheduler_task = None

async def abandoned_cart_scheduler():
    """
    Background task that runs every 15 minutes to process scheduled abandoned carts.
    This automatically starts the email flow for carts that have been abandoned for 1+ hour.
    """
    global email_service
    logger.info("🚀 Abandoned cart scheduler started - will check every 15 minutes")
    
    while True:
        try:
            # Wait 15 minutes between checks
            await asyncio.sleep(15 * 60)  # 15 minutes
            
            if email_service:
                flows_started = await email_service.process_scheduled_abandoned_carts()
                if flows_started > 0:
                    logger.info(f"📧 Abandoned cart scheduler: Started {flows_started} email flow(s)")
                else:
                    logger.debug("📧 Abandoned cart scheduler: No carts to process")
            else:
                logger.warning("⚠️ Email service not available for abandoned cart processing")
                
        except asyncio.CancelledError:
            logger.info("🛑 Abandoned cart scheduler stopped")
            break
        except Exception as e:
            logger.error(f"❌ Abandoned cart scheduler error: {str(e)}")
            # Continue running even after errors
            await asyncio.sleep(60)  # Wait 1 minute before retrying after error


# ============== EMAIL CAMPAIGN 15% KORTING ==============

class EmailCampaignStats(BaseModel):
    total_contacts: int
    pending: int
    sent: int
    failed: int
    sources: dict

class EmailCampaignSendRequest(BaseModel):
    batch_size: int = 50  # Number of emails to send per batch
    delay_seconds: float = 1.0  # Delay between emails to avoid rate limiting

@app.get("/api/admin/email-campaign/stats")
async def get_email_campaign_stats():
    """Get statistics for the 15% discount email campaign"""
    try:
        collection = db['email_campaign_15_percent']
        
        total = await collection.count_documents({})
        pending = await collection.count_documents({"status": "pending"})
        sent = await collection.count_documents({"status": "sent"})
        failed = await collection.count_documents({"status": "failed"})
        
        # Count by source
        pipeline = [
            {"$group": {"_id": "$source", "count": {"$sum": 1}}}
        ]
        sources_cursor = collection.aggregate(pipeline)
        sources = {}
        async for doc in sources_cursor:
            sources[doc["_id"]] = doc["count"]
        
        return {
            "success": True,
            "stats": {
                "total_contacts": total,
                "pending": pending,
                "sent": sent,
                "failed": failed,
                "sources": sources
            }
        }
    except Exception as e:
        logger.error(f"Error getting campaign stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


def create_15_percent_email_html(firstname: str, gender: str = "") -> str:
    """Create beautiful HTML email for 15% discount campaign"""
    
    # Personalized greeting
    if firstname:
        greeting = f"Beste {firstname},"
    else:
        greeting = "Beste,"
    
    return f'''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #F6F1EB;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        
        <!-- Header -->
        <div style="background-color: #A26A49; padding: 30px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🧸 Droomvriendjes</h1>
            <p style="color: #F6F1EB; margin: 10px 0 0 0; font-size: 14px;">Betere nachten voor het hele gezin</p>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px 30px;">
            <p style="font-size: 18px; color: #333; margin-bottom: 20px;">{greeting}</p>
            
            <h2 style="color: #A26A49; font-size: 24px; margin-bottom: 15px;">
                🎁 Exclusief voor jou: 15% KORTING!
            </h2>
            
            <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
                Ken je dat? Je kind dat maar niet in slaap valt, overprikkeld is, of bang in het donker? 
                Onze Droomvriendjes helpen meer dan <strong>10.000+ gezinnen</strong> aan betere nachten!
            </p>
            
            <div style="background-color: #FFF8F3; border: 2px dashed #A26A49; border-radius: 10px; padding: 20px; text-align: center; margin: 30px 0;">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Jouw exclusieve kortingscode:</p>
                <p style="margin: 0; font-size: 32px; font-weight: bold; color: #A26A49; letter-spacing: 3px;">WELKOM15</p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #888;">Geldig op je gehele bestelling</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://droomvriendjes.nl/knuffels" 
                   style="display: inline-block; background-color: #A26A49; color: #ffffff; padding: 16px 40px; font-size: 18px; font-weight: bold; text-decoration: none; border-radius: 8px;">
                    Shop Nu met 15% Korting →
                </a>
            </div>
            
            <!-- Features -->
            <div style="margin: 30px 0; padding: 20px; background-color: #F6F1EB; border-radius: 10px;">
                <p style="font-weight: bold; color: #333; margin: 0 0 15px 0;">Waarom kiezen voor Droomvriendjes?</p>
                <p style="margin: 8px 0; color: #555;">✅ Rustgevende sterrenprojectie & muziek</p>
                <p style="margin: 8px 0; color: #555;">✅ 86% van de kinderen slaapt beter</p>
                <p style="margin: 8px 0; color: #555;">✅ Gratis verzending in heel Nederland</p>
                <p style="margin: 8px 0; color: #555;">✅ 14 dagen niet goed = geld terug</p>
            </div>
            
            <p style="font-size: 14px; color: #888; margin-top: 30px;">
                Liefs,<br>
                <strong style="color: #A26A49;">Team Droomvriendjes</strong>
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #3A271C; padding: 25px 20px; text-align: center;">
            <p style="color: #F6F1EB; margin: 0 0 10px 0; font-size: 14px;">
                Droomvriendjes | Schaesbergerweg 103, 6415 AD Heerlen
            </p>
            <p style="color: #888; margin: 0; font-size: 12px;">
                <a href="https://droomvriendjes.nl" style="color: #A26A49;">Website</a> | 
                <a href="mailto:info@droomvriendjes.nl" style="color: #A26A49;">Contact</a>
            </p>
            <p style="color: #666; margin: 15px 0 0 0; font-size: 11px;">
                Je ontvangt deze email omdat je interesse hebt getoond in producten voor een betere nachtrust.
            </p>
        </div>
        
    </div>
</body>
</html>
'''


def create_15_percent_email_text(firstname: str) -> str:
    """Create plain text version of the 15% discount email"""
    greeting = f"Beste {firstname}," if firstname else "Beste,"
    
    return f'''{greeting}

🎁 EXCLUSIEF VOOR JOU: 15% KORTING!

Ken je dat? Je kind dat maar niet in slaap valt, overprikkeld is, of bang in het donker?
Onze Droomvriendjes helpen meer dan 10.000+ gezinnen aan betere nachten!

━━━━━━━━━━━━━━━━━━━━━━━━━━━
JOUW KORTINGSCODE: WELKOM15
━━━━━━━━━━━━━━━━━━━━━━━━━━━

👉 Shop nu: https://droomvriendjes.nl/knuffels

Waarom kiezen voor Droomvriendjes?
✅ Rustgevende sterrenprojectie & muziek
✅ 86% van de kinderen slaapt beter
✅ Gratis verzending in heel Nederland
✅ 14 dagen niet goed = geld terug

Liefs,
Team Droomvriendjes

---
Droomvriendjes | Schaesbergerweg 103, 6415 AD Heerlen
info@droomvriendjes.nl | https://droomvriendjes.nl
'''


@app.post("/api/admin/email-campaign/send-batch")
async def send_email_campaign_batch(request: EmailCampaignSendRequest):
    """Send a batch of emails from the 15% discount campaign"""
    try:
        collection = db['email_campaign_15_percent']
        
        # Get pending emails
        pending_cursor = collection.find({"status": "pending"}).limit(request.batch_size)
        pending_list = await pending_cursor.to_list(length=request.batch_size)
        
        if not pending_list:
            return {
                "success": True,
                "message": "No pending emails to send",
                "sent": 0,
                "failed": 0
            }
        
        sent_count = 0
        failed_count = 0
        
        for contact in pending_list:
            try:
                email = contact['email']
                firstname = contact.get('firstname', '')
                gender = contact.get('gender', '')
                
                # Create email content
                html_content = create_15_percent_email_html(firstname, gender)
                text_content = create_15_percent_email_text(firstname)
                
                # Send email
                subject = "🎁 Exclusief voor jou: 15% korting op Droomvriendjes!"
                success = send_email(email, subject, html_content, text_content)
                
                if success:
                    # Update status to sent
                    await collection.update_one(
                        {"_id": contact["_id"]},
                        {"$set": {"status": "sent", "sent_at": datetime.now(timezone.utc)}}
                    )
                    sent_count += 1
                else:
                    # Update status to failed
                    await collection.update_one(
                        {"_id": contact["_id"]},
                        {"$set": {"status": "failed", "error": "SMTP error"}}
                    )
                    failed_count += 1
                
                # Delay between emails to avoid rate limiting
                await asyncio.sleep(request.delay_seconds)
                
            except Exception as e:
                logger.error(f"Error sending to {contact.get('email')}: {str(e)}")
                await collection.update_one(
                    {"_id": contact["_id"]},
                    {"$set": {"status": "failed", "error": str(e)}}
                )
                failed_count += 1
        
        # Get updated stats
        remaining = await collection.count_documents({"status": "pending"})
        
        return {
            "success": True,
            "message": f"Batch completed: {sent_count} sent, {failed_count} failed",
            "sent": sent_count,
            "failed": failed_count,
            "remaining": remaining
        }
        
    except Exception as e:
        logger.error(f"Error in email campaign batch: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/admin/email-campaign/reset-failed")
async def reset_failed_emails():
    """Reset failed emails back to pending status for retry"""
    try:
        collection = db['email_campaign_15_percent']
        
        result = await collection.update_many(
            {"status": "failed"},
            {"$set": {"status": "pending", "error": None}}
        )
        
        return {
            "success": True,
            "message": f"Reset {result.modified_count} failed emails to pending"
        }
    except Exception as e:
        logger.error(f"Error resetting failed emails: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/admin/email-campaign/monitor")
async def monitor_email_campaign():
    """
    Uitgebreide monitoring voor email campagne met bounce rates en error tracking
    """
    try:
        collection = db['email_campaign_15_percent']
        
        # Basis statistieken
        total = await collection.count_documents({})
        pending = await collection.count_documents({"status": "pending"})
        sent = await collection.count_documents({"status": "sent"})
        failed = await collection.count_documents({"status": "failed"})
        
        # Bereken percentages
        if total > 0:
            sent_percentage = round((sent / total) * 100, 2)
            failed_percentage = round((failed / total) * 100, 2)
            pending_percentage = round((pending / total) * 100, 2)
        else:
            sent_percentage = failed_percentage = pending_percentage = 0
        
        # Bounce rate (failed / (sent + failed))
        total_attempted = sent + failed
        bounce_rate = round((failed / total_attempted) * 100, 2) if total_attempted > 0 else 0
        
        # Success rate
        success_rate = round((sent / total_attempted) * 100, 2) if total_attempted > 0 else 0
        
        # Groepeer errors
        error_pipeline = [
            {"$match": {"status": "failed", "error": {"$exists": True}}},
            {"$group": {"_id": "$error", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        error_cursor = collection.aggregate(error_pipeline)
        error_breakdown = {}
        async for doc in error_cursor:
            if doc["_id"]:
                error_breakdown[doc["_id"][:50]] = doc["count"]
        
        # Recente failures (laatste 10)
        recent_failures_cursor = collection.find(
            {"status": "failed"}
        ).sort("_id", -1).limit(10)
        recent_failures = []
        async for doc in recent_failures_cursor:
            recent_failures.append({
                "email": doc.get("email", "")[:30] + "...",
                "error": doc.get("error", "Unknown")[:50],
                "source": doc.get("source", "")
            })
        
        # Statistieken per bron
        source_pipeline = [
            {"$group": {
                "_id": {"source": "$source", "status": "$status"},
                "count": {"$sum": 1}
            }}
        ]
        source_cursor = collection.aggregate(source_pipeline)
        source_stats = {}
        async for doc in source_cursor:
            source = doc["_id"]["source"]
            status = doc["_id"]["status"]
            if source not in source_stats:
                source_stats[source] = {"pending": 0, "sent": 0, "failed": 0}
            source_stats[source][status] = doc["count"]
        
        # Health status
        if bounce_rate > 10:
            health_status = "⚠️ WAARSCHUWING - Hoge bounce rate!"
            health_color = "red"
        elif bounce_rate > 5:
            health_status = "⚡ MATIG - Bounce rate verhoogd"
            health_color = "yellow"
        else:
            health_status = "✅ GOED - Normale bounce rate"
            health_color = "green"
        
        return {
            "success": True,
            "health": {
                "status": health_status,
                "color": health_color
            },
            "summary": {
                "total_contacts": total,
                "pending": pending,
                "sent": sent,
                "failed": failed
            },
            "rates": {
                "bounce_rate": f"{bounce_rate}%",
                "success_rate": f"{success_rate}%",
                "sent_percentage": f"{sent_percentage}%",
                "failed_percentage": f"{failed_percentage}%",
                "pending_percentage": f"{pending_percentage}%"
            },
            "progress": {
                "completed": sent + failed,
                "remaining": pending,
                "progress_percentage": f"{round(((sent + failed) / total) * 100, 2)}%" if total > 0 else "0%"
            },
            "error_breakdown": error_breakdown,
            "recent_failures": recent_failures,
            "source_stats": source_stats
        }
        
    except Exception as e:
        logger.error(f"Error monitoring campaign: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/admin/email-campaign/failed-emails")
async def get_failed_emails(skip: int = 0, limit: int = 50):
    """Get list of failed emails with error details"""
    try:
        collection = db['email_campaign_15_percent']
        
        cursor = collection.find({"status": "failed"}).skip(skip).limit(limit)
        failed_list = []
        async for doc in cursor:
            failed_list.append({
                "email": doc.get("email"),
                "firstname": doc.get("firstname"),
                "lastname": doc.get("lastname"),
                "source": doc.get("source"),
                "error": doc.get("error"),
                "created_at": doc.get("created_at").isoformat() if doc.get("created_at") else None
            })
        
        total_failed = await collection.count_documents({"status": "failed"})
        
        return {
            "success": True,
            "total_failed": total_failed,
            "showing": len(failed_list),
            "skip": skip,
            "limit": limit,
            "failed_emails": failed_list
        }
        
    except Exception as e:
        logger.error(f"Error getting failed emails: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/admin/email-campaign/test-send")
async def test_send_campaign_email(test_email: str):
    """Send a test email to verify SMTP settings"""
    try:
        html_content = create_15_percent_email_html("Test", "")
        text_content = create_15_percent_email_text("Test")
        subject = "🧪 TEST: 15% korting op Droomvriendjes!"
        
        success = send_email(test_email, subject, html_content, text_content)
        
        if success:
            return {
                "success": True,
                "message": f"Test email verzonden naar {test_email}"
            }
        else:
            return {
                "success": False,
                "message": "Email verzenden mislukt - controleer SMTP instellingen"
            }
            
    except Exception as e:
        logger.error(f"Test email error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/admin/email-campaign/preview")
async def preview_campaign_email():
    """Preview the 15% discount email template"""
    html = create_15_percent_email_html("Jan", "male")
    return Response(content=html, media_type="text/html")


@app.on_event("startup")
async def init_email_service():
    global email_service, abandoned_cart_scheduler_task
    email_service = EmailService(db)
    logger.info("✅ Email service initialized")
    
    # Start the abandoned cart scheduler as a background task
    abandoned_cart_scheduler_task = asyncio.create_task(abandoned_cart_scheduler())
    logger.info("✅ Abandoned cart scheduler task created")
    
    # Seed products and discount codes from routes
    await products_route.seed_products()
    await discount_codes_route.seed_discount_codes()
    logger.info("✅ Database seeding completed")

# Pydantic models for email API
class AbandonedCartCreate(BaseModel):
    email: str
    name: Optional[str] = ""
    items: List[dict] = []
    total: float = 0
class CheckoutTrackRequest(BaseModel):
    """Request model for tracking checkout sessions"""
    email: str
    name: Optional[str] = ""
    items: List[dict] = []
    total: float = 0

class ManualEmailSend(BaseModel):
    template_id: str
    recipient_email: str
    recipient_name: Optional[str] = ""
    variables: Optional[dict] = {}

class SubscriberCreate(BaseModel):
    email: str
    name: Optional[str] = ""

@api_router.get("/email/stats")
async def get_email_stats(days: int = 30):
    """Get email marketing statistics"""
    if not email_service:
        raise HTTPException(status_code=500, detail="Email service not initialized")
    stats = await email_service.get_email_stats(days)
    return stats

@api_router.get("/email/templates")
async def get_email_templates():
    """Get all email templates"""
    if not email_service:
        raise HTTPException(status_code=500, detail="Email service not initialized")
    templates = await email_service.get_templates()
    return {"templates": templates}

@api_router.get("/email/abandoned-carts")
async def get_abandoned_carts(status: Optional[str] = None, limit: int = 100):
    """Get abandoned carts"""
    if not email_service:
        raise HTTPException(status_code=500, detail="Email service not initialized")
    carts = await email_service.get_abandoned_carts(status, limit)
    return {"carts": carts}

@api_router.post("/email/abandoned-cart")
async def create_abandoned_cart(cart: AbandonedCartCreate):
    """Create an abandoned cart record"""
    if not email_service:
        raise HTTPException(status_code=500, detail="Email service not initialized")
    cart_id = await email_service.create_abandoned_cart(cart.model_dump())
    return {"cart_id": cart_id, "status": "created"}

@api_router.post("/email/abandoned-cart/{cart_id}/start-flow")
async def start_abandoned_cart_flow(cart_id: str):
    """Start the abandoned cart email flow"""
    if not email_service:
        raise HTTPException(status_code=500, detail="Email service not initialized")
    success = await email_service.start_abandoned_cart_flow(cart_id)
    if success:
        return {"status": "flow_started", "cart_id": cart_id}
    raise HTTPException(status_code=400, detail="Could not start flow - cart not found or already recovered")

@api_router.post("/email/subscribe")
async def subscribe_email(subscriber: SubscriberCreate):
    """Subscribe to newsletter and start welcome flow"""
    if not email_service:
        raise HTTPException(status_code=500, detail="Email service not initialized")
    success = await email_service.start_welcome_flow(subscriber.email, subscriber.name)
    if success:
        return {"status": "subscribed", "email": subscriber.email}
    return {"status": "already_subscribed", "email": subscriber.email}

@api_router.post("/email/send")
async def send_manual_email(email_data: ManualEmailSend):
    """Send a manual email"""
    if not email_service:
        raise HTTPException(status_code=500, detail="Email service not initialized")
    success = await email_service.send_manual_email(
        template_id=email_data.template_id,
        recipient_email=email_data.recipient_email,
        recipient_name=email_data.recipient_name,
        variables=email_data.variables
    )
    if success:
        return {"status": "sent", "recipient": email_data.recipient_email}
    raise HTTPException(status_code=500, detail="Failed to send email")

@api_router.post("/email/process-queue")
async def process_email_queue():
    """Process the email queue (send pending emails)"""
    if not email_service:
        raise HTTPException(status_code=500, detail="Email service not initialized")
    sent_count = await email_service.process_email_queue()
    return {"status": "processed", "emails_sent": sent_count}

@api_router.get("/email/queue")
async def get_email_queue(status: Optional[str] = None, limit: int = 100):
    """Get emails in the queue"""
    query = {}
    if status:
        query["status"] = status
    
    emails = await db.email_queue.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {"emails": emails}

@api_router.get("/email/track/open/{email_id}")
async def track_email_open(email_id: str):
    """Track email open (via tracking pixel)"""
    if email_service:
        await email_service.track_email_open(email_id)
    # Return 1x1 transparent GIF
    gif_data = base64.b64decode("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7")
    return Response(content=gif_data, media_type="image/gif")

@api_router.get("/email/track/click/{email_id}")
async def track_email_click(email_id: str, url: str = ""):
    """Track email click and redirect"""
    if email_service:
        await email_service.track_email_click(email_id, url)
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=url or FRONTEND_URL)

@api_router.get("/email/subscribers")
async def get_subscribers(limit: int = 100):
    """Get email subscribers"""
    subscribers = await db.email_subscribers.find(
        {},
        {"_id": 0}
    ).sort("subscribed_at", -1).limit(limit).to_list(limit)
    
    total = await db.email_subscribers.count_documents({})
    active = await db.email_subscribers.count_documents({"status": "active"})
    
    return {
        "subscribers": subscribers,
        "total": total,
        "active": active
    }

@api_router.post("/email/start-post-purchase/{order_id}")
async def start_post_purchase_flow(order_id: str):
    """Start post-purchase email flow for an order"""
    if not email_service:
        raise HTTPException(status_code=500, detail="Email service not initialized")
    
    order = await db.orders.find_one({"order_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    success = await email_service.start_post_purchase_flow(order)
    if success:
        return {"status": "flow_started", "order_id": order_id}
    raise HTTPException(status_code=500, detail="Failed to start flow")


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    global abandoned_cart_scheduler_task
    
    # Stop the abandoned cart scheduler
    if abandoned_cart_scheduler_task:
        abandoned_cart_scheduler_task.cancel()
        try:
            await abandoned_cart_scheduler_task
        except asyncio.CancelledError:
            pass
        logger.info("🛑 Abandoned cart scheduler stopped")
    
    client.close()
    logger.info("🛑 Database connection closed")
