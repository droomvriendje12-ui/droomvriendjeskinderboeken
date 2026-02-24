"""
Email Templates API Routes - Supabase PostgreSQL based
Custom email marketing templates with variables and cart links
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
import logging
import uuid
import json
import re

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/email-templates", tags=["email-templates"])

# Supabase client - will be set by main app
supabase = None

def set_supabase_client(client):
    """Set the Supabase client"""
    global supabase
    supabase = client
    logger.info("✅ Supabase client set for email templates route")


# Pydantic models
class EmailTemplateCreate(BaseModel):
    name: str
    subject: str
    content: str  # HTML content with {{variables}}
    description: Optional[str] = None
    category: str = "marketing"  # marketing, transactional, notification
    variables: Optional[List[str]] = None  # List of variables used: ["firstname", "product_name", etc.]
    cart_link: Optional[str] = None  # Pre-configured cart link
    active: bool = True


class EmailTemplateUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    content: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    variables: Optional[List[str]] = None
    cart_link: Optional[str] = None
    active: Optional[bool] = None


# Available variables for templates
AVAILABLE_VARIABLES = {
    "firstname": "Voornaam van de ontvanger",
    "lastname": "Achternaam van de ontvanger", 
    "email": "Email adres",
    "full_name": "Volledige naam",
    "product_name": "Productnaam",
    "product_price": "Productprijs",
    "product_image": "Product afbeelding URL",
    "discount_code": "Kortingscode",
    "discount_percentage": "Korting percentage",
    "cart_link": "Link naar winkelwagen",
    "shop_url": "Website URL",
    "unsubscribe_link": "Uitschrijf link",
}

# Pre-built cart link templates
CART_LINK_TEMPLATES = {
    "single_product": "https://droomvriendjes.nl/checkout?product={{product_id}}&quantity=1",
    "with_discount": "https://droomvriendjes.nl/checkout?product={{product_id}}&quantity=1&code={{discount_code}}",
    "bundle_deal": "https://droomvriendjes.nl/checkout?bundle=family&quantity=3",
    "custom": "https://droomvriendjes.nl/checkout?{{custom_params}}",
}


def extract_variables(content: str) -> List[str]:
    """Extract all {{variable}} from content"""
    pattern = r'\{\{(\w+)\}\}'
    matches = re.findall(pattern, content)
    return list(set(matches))


def format_template_response(template: dict) -> dict:
    """Format Supabase template to match frontend expectations"""
    if not template:
        return None
    
    # Parse JSON fields
    variables = template.get("variables", "[]")
    if isinstance(variables, str):
        try:
            variables = json.loads(variables)
        except:
            variables = []
    
    return {
        "id": template.get("id"),
        "name": template.get("name"),
        "subject": template.get("subject"),
        "content": template.get("content"),
        "description": template.get("description"),
        "category": template.get("category", "marketing"),
        "variables": variables,
        "cartLink": template.get("cart_link"),
        "active": template.get("active", True),
        "createdAt": template.get("created_at"),
        "updatedAt": template.get("updated_at"),
    }


@router.get("")
async def get_all_templates():
    """Get all email templates"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        result = supabase.table("email_templates").select("*").order("created_at", desc=True).execute()
        templates = [format_template_response(t) for t in result.data]
        return templates
    except Exception as e:
        logger.error(f"Error fetching templates: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/variables")
async def get_available_variables():
    """Get list of available template variables"""
    return {
        "variables": AVAILABLE_VARIABLES,
        "cartLinkTemplates": CART_LINK_TEMPLATES
    }


@router.get("/{template_id}")
async def get_template(template_id: str):
    """Get a single template by ID"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        result = supabase.table("email_templates").select("*").eq("id", template_id).limit(1).execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=404, detail="Template not found")
        
        return format_template_response(result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching template: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def create_template(template: EmailTemplateCreate):
    """Create a new email template"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        # Auto-extract variables from content
        detected_variables = extract_variables(template.content)
        if template.subject:
            detected_variables.extend(extract_variables(template.subject))
        detected_variables = list(set(detected_variables))
        
        template_data = {
            "id": str(uuid.uuid4()),
            "name": template.name,
            "subject": template.subject,
            "content": template.content,
            "description": template.description,
            "category": template.category,
            "variables": json.dumps(detected_variables),
            "cart_link": template.cart_link,
            "active": template.active,
        }
        
        result = supabase.table("email_templates").insert(template_data).execute()
        
        if result.data and len(result.data) > 0:
            return format_template_response(result.data[0])
        
        raise HTTPException(status_code=500, detail="Failed to create template")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating template: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{template_id}")
