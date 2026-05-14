-- =====================================================
-- DROOMVRIENDJES - PHASE 3 ADMIN SCHEMA MIGRATION
-- =====================================================
-- Run this in the Supabase SQL Editor for project: plxbmkwuacbdzookygtg
-- It adds missing columns + tables that the admin dashboard uses.
-- Safe to run multiple times (idempotent).
-- =====================================================

-- 1. ORDERS: add tracking/admin/audit fields
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS tracking_url    TEXT,
  ADD COLUMN IF NOT EXISTS tracking_carrier TEXT,
  ADD COLUMN IF NOT EXISTS shipped_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_notes     TEXT,
  ADD COLUMN IF NOT EXISTS shipping_country TEXT DEFAULT 'NL';

-- 2. PRODUCTS: stock_quantity exists already but add legacy aliases used by code
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS stock    INTEGER GENERATED ALWAYS AS (stock_quantity) STORED;

-- 3. CUSTOMERS: structured customer table (auto-derived from orders, but allow manual records)
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS email           TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS name            TEXT,
  ADD COLUMN IF NOT EXISTS phone           TEXT,
  ADD COLUMN IF NOT EXISTS total_orders    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_spent     NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_order_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_order_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes           TEXT,
  ADD COLUMN IF NOT EXISTS tags            TEXT[],
  ADD COLUMN IF NOT EXISTS marketing_optin BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at      TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);

-- 4. CONTACT_MESSAGES: from contact form
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  subject     TEXT,
  message     TEXT NOT NULL,
  status      TEXT DEFAULT 'new', -- new | replied | archived
  admin_notes TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  replied_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_contact_status ON public.contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_created ON public.contact_messages(created_at DESC);

-- 5. NEWSLETTER_SUBSCRIBERS
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  name            TEXT,
  source          TEXT, -- popup | checkout | manual
  confirmed       BOOLEAN DEFAULT true,
  unsubscribed    BOOLEAN DEFAULT false,
  unsubscribed_at TIMESTAMPTZ,
  tags            TEXT[],
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter_subscribers(email);

-- 6. SITE_SETTINGS (key/value)
CREATE TABLE IF NOT EXISTS public.site_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);

-- 7. ADMIN_USERS (optional, currently using env vars)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT UNIQUE NOT NULL,
  name         TEXT,
  role         TEXT DEFAULT 'admin', -- admin | viewer
  password_hash TEXT,
  active       BOOLEAN DEFAULT true,
  last_login   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 8. View: customers aggregated from orders (auto-updates)
CREATE OR REPLACE VIEW public.customers_overview AS
SELECT
  customer_email                                            AS email,
  MAX(customer_name)                                        AS name,
  MAX(customer_phone)                                       AS phone,
  COUNT(*)                                                  AS total_orders,
  COALESCE(SUM(total_amount), 0)                            AS total_spent,
  MIN(created_at)                                           AS first_order_at,
  MAX(created_at)                                           AS last_order_at,
  COUNT(*) FILTER (WHERE status IN ('paid','shipped','delivered')) AS paid_orders
FROM public.orders
WHERE customer_email IS NOT NULL AND customer_email <> ''
GROUP BY customer_email;

-- 9. RLS policies (service_role has full access by default)
-- Allow anon to insert contact messages and newsletter subscribers
ALTER TABLE public.contact_messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings          ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_contact"    ON public.contact_messages;
DROP POLICY IF EXISTS "anon_insert_newsletter" ON public.newsletter_subscribers;
CREATE POLICY "anon_insert_contact"    ON public.contact_messages       FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_newsletter" ON public.newsletter_subscribers FOR INSERT TO anon WITH CHECK (true);

-- =====================================================
-- DONE
-- =====================================================
SELECT 'Phase 3 migration complete' AS status;
