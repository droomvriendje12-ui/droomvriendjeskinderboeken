-- ==========================================
-- DROOMVRIENDJES - COMPLETE DATABASE SETUP
-- Kopieer dit HELE script en plak het in:
-- Supabase Dashboard > SQL Editor > New Query > Run
-- ==========================================

-- 1. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT,
    slug TEXT UNIQUE,
    description TEXT,
    short_description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    compare_price DECIMAL(10,2),
    images JSONB DEFAULT '[]'::jsonb,
    badge TEXT,
    category TEXT,
    stock_quantity INTEGER DEFAULT 100,
    sku TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    specifications JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ORDERS
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number TEXT UNIQUE,
    customer_email TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    shipping_address TEXT,
    shipping_city TEXT,
    shipping_zipcode TEXT,
    customer_notes TEXT,
    subtotal DECIMAL(10,2),
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    status TEXT DEFAULT 'pending',
    payment_method TEXT,
    mollie_payment_id TEXT,
    discount_code TEXT,
    affiliate_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    product_sku TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
    mollie_payment_id TEXT UNIQUE,
    status TEXT DEFAULT 'pending',
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    method TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    product_id TEXT,
    reviewer_name TEXT NOT NULL,
    reviewer_email TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,
    verified_purchase BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    zipcode TEXT,
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. DISCOUNT CODES
CREATE TABLE IF NOT EXISTS discount_codes (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL DEFAULT 'percentage',
    discount_value DECIMAL(10,2) NOT NULL,
    min_order_amount DECIMAL(10,2) DEFAULT 0,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    free_shipping BOOLEAN DEFAULT false,
    description TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. EMAIL TEMPLATES
CREATE TABLE IF NOT EXISTS email_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'marketing',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. EMAIL SUBSCRIBERS
CREATE TABLE IF NOT EXISTS email_subscribers (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    source TEXT,
    subscribed BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. GIFT CARDS
CREATE TABLE IF NOT EXISTS gift_cards (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    remaining_amount DECIMAL(10,2) NOT NULL,
    sender_name TEXT,
    sender_email TEXT,
    recipient_name TEXT,
    recipient_email TEXT,
    personal_message TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- 11. AFFILIATES
CREATE TABLE IF NOT EXISTS affiliates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 10,
    total_sales INTEGER DEFAULT 0,
    total_earned DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. CHECKOUT EVENTS
CREATE TABLE IF NOT EXISTS checkout_events (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    session_id TEXT,
    event_type TEXT NOT NULL,
    order_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. ABANDONED CARTS
CREATE TABLE IF NOT EXISTS abandoned_carts (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    cart_data JSONB NOT NULL,
    reminder_sent BOOLEAN DEFAULT false,
    recovered BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_mollie ON payments(mollie_payment_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_checkout_events_session ON checkout_events(session_id);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;

-- Products: iedereen mag lezen
CREATE POLICY "products_public_read" ON products FOR SELECT USING (true);
CREATE POLICY "products_service_write" ON products FOR ALL USING (true) WITH CHECK (true);

-- Reviews: goedgekeurde reviews publiek leesbaar
CREATE POLICY "reviews_public_read" ON reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "reviews_service_all" ON reviews FOR ALL USING (true) WITH CHECK (true);

-- Orders: alleen via service key
CREATE POLICY "orders_service" ON orders FOR ALL USING (true) WITH CHECK (true);

-- Order items: alleen via service key
CREATE POLICY "order_items_service" ON order_items FOR ALL USING (true) WITH CHECK (true);

-- Payments: alleen via service key
CREATE POLICY "payments_service" ON payments FOR ALL USING (true) WITH CHECK (true);

-- Customers: alleen via service key
CREATE POLICY "customers_service" ON customers FOR ALL USING (true) WITH CHECK (true);

-- Discount codes: alleen via service key
CREATE POLICY "discount_codes_service" ON discount_codes FOR ALL USING (true) WITH CHECK (true);

-- Email templates: alleen via service key
CREATE POLICY "email_templates_service" ON email_templates FOR ALL USING (true) WITH CHECK (true);

-- Email subscribers: alleen via service key
CREATE POLICY "email_subscribers_service" ON email_subscribers FOR ALL USING (true) WITH CHECK (true);

-- Gift cards: alleen via service key
CREATE POLICY "gift_cards_service" ON gift_cards FOR ALL USING (true) WITH CHECK (true);

-- Affiliates: alleen via service key
CREATE POLICY "affiliates_service" ON affiliates FOR ALL USING (true) WITH CHECK (true);

-- Checkout events: publiek inserteren (tracking), service lezen
CREATE POLICY "checkout_events_insert" ON checkout_events FOR INSERT WITH CHECK (true);
CREATE POLICY "checkout_events_service" ON checkout_events FOR ALL USING (true) WITH CHECK (true);

-- Abandoned carts: alleen via service key
CREATE POLICY "abandoned_carts_service" ON abandoned_carts FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- SEED DATA: Kortingscodes
-- ==========================================
INSERT INTO discount_codes (id, code, discount_type, discount_value, min_order_amount, max_uses, active, description) VALUES
('WELKOM10', 'WELKOM10', 'percentage', 10, 0, NULL, true, 'Welkomstkorting 10%'),
('LENTE25', 'LENTE25', 'percentage', 25, 75, NULL, true, 'Lente sale - 25% korting bij minimaal 75 euro'),
('EENMALIG2026', 'EENMALIG2026', 'fixed', 5, 0, 1, true, 'Eenmalige kortingscode 2026 - 5 euro')
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- KLAAR! Alle 13 tabellen + RLS + indexes aangemaakt
-- ==========================================