async def update_template(template_id: str, template: EmailTemplateUpdate):
    """Update an email template"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        updates = {}
        
        if template.name is not None:
            updates["name"] = template.name
        if template.subject is not None:
            updates["subject"] = template.subject
        if template.content is not None:
            updates["content"] = template.content
            # Re-extract variables
            detected_variables = extract_variables(template.content)
            if template.subject:
                detected_variables.extend(extract_variables(template.subject))
            updates["variables"] = json.dumps(list(set(detected_variables)))
        if template.description is not None:
            updates["description"] = template.description
        if template.category is not None:
            updates["category"] = template.category
        if template.cart_link is not None:
            updates["cart_link"] = template.cart_link
        if template.active is not None:
            updates["active"] = template.active
        
        if not updates:
            raise HTTPException(status_code=400, detail="No updates provided")
        
        result = supabase.table("email_templates").update(updates).eq("id", template_id).execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=404, detail="Template not found")
        
        return format_template_response(result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating template: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{template_id}")
async def delete_template(template_id: str):
    """Delete an email template"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        result = supabase.table("email_templates").delete().eq("id", template_id).execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=404, detail="Template not found")
        
        return {"message": "Template deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting template: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{template_id}/preview")
async def preview_template(template_id: str, test_data: dict = {}):
    """Preview a template with test data"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        result = supabase.table("email_templates").select("*").eq("id", template_id).limit(1).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Template not found")
        
        template = result.data[0]
        
        # Default test data
        default_data = {
            "firstname": "Jan",
            "lastname": "de Vries",
            "email": "jan@voorbeeld.nl",
            "full_name": "Jan de Vries",
            "product_name": "Droomvriendjes Leeuw",
            "product_price": "€49,95",
            "product_image": "/email-assets/leeuw.jpg",
            "discount_code": "FAMILIE20",
            "discount_percentage": "20%",
            "cart_link": "https://droomvriendjes.nl/checkout?product=leeuw",
            "shop_url": "https://droomvriendjes.nl",
            "unsubscribe_link": "https://droomvriendjes.nl/unsubscribe",
        }
        
        # Merge with provided test data
        data = {**default_data, **test_data}
        
        # Replace variables in content and subject
        content = template.get("content", "")
        subject = template.get("subject", "")
        
        for var, value in data.items():
            pattern = f"{{{{{var}}}}}"
            content = content.replace(pattern, str(value))
            subject = subject.replace(pattern, str(value))
        
        return {
            "subject": subject,
            "content": content,
            "testData": data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error previewing template: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{template_id}/duplicate")
async def duplicate_template(template_id: str):
    """Duplicate an existing template"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        # Get original template
        result = supabase.table("email_templates").select("*").eq("id", template_id).limit(1).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Template not found")
        
        original = result.data[0]
        
        # Create duplicate
        new_template = {
            "id": str(uuid.uuid4()),
            "name": f"{original.get('name')} (kopie)",
            "subject": original.get("subject"),
            "content": original.get("content"),
            "description": original.get("description"),
            "category": original.get("category"),
            "variables": original.get("variables"),
            "cart_link": original.get("cart_link"),
            "active": False,  # Start as inactive
        }
        
        result = supabase.table("email_templates").insert(new_template).execute()
        
        if result.data and len(result.data) > 0:
            return format_template_response(result.data[0])
        
        raise HTTPException(status_code=500, detail="Failed to duplicate template")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error duplicating template: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/category/{category}")
async def get_templates_by_category(category: str):
    """Get templates by category"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        result = supabase.table("email_templates").select("*").eq("category", category).order("created_at", desc=True).execute()
        templates = [format_template_response(t) for t in result.data]
        return templates
    except Exception as e:
        logger.error(f"Error fetching templates by category: {e}")
        raise HTTPException(status_code=500, detail=str(e))
