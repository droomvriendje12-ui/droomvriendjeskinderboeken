"""
Migrate all product images from /app/frontend/public/products/* to Supabase Storage
bucket 'product-images', then update the products table to point to the new URLs.

Idempotent: skips files that already exist in Storage.

Run: python3 /app/backend/scripts/migrate_product_images.py
"""
import os
import sys
import json
import mimetypes
import logging
import requests
from pathlib import Path
from dotenv import load_dotenv

sys.path.insert(0, "/app/backend")
load_dotenv("/app/backend/.env")

from supabase import create_client

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("migrate-images")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
BUCKET = "product-images"
PUBLIC_PROD_PREFIX = "https://droomvriendjes.com/products/"
LOCAL_ROOT = Path("/app/frontend/public/products")

sb = create_client(SUPABASE_URL, SUPABASE_KEY)


def storage_public_url(path: str) -> str:
    return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{path}"


def ensure_uploaded(local_path: Path, storage_key: str) -> str:
    """Upload local_path to Supabase Storage at storage_key, return public URL."""
    content_type = mimetypes.guess_type(str(local_path))[0] or "application/octet-stream"
    try:
        with open(local_path, "rb") as f:
            sb.storage.from_(BUCKET).upload(
                path=storage_key,
                file=f,
                file_options={"content-type": content_type, "upsert": "true"},
            )
    except Exception as e:
        msg = str(e)
        if "duplicate" in msg.lower() or "already exists" in msg.lower():
            logger.debug(f"  exists: {storage_key}")
        else:
            raise
    return storage_public_url(storage_key)


def remap_url(original_url: str, uploaded_map: dict) -> str:
    """If original_url points to a known hotlinked path, return new Supabase URL."""
    if not isinstance(original_url, str):
        return original_url
    if original_url in uploaded_map:
        return uploaded_map[original_url]
    if original_url.startswith(PUBLIC_PROD_PREFIX):
        # Try mapping by extracting the file path
        rel = original_url[len(PUBLIC_PROD_PREFIX):]
        local = LOCAL_ROOT / rel
        if local.exists():
            new_url = ensure_uploaded(local, rel)
            uploaded_map[original_url] = new_url
            return new_url
    return original_url


def migrate():
    # 1) Upload everything in local products folder (snapshot)
    uploaded = {}
    total_files = 0
    for path in LOCAL_ROOT.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"}:
            continue
        rel = str(path.relative_to(LOCAL_ROOT))
        storage_key = rel.replace("\\", "/")
        original_hotlink = f"{PUBLIC_PROD_PREFIX}{storage_key}"
        new_url = ensure_uploaded(path, storage_key)
        uploaded[original_hotlink] = new_url
        total_files += 1
    logger.info(f"Uploaded {total_files} files to bucket '{BUCKET}'")

    # 2) Update product rows
    r = sb.table("products").select("id, images").execute()
    updated_count = 0
    for p in r.data:
        new_images = None
        images = p.get("images")
        if images:
            try:
                arr = images if isinstance(images, list) else json.loads(images)
            except Exception:
                arr = []
            if arr:
                new_arr = [remap_url(u, uploaded) for u in arr]
                if new_arr != arr:
                    new_images = new_arr

        if new_images is not None:
            sb.table("products").update({"images": new_images}).eq("id", p["id"]).execute()
            updated_count += 1
            logger.info(f"  product {p['id']} updated with {len(new_images)} images")

    logger.info(f"Updated {updated_count} product rows")
    logger.info("✅ Migration complete")


if __name__ == "__main__":
    migrate()
