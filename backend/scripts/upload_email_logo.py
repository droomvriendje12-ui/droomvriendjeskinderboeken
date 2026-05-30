"""One-off: upload the branded PNG logo to the public Supabase bucket for email use."""
import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

url = os.environ["SUPABASE_URL"]
key = os.environ["SUPABASE_SERVICE_KEY"]
sb = create_client(url, key)

BUCKET = "product-images"
DEST = "branding/droomvriendjes-logo-email.png"

with open("/tmp/logo_email.png", "rb") as f:
    data = f.read()

try:
    sb.storage.from_(BUCKET).upload(
        DEST, data,
        {"content-type": "image/png", "upsert": "true"},
    )
    print("uploaded")
except Exception as e:
    print("upload note:", e)

public_url = sb.storage.from_(BUCKET).get_public_url(DEST)
print("PUBLIC_URL:", public_url)
