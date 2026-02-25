"""
Products API Routes - Supabase PostgreSQL based product catalog
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
import logging
import uuid
import os
import json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/products", tags=["products"])

# Supabase client - will be set by main app
supabase = None

def set_supabase_client(client):
    """Set the Supabase client"""
    global supabase
    supabase = client
    logger.info("✅ Supabase client set for products route")


# Pydantic models
class ProductCreate(BaseModel):
    name: str
    short_name: Optional[str] = None
    price: float
    original_price: Optional[float] = None
    description: Optional[str] = None
    features: List[str] = []
    benefits: List[str] = []
    sku: str
    badge: Optional[str] = None
    in_stock: bool = True
    stock: int = 100
    age_range: str = "Vanaf 0 maanden"
    warranty: str = "30 dagen slaapgarantie"
    item_category: str = "Knuffels"
    item_category2: Optional[str] = None
    item_category3: Optional[str] = None
    item_variant: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    short_name: Optional[str] = None
    price: Optional[float] = None
    original_price: Optional[float] = None
    description: Optional[str] = None
    features: Optional[List[str]] = None
    benefits: Optional[List[str]] = None
    sku: Optional[str] = None
    badge: Optional[str] = None
    in_stock: Optional[bool] = None
    stock: Optional[int] = None
    age_range: Optional[str] = None
    warranty: Optional[str] = None
    image: Optional[str] = None
    gallery: Optional[List] = None
    macro_image: Optional[str] = None
    dimensions_image: Optional[str] = None


def format_product_response(product: dict) -> dict:
    """Format Supabase product to match frontend expectations (camelCase)"""
    if not product:
        return None
    
    # Parse JSON fields
    features = product.get("features", "[]")
    if isinstance(features, str):
        try:
            features = json.loads(features)
        except:
            features = []
    
    benefits = product.get("benefits", "[]")
    if isinstance(benefits, str):
        try:
            benefits = json.loads(benefits)
        except:
            benefits = []
    
    gallery = product.get("gallery", "[]")
    if isinstance(gallery, str):
        try:
            gallery = json.loads(gallery)
        except:
            gallery = []
    
    custom_sections = product.get("custom_sections", "[]")
    if isinstance(custom_sections, str):
        try:
            custom_sections = json.loads(custom_sections)
        except:
            custom_sections = []
    
    # Parse specs JSON
    specs = product.get("specs", "{}")
    if isinstance(specs, str):
        try:
            specs = json.loads(specs)
        except:
            specs = {}
    
    # Parse quickFeatures JSON
    quick_features = product.get("quick_features", "[]")
    if isinstance(quick_features, str):
        try:
            quick_features = json.loads(quick_features)
        except:
            quick_features = []
    
    return {
        "id": product.get("id"),
        "name": product.get("name"),
        "shortName": product.get("short_name"),
        "slug": product.get("slug"),
        "price": product.get("price"),
        "originalPrice": product.get("original_price"),
        "image": product.get("image"),
        "macroImage": product.get("macro_image"),
        "dimensionsImage": product.get("dimensions_image"),
        "description": product.get("description"),
        "shortDescription": product.get("short_description"),
        "features": features,
        "benefits": benefits,
        "gallery": gallery,
        "customSections": custom_sections,
        "specs": specs,
        "quickFeatures": quick_features,
        "rating": product.get("rating", 0),
        "reviews": product.get("review_count", 0),
        "badge": product.get("badge"),
        "inStock": product.get("in_stock", True),
        "stock": product.get("stock", 0),
        "ageRange": product.get("age_range"),
        "warranty": product.get("warranty"),
        "sku": product.get("sku"),
        "itemId": product.get("item_id"),
        "itemCategory": product.get("item_category"),
        "itemCategory2": product.get("item_category2"),
        "itemCategory3": product.get("item_category3"),
        "itemVariant": product.get("item_variant"),
        "createdAt": product.get("created_at"),
        "updatedAt": product.get("updated_at"),
    }


@router.get("")
async def get_all_products():
    """Get all products from Supabase"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        result = supabase.table("products").select("*").execute()
        products = [format_product_response(p) for p in result.data]
        return products
    except Exception as e:
        logger.error(f"Error fetching products: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{product_id}")
async def get_product(product_id: str):
    """Get a single product by ID"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        result = supabase.table("products").select("*").eq("id", product_id).limit(1).execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return format_product_response(result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching product {product_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def create_product(product: ProductCreate):
    """Create a new product"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        product_data = {
            "id": str(uuid.uuid4()),
            "name": product.name,
            "short_name": product.short_name,
            "price": product.price,
            "original_price": product.original_price,
            "description": product.description,
            "features": json.dumps(product.features),
            "benefits": json.dumps(product.benefits),
            "gallery": "[]",
            "sku": product.sku,
            "badge": product.badge,
            "in_stock": product.in_stock,
            "stock": product.stock,
            "age_range": product.age_range,
            "warranty": product.warranty,
            "item_category": product.item_category,
            "item_category2": product.item_category2,
            "item_category3": product.item_category3,
            "item_variant": product.item_variant,
        }
        
        # Remove None values
        product_data = {k: v for k, v in product_data.items() if v is not None}
        
        result = supabase.table("products").insert(product_data).execute()
        
        if result.data and len(result.data) > 0:
            return format_product_response(result.data[0])
        
        raise HTTPException(status_code=500, detail="Failed to create product")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating product: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{product_id}")
