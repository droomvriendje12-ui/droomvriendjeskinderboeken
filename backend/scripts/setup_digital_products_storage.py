"""
Setup script voor digitale producten Storage bucket in Supabase.
Maakt een private bucket aan, geconfigureerd voor PDFs.

Gebruik:
  cd /app/backend && python -m scripts.setup_digital_products_storage
"""
import os
import sys
from pathlib import Path

# Load .env
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from supabase import create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
BUCKET_NAME = "digital-products"

def main():
    sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    try:
        existing = sb.storage.list_buckets()
        names = [b.name for b in existing] if existing else []
        print(f"Bestaande buckets: {names}")
        if BUCKET_NAME in names:
            print(f"✅ Bucket '{BUCKET_NAME}' bestaat al, niets te doen.")
            return
    except Exception as e:
        print(f"⚠️  Kon buckets niet listen: {e} - probeer toch aan te maken")

    try:
        res = sb.storage.create_bucket(
            BUCKET_NAME,
            options={
                "public": False,
                "allowed_mime_types": ["application/pdf"],
                "file_size_limit": 25 * 1024 * 1024,  # 25 MB
            },
        )
        print(f"✅ Bucket '{BUCKET_NAME}' aangemaakt: {res}")
    except Exception as e:
        # Mogelijk al bestaand
        msg = str(e)
        if "already exists" in msg.lower() or "duplicate" in msg.lower():
            print(f"✅ Bucket '{BUCKET_NAME}' bestond al.")
        else:
            print(f"❌ Bucket aanmaken faalde: {e}")
            sys.exit(1)


if __name__ == "__main__":
    main()
