"""
Run de digital products SQL migratie via psycopg/direct Postgres connectie naar Supabase.

Probeer eerst via supabase RPC (als die bestaat), anders via direct postgres.
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from supabase import create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Test of de tabel/kolommen er al zijn
print("== Stap 1: Bestaande products kolommen check ==")
try:
    res = sb.table("products").select("id,product_type,digital_file_path").limit(1).execute()
    print("✅ Kolommen 'product_type' + 'digital_file_path' bestaan al in products")
    products_ok = True
except Exception as e:
    print(f"⚠️  Kolommen ontbreken: {e}")
    products_ok = False

print("\n== Stap 2: digital_downloads tabel check ==")
try:
    res = sb.table("digital_downloads").select("id").limit(1).execute()
    print("✅ Tabel 'digital_downloads' bestaat al")
    table_ok = True
except Exception as e:
    print(f"⚠️  Tabel ontbreekt: {e}")
    table_ok = False

if products_ok and table_ok:
    print("\n🎉 Alle migraties zijn al toegepast!")
    sys.exit(0)

print("\n== Stap 3: SQL uitvoeren via RPC ==")
print("Supabase Python SDK heeft geen ingebouwde SQL executor.")
print("Je moet het script handmatig uitvoeren in Supabase Dashboard.")
print()
sql_file = Path(__file__).resolve().parents[2] / "supabase_digital_products.sql"
print(f"📋 Open: {sql_file}")
print(f"📋 Plak in: Supabase Dashboard > SQL Editor > New Query > Run")
print()
print("=" * 60)
print(sql_file.read_text())
print("=" * 60)
sys.exit(1)
