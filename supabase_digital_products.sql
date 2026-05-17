-- ==========================================
-- DROOMVRIENDJES - DIGITAL PRODUCTS MIGRATION
-- Voer dit uit in: Supabase Dashboard > SQL Editor > New Query > Run
-- ==========================================

-- 1. PRODUCTS: voeg digital product velden toe
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'physical';
ALTER TABLE products ADD COLUMN IF NOT EXISTS digital_file_path TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS digital_file_size INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS digital_pages INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS digital_preview_url TEXT;

CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);

-- 2. DIGITAL DOWNLOADS: entitlements per bestelling
CREATE TABLE IF NOT EXISTS digital_downloads (
    id TEXT PRIMARY KEY,
    order_id TEXT,
    order_item_id TEXT,
    customer_email TEXT NOT NULL,
    product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
    file_path TEXT NOT NULL,
    download_token TEXT UNIQUE NOT NULL,
    downloads_used INTEGER DEFAULT 0,
    max_downloads INTEGER DEFAULT 3,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_downloaded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_digital_downloads_token ON digital_downloads(download_token);
CREATE INDEX IF NOT EXISTS idx_digital_downloads_email ON digital_downloads(customer_email);
CREATE INDEX IF NOT EXISTS idx_digital_downloads_order ON digital_downloads(order_id);

-- 3. RLS (uit voor backend service role; admin doet alles via FastAPI)
ALTER TABLE digital_downloads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all" ON digital_downloads;
CREATE POLICY "service_role_all" ON digital_downloads FOR ALL USING (true) WITH CHECK (true);

-- 4. STORAGE BUCKET (handmatig in dashboard maken of via Python script)
-- Bucket name: digital-products
-- Public: false
-- Allowed MIME: application/pdf
-- File size limit: 25 MB