async def update_product(product_id: str, updates: dict):
    """Update a product"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        # Map camelCase to snake_case
        field_mapping = {
            "shortName": "short_name",
            "originalPrice": "original_price",
            "macroImage": "macro_image",
            "dimensionsImage": "dimensions_image",
            "shortDescription": "short_description",
            "customSections": "custom_sections",
            "inStock": "in_stock",
            "ageRange": "age_range",
            "itemCategory": "item_category",
            "itemCategory2": "item_category2",
            "itemCategory3": "item_category3",
            "itemVariant": "item_variant",
            "itemId": "item_id",
            "reviewCount": "review_count",
            "quickFeatures": "quick_features",
        }
        
        # Convert updates to snake_case
        db_updates = {}
        for key, value in updates.items():
            if key in ["id", "_id"]:
                continue
            
            db_key = field_mapping.get(key, key)
            
            # Convert lists and dicts to JSON
            if isinstance(value, (list, dict)):
                db_updates[db_key] = json.dumps(value)
            else:
                db_updates[db_key] = value
        
        if not db_updates:
            raise HTTPException(status_code=400, detail="No valid updates provided")
        
        result = supabase.table("products").update(db_updates).eq("id", product_id).execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return format_product_response(result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating product {product_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{product_id}")
async def delete_product(product_id: str):
    """Delete a product"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        result = supabase.table("products").delete().eq("id", product_id).execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return {"message": "Product deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting product {product_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{product_id}/advanced")
async def update_product_advanced(product_id: str, updates: dict):
    """Update product with advanced customizations"""
    return await update_product(product_id, updates)


@router.get("/{product_id}/advanced")
async def get_product_advanced(product_id: str):
    """Get product with all advanced customizations"""
    return await get_product(product_id)


# ============== PRODUCT IMAGE INFO & OVERRIDES ==============

@router.get("/{product_id}/image-info")
async def get_product_image_info(product_id: str):
    """Get image info for the product editor"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        result = supabase.table("products").select("*").eq("id", product_id).limit(1).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Product niet gevonden")
        
        product = result.data[0]
        gallery = product.get("gallery", "[]")
        if isinstance(gallery, str):
            try:
                gallery = json.loads(gallery)
            except:
                gallery = []
        
        return {
            "default": {
                "image": product.get("image"),
                "gallery": gallery
            },
            "active": {
                "image": product.get("image"),
                "gallery": gallery
            },
            "overrides": {
                "image": None,
                "gallery": []
            },
            "has_overrides": False
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting image info for {product_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{product_id}/set-image-override")
async def set_image_override(product_id: str, image: str = None, gallery: str = None):
    """Set image override (uses GET for CRA proxy compatibility)"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        updates = {}
        if image is not None and image.strip():
            updates["image"] = image.strip()
        
        if updates:
            supabase.table("products").update(updates).eq("id", product_id).execute()
        
        return {"success": True}
    except Exception as e:
        logger.error(f"Error setting image override for {product_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{product_id}/image-override")
async def delete_image_override(product_id: str):
    """Clear image overrides"""
    return {"success": True, "message": "Overrides cleared"}


# ============== PRODUCT IMAGE UPLOAD (Supabase Storage) ==============

SUPABASE_BUCKET = "product-images"

def get_product_folder(product_name: str) -> str:
    """Generate safe folder name from product name"""
    safe_name = product_name.lower().strip()
    safe_name = safe_name.replace(" ", "-").replace("–", "-")
    safe_name = "".join(c for c in safe_name if c.isalnum() or c == "-")
    while "--" in safe_name:
        safe_name = safe_name.replace("--", "-")
    return safe_name


def get_supabase_public_url(path: str) -> str:
    """Get the public URL for a file in Supabase Storage"""
    supabase_url = os.environ.get("SUPABASE_URL", "")
    return f"{supabase_url}/storage/v1/object/public/{SUPABASE_BUCKET}/{path}"


@router.post("/{product_id}/upload-image")
async def upload_product_image(
    product_id: str,
    file: UploadFile = File(...),
    image_type: str = Form("gallery")
):
    """Upload a product image to Supabase Storage"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Alleen JPEG, PNG, WebP en GIF zijn toegestaan")
    
    contents = await file.read()
    
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Bestand is te groot (max 10MB)")
    
    result = supabase.table("products").select("*").eq("id", product_id).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Product niet gevonden")
    
    product = result.data[0]
    
    try:
        product_folder = get_product_folder(product.get("short_name") or f"product-{product_id[:8]}")
        file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        
        if image_type == "main":
            filename = f"main.{file_ext}"
        elif image_type == "macro":
            filename = f"macro.{file_ext}"
        elif image_type == "dimensions":
            filename = f"dimensions.{file_ext}"
        else:
            filename = f"gallery-{uuid.uuid4().hex[:8]}.{file_ext}"
        
        storage_path = f"{product_folder}/{filename}"
        
        # Upload to Supabase Storage (upsert to overwrite existing)
        content_type = file.content_type or "image/jpeg"
        supabase.storage.from_(SUPABASE_BUCKET).upload(
            storage_path, contents,
            file_options={"content-type": content_type, "upsert": "true"}
        )
        
        image_url = get_supabase_public_url(storage_path)
        
        # Update database based on type
        if image_type == "main":
            supabase.table("products").update({"image": image_url}).eq("id", product_id).execute()
        elif image_type == "macro":
            supabase.table("products").update({"macro_image": image_url}).eq("id", product_id).execute()
        elif image_type == "dimensions":
            supabase.table("products").update({"dimensions_image": image_url}).eq("id", product_id).execute()
        
        logger.info(f"Image uploaded to Supabase Storage: {storage_path}")
        return {"success": True, "url": image_url, "type": image_type}
        
    except Exception as e:
        logger.error(f"Error uploading image for product {product_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{product_id}/photos")
async def upload_product_photos(
    product_id: str,
    files: List[UploadFile] = File(...)
):
    """Upload multiple product photos to Supabase Storage and add to gallery"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    result = supabase.table("products").select("*").eq("id", product_id).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Product niet gevonden")
    
    product = result.data[0]
    
    # Parse current gallery
    gallery = product.get("gallery", "[]")
    if isinstance(gallery, str):
        try:
            gallery = json.loads(gallery)
        except:
            gallery = []
    
    # Check max 10 photos limit
    current_count = len(gallery)
    if current_count + len(files) > 10:
        raise HTTPException(
            status_code=400,
            detail=f"Maximaal 10 foto's per product. Je hebt er al {current_count}, en probeert er {len(files)} toe te voegen."
        )
    
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    product_folder = get_product_folder(product.get("short_name") or f"product-{product_id[:8]}")
    uploaded = []
    
    for file in files:
        if file.content_type not in allowed_types:
            continue
        
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            continue
        
        file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        filename = f"gallery-{uuid.uuid4().hex[:8]}.{file_ext}"
        storage_path = f"{product_folder}/{filename}"
        
        try:
            content_type = file.content_type or "image/jpeg"
            supabase.storage.from_(SUPABASE_BUCKET).upload(
                storage_path, contents,
                file_options={"content-type": content_type, "upsert": "true"}
            )
            
            image_url = get_supabase_public_url(storage_path)
            
            gallery.append({
                "url": image_url,
                "alt": f"{product.get('short_name', product.get('name', ''))} - Foto {current_count + len(uploaded) + 1}",
                "visible": True,
                "order": current_count + len(uploaded)
            })
            uploaded.append(image_url)
            
        except Exception as e:
            logger.error(f"Error uploading file {file.filename}: {e}")
    
    # Update gallery in database
    if uploaded:
        supabase.table("products").update({"gallery": json.dumps(gallery)}).eq("id", product_id).execute()
    
    logger.info(f"Uploaded {len(uploaded)} photos for product {product_id}")
    return {
        "success": True,
        "uploaded_count": len(uploaded),
        "urls": uploaded,
        "total_photos": len(gallery)
    }


@router.delete("/{product_id}/photos/{photo_index}")
async def delete_product_photo(product_id: str, photo_index: int):
    """Delete a product photo from gallery by index"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    result = supabase.table("products").select("*").eq("id", product_id).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Product niet gevonden")
    
    product = result.data[0]
    gallery = product.get("gallery", "[]")
    if isinstance(gallery, str):
        try:
            gallery = json.loads(gallery)
        except:
            gallery = []
    
    if photo_index < 0 or photo_index >= len(gallery):
        raise HTTPException(status_code=400, detail="Ongeldige foto index")
    
    removed = gallery.pop(photo_index)
    
    # Re-index orders
    for i, item in enumerate(gallery):
        if isinstance(item, dict):
            item["order"] = i
    
    supabase.table("products").update({"gallery": json.dumps(gallery)}).eq("id", product_id).execute()
    
    logger.info(f"Deleted photo {photo_index} from product {product_id}")
    return {"success": True, "remaining_photos": len(gallery)}


@router.put("/{product_id}/photos/reorder")
async def reorder_product_photos(product_id: str, order: dict):
    """Reorder product gallery photos"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    result = supabase.table("products").select("*").eq("id", product_id).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Product niet gevonden")
    
    product = result.data[0]
    gallery = product.get("gallery", "[]")
    if isinstance(gallery, str):
        try:
            gallery = json.loads(gallery)
        except:
            gallery = []
    
    new_order = order.get("indices", [])
    if len(new_order) != len(gallery):
        raise HTTPException(status_code=400, detail="Ongeldige volgorde")
    
    reordered = [gallery[i] for i in new_order if i < len(gallery)]
    for i, item in enumerate(reordered):
        if isinstance(item, dict):
            item["order"] = i
    
    supabase.table("products").update({"gallery": json.dumps(reordered)}).eq("id", product_id).execute()
    
    return {"success": True, "gallery": reordered}
