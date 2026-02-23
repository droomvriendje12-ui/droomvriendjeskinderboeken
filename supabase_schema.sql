-- ============================================
-- DROOMVRIENDJES.NL - SUPABASE DATABASE SCHEMA
-- ============================================
-- Gegenereerd: 23 februari 2026
-- Database migratie van MongoDB naar PostgreSQL/Supabase
-- ============================================

-- ============================================
-- 1. EXTENSIES
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 2. CUSTOM TYPES (ENUMS)
-- ============================================

-- Order status
CREATE TYPE order_status AS ENUM (
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded'
);

-- Payment status
CREATE TYPE payment_status AS ENUM (
  'pending',
  'paid',
  'failed',
  'expired',
  'cancelled',
  'refunded'
);

-- Payment method
CREATE TYPE payment_method AS ENUM (
  'ideal',
  'bancontact',
  'creditcard',
  'paypal',
  'klarna',
  'applepay',
  'googlepay'
);

-- Discount type
CREATE TYPE discount_type AS ENUM (
  'percentage',
  'fixed'
);

-- Campaign status
CREATE TYPE campaign_status AS ENUM (
  'draft',
  'scheduled',
  'sending',
  'sent',
  'paused',
  'cancelled'
);

-- Affiliate status
CREATE TYPE affiliate_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'suspended'
);

-- Gift card status
CREATE TYPE gift_card_status AS ENUM (
  'pending',
  'active',
  'used',
  'expired'
);

-- Subscriber status
CREATE TYPE subscriber_status AS ENUM (
  'active',
  'unsubscribed',
  'bounced'
);

-- Cart status
CREATE TYPE cart_status AS ENUM (
  'active',
  'abandoned',
  'recovered',
  'converted'
);

-- ============================================
-- 3. CORE TABLES
-- ============================================

-- --------------------------------------------
-- PRODUCTS (Hoofdproducten tabel)
-- --------------------------------------------
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(100),
  slug VARCHAR(255) UNIQUE,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  image VARCHAR(500),
  macro_image VARCHAR(500),
  dimensions_image VARCHAR(500),
  description TEXT,
  short_description TEXT,
  features JSONB DEFAULT '[]',
  benefits JSONB DEFAULT '[]',
  gallery JSONB DEFAULT '[]',
  custom_sections JSONB DEFAULT '[]',
  rating DECIMAL(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  badge VARCHAR(50),
  in_stock BOOLEAN DEFAULT true,
  stock INTEGER DEFAULT 0,
  age_range VARCHAR(50),
  warranty VARCHAR(100),
  sku VARCHAR(50) UNIQUE,
  item_id VARCHAR(50),
  item_category VARCHAR(100),
  item_category2 VARCHAR(100),
  item_category3 VARCHAR(100),
  item_variant VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index voor snelle zoekacties
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_in_stock ON products(in_stock);

-- --------------------------------------------
-- CUSTOMERS (Klanten)
-- --------------------------------------------
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(50),
  address VARCHAR(500),
  city VARCHAR(100),
  zipcode VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Nederland',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_email ON customers(email);

-- --------------------------------------------
-- ORDERS (Bestellingen)
-- --------------------------------------------
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) UNIQUE,
  customer_id UUID REFERENCES customers(id),
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  
  -- Verzendadres
  shipping_address VARCHAR(500),
  shipping_city VARCHAR(100),
  shipping_zipcode VARCHAR(20),
  shipping_country VARCHAR(100) DEFAULT 'Nederland',
  
  -- Facturatieadres (indien anders)
  billing_address VARCHAR(500),
  billing_city VARCHAR(100),
  billing_zipcode VARCHAR(20),
  billing_country VARCHAR(100),
  
  -- Financieel
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  
  -- Kortingscode
  discount_code_id UUID,
  discount_code VARCHAR(50),
  
  -- Status & Payment
  status order_status DEFAULT 'pending',
  mollie_payment_id VARCHAR(100),
  payment_method payment_method,
  
  -- Verzending
  sendcloud_parcel_id VARCHAR(100),
  tracking_number VARCHAR(100),
  tracking_url VARCHAR(500),
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  -- Notities
  customer_notes TEXT,
  admin_notes TEXT,
  
  -- Affiliate tracking
  affiliate_id UUID,
  affiliate_code VARCHAR(50),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_mollie_payment_id ON orders(mollie_payment_id);

-- --------------------------------------------
-- ORDER ITEMS (Bestelde producten)
-- --------------------------------------------
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(50),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- --------------------------------------------
-- PAYMENTS (Betalingen)
-- --------------------------------------------
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  mollie_payment_id VARCHAR(100) UNIQUE,
  status payment_status DEFAULT 'pending',
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  method payment_method,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  webhook_received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_mollie_payment_id ON payments(mollie_payment_id);
CREATE INDEX idx_payments_status ON payments(status);

-- --------------------------------------------
-- REVIEWS (Product reviews)
-- --------------------------------------------
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  product_name VARCHAR(255),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  content TEXT,
  verified BOOLEAN DEFAULT false,
  avatar VARCHAR(500),
  source VARCHAR(50) DEFAULT 'website',
  visible BOOLEAN DEFAULT true,
  admin_reply TEXT,
  admin_reply_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_visible ON reviews(visible);

-- --------------------------------------------
-- DISCOUNT CODES (Kortingscodes)
-- --------------------------------------------
CREATE TABLE discount_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type discount_type NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  max_discount_amount DECIMAL(10,2),
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  uses_per_customer INTEGER DEFAULT 1,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  first_order_only BOOLEAN DEFAULT false,
  product_ids UUID[] DEFAULT '{}',
  excluded_product_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_discount_codes_code ON discount_codes(code);
CREATE INDEX idx_discount_codes_active ON discount_codes(active);

-- --------------------------------------------
-- GIFT CARDS (Cadeaubonnen)
-- --------------------------------------------
CREATE TABLE gift_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  remaining_amount DECIMAL(10,2) NOT NULL,
  sender_name VARCHAR(255),
  sender_email VARCHAR(255),
  recipient_name VARCHAR(255),
  recipient_email VARCHAR(255),
  message TEXT,
  status gift_card_status DEFAULT 'pending',
  mollie_payment_id VARCHAR(100),
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  used_order_id UUID REFERENCES orders(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gift_cards_code ON gift_cards(code);
CREATE INDEX idx_gift_cards_status ON gift_cards(status);

-- ============================================
-- 4. MARKETING & CAMPAIGNS TABLES
-- ============================================

-- --------------------------------------------
-- EMAIL SUBSCRIBERS (Nieuwsbrief abonnees)
-- --------------------------------------------
CREATE TABLE email_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  status subscriber_status DEFAULT 'active',
  source VARCHAR(100),
  tags JSONB DEFAULT '[]',
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_subscribers_email ON email_subscribers(email);
CREATE INDEX idx_email_subscribers_status ON email_subscribers(status);

-- --------------------------------------------
-- EMAIL CAMPAIGNS (E-mail campagnes)
-- --------------------------------------------
CREATE TABLE email_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  content TEXT,
  template_id VARCHAR(100),
  segment VARCHAR(100),
  segments JSONB DEFAULT '[]',
  status campaign_status DEFAULT 'draft',
  recipient_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  unsubscribed_count INTEGER DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);

-- --------------------------------------------
-- EMAIL LOGS (Verzonden e-mails log)
-- --------------------------------------------
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  subscriber_id UUID REFERENCES email_subscribers(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  status VARCHAR(50) DEFAULT 'sent',
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_logs_campaign_id ON email_logs(campaign_id);
CREATE INDEX idx_email_logs_email ON email_logs(email);

-- --------------------------------------------
-- EMAIL CLICKS (Click tracking)
-- --------------------------------------------
CREATE TABLE email_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  url VARCHAR(1000),
  user_agent TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_clicks_campaign_id ON email_clicks(campaign_id);

-- --------------------------------------------
-- WHATSAPP CONTACTS
-- --------------------------------------------
CREATE TABLE whatsapp_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255),
  opted_in BOOLEAN DEFAULT false,
  segment VARCHAR(100),
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_contacts_phone ON whatsapp_contacts(phone);

-- --------------------------------------------
-- WHATSAPP BROADCASTS
-- --------------------------------------------
CREATE TABLE whatsapp_broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255),
  message TEXT,
  segment VARCHAR(100),
  recipient_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  status campaign_status DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------
-- SMS CAMPAIGNS
-- --------------------------------------------
CREATE TABLE sms_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255),
  message TEXT,
  segment VARCHAR(100),
  recipient_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  status campaign_status DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. CART & CHECKOUT TABLES
-- ============================================

-- --------------------------------------------
-- ABANDONED CARTS (Verlaten winkelwagens)
-- --------------------------------------------
CREATE TABLE abandoned_carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id VARCHAR(100) UNIQUE,
  session_id VARCHAR(255),
  customer_id UUID REFERENCES customers(id),
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  items JSONB DEFAULT '[]',
  total_amount DECIMAL(10,2),
  status cart_status DEFAULT 'active',
  emails_sent INTEGER DEFAULT 0,
  last_email_sent TIMESTAMPTZ,
  recovered BOOLEAN DEFAULT false,
  recovery_order_id UUID REFERENCES orders(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_abandoned_carts_customer_email ON abandoned_carts(customer_email);
CREATE INDEX idx_abandoned_carts_status ON abandoned_carts(status);

-- --------------------------------------------
-- CHECKOUT EVENTS (Checkout tracking)
-- --------------------------------------------
CREATE TABLE checkout_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(255),
  customer_email VARCHAR(255),
  cart_items JSONB DEFAULT '[]',
  total_amount DECIMAL(10,2),
  step VARCHAR(50),
  status VARCHAR(50),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_checkout_events_session_id ON checkout_events(session_id);
CREATE INDEX idx_checkout_events_customer_email ON checkout_events(customer_email);

-- ============================================
-- 6. AFFILIATE & MARKETING TABLES
-- ============================================

-- --------------------------------------------
-- AFFILIATES (Affiliate partners)
-- --------------------------------------------
CREATE TABLE affiliates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  website VARCHAR(500),
  social_media JSONB DEFAULT '{}',
  motivation TEXT,
  affiliate_code VARCHAR(50) UNIQUE NOT NULL,
  tracking_link VARCHAR(500),
  status affiliate_status DEFAULT 'pending',
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue_generated DECIMAL(10,2) DEFAULT 0,
  commission_earned DECIMAL(10,2) DEFAULT 0,
  commission_paid DECIMAL(10,2) DEFAULT 0,
  initials VARCHAR(5),
  color VARCHAR(20),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_affiliates_email ON affiliates(email);
CREATE INDEX idx_affiliates_code ON affiliates(affiliate_code);
CREATE INDEX idx_affiliates_status ON affiliates(status);

-- --------------------------------------------
-- MARKETING LEADS
-- --------------------------------------------
CREATE TABLE marketing_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(50),
  source VARCHAR(100),
  campaign VARCHAR(100),
  segment VARCHAR(100),
  tags JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_marketing_leads_email ON marketing_leads(email);
CREATE INDEX idx_marketing_leads_source ON marketing_leads(source);

-- --------------------------------------------
-- MARKETING CHAT HISTORY
-- --------------------------------------------
CREATE TABLE marketing_chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES marketing_leads(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  role VARCHAR(20),
  content TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_marketing_chat_session ON marketing_chat_history(session_id);

-- ============================================
-- 7. ANALYTICS & TRACKING TABLES
-- ============================================

-- --------------------------------------------
-- QR SCANS
-- --------------------------------------------
CREATE TABLE qr_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qr_code VARCHAR(100),
  campaign VARCHAR(100),
  source VARCHAR(100),
  user_agent TEXT,
  ip_address VARCHAR(50),
  location JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_qr_scans_campaign ON qr_scans(campaign);

-- --------------------------------------------
-- SEO VISITS
-- --------------------------------------------
CREATE TABLE seo_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_url VARCHAR(500),
  keyword VARCHAR(255),
  source VARCHAR(100),
  referrer VARCHAR(500),
  user_agent TEXT,
  ip_address VARCHAR(50),
  session_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_seo_visits_keyword ON seo_visits(keyword);
CREATE INDEX idx_seo_visits_page_url ON seo_visits(page_url);

-- --------------------------------------------
-- SEO KEYWORD STATS
-- --------------------------------------------
CREATE TABLE seo_keyword_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword VARCHAR(255) UNIQUE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  average_position DECIMAL(5,2),
  ctr DECIMAL(5,2),
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_seo_keyword_stats_keyword ON seo_keyword_stats(keyword);

-- --------------------------------------------
-- OFFLINE CAMPAIGN STATS
-- --------------------------------------------
CREATE TABLE offline_campaign_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_name VARCHAR(255),
  campaign_type VARCHAR(100),
  scans INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. SYSTEM & ADMIN TABLES
-- ============================================

-- --------------------------------------------
-- UPLOADS (Bestandsuploads)
-- --------------------------------------------
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255),
  url VARCHAR(1000),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  image_type VARCHAR(50),
  file_size INTEGER,
  content_type VARCHAR(100),
  storage_provider VARCHAR(50) DEFAULT 'supabase',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_uploads_product_id ON uploads(product_id);

-- --------------------------------------------
-- GOOGLE ADS TOKENS
-- --------------------------------------------
CREATE TABLE google_ads_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  access_token TEXT,
  refresh_token TEXT,
  token_type VARCHAR(50),
  expires_at TIMESTAMPTZ,
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------
-- ADMIN USERS
-- --------------------------------------------
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_users_email ON admin_users(email);

-- ============================================
-- 9. TRIGGERS & FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_discount_codes_updated_at BEFORE UPDATE ON discount_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON email_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_affiliates_updated_at BEFORE UPDATE ON affiliates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_abandoned_carts_updated_at BEFORE UPDATE ON abandoned_carts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update product review count & rating after review insert/update
CREATE OR REPLACE FUNCTION update_product_review_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET 
    review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) AND visible = true),
    rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) AND visible = true)
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_review_stats_insert AFTER INSERT ON reviews FOR EACH ROW EXECUTE FUNCTION update_product_review_stats();
CREATE TRIGGER update_review_stats_update AFTER UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_product_review_stats();
CREATE TRIGGER update_review_stats_delete AFTER DELETE ON reviews FOR EACH ROW EXECUTE FUNCTION update_product_review_stats();

-- Generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number = 'DV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE SEQUENCE order_number_seq START 1;
CREATE TRIGGER set_order_number BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- ============================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_keyword_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_campaign_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_ads_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PUBLIC READ POLICIES (Iedereen kan lezen)
-- ============================================

-- Products: Publiek leesbaar
CREATE POLICY "Products are viewable by everyone" 
  ON products FOR SELECT 
  USING (true);

-- Reviews: Publiek leesbaar (alleen zichtbare)
CREATE POLICY "Visible reviews are viewable by everyone" 
  ON reviews FOR SELECT 
  USING (visible = true);

-- Discount codes: Publiek leesbaar (alleen actieve)
CREATE POLICY "Active discount codes are viewable by everyone" 
  ON discount_codes FOR SELECT 
  USING (active = true AND (valid_until IS NULL OR valid_until > NOW()));

-- ============================================
-- SERVICE ROLE POLICIES (Backend/API toegang)
-- ============================================

-- Service role heeft volledige toegang tot alle tabellen
-- Dit is voor je backend API calls

-- Products: Service role kan alles
CREATE POLICY "Service role has full access to products" 
  ON products FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Customers: Alleen service role
CREATE POLICY "Service role has full access to customers" 
  ON customers FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Orders: Alleen service role
CREATE POLICY "Service role has full access to orders" 
  ON orders FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Order Items: Alleen service role
CREATE POLICY "Service role has full access to order_items" 
  ON order_items FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Payments: Alleen service role
CREATE POLICY "Service role has full access to payments" 
  ON payments FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Reviews: Service role kan alles
CREATE POLICY "Service role has full access to reviews" 
  ON reviews FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Discount Codes: Service role kan alles
CREATE POLICY "Service role has full access to discount_codes" 
  ON discount_codes FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Gift Cards: Service role kan alles
CREATE POLICY "Service role has full access to gift_cards" 
  ON gift_cards FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Email Subscribers: Service role kan alles
CREATE POLICY "Service role has full access to email_subscribers" 
  ON email_subscribers FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Email Campaigns: Service role kan alles
CREATE POLICY "Service role has full access to email_campaigns" 
  ON email_campaigns FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Email Logs: Service role kan alles
CREATE POLICY "Service role has full access to email_logs" 
  ON email_logs FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Email Clicks: Service role kan alles
CREATE POLICY "Service role has full access to email_clicks" 
  ON email_clicks FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- WhatsApp Contacts: Service role kan alles
CREATE POLICY "Service role has full access to whatsapp_contacts" 
  ON whatsapp_contacts FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- WhatsApp Broadcasts: Service role kan alles
CREATE POLICY "Service role has full access to whatsapp_broadcasts" 
  ON whatsapp_broadcasts FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- SMS Campaigns: Service role kan alles
CREATE POLICY "Service role has full access to sms_campaigns" 
  ON sms_campaigns FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Abandoned Carts: Service role kan alles
CREATE POLICY "Service role has full access to abandoned_carts" 
  ON abandoned_carts FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Checkout Events: Service role kan alles
CREATE POLICY "Service role has full access to checkout_events" 
  ON checkout_events FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Affiliates: Service role kan alles
CREATE POLICY "Service role has full access to affiliates" 
  ON affiliates FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Marketing Leads: Service role kan alles
CREATE POLICY "Service role has full access to marketing_leads" 
  ON marketing_leads FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Marketing Chat History: Service role kan alles
CREATE POLICY "Service role has full access to marketing_chat_history" 
  ON marketing_chat_history FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- QR Scans: Service role kan alles
CREATE POLICY "Service role has full access to qr_scans" 
  ON qr_scans FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- SEO Visits: Service role kan alles
CREATE POLICY "Service role has full access to seo_visits" 
  ON seo_visits FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- SEO Keyword Stats: Service role kan alles
CREATE POLICY "Service role has full access to seo_keyword_stats" 
  ON seo_keyword_stats FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Offline Campaign Stats: Service role kan alles
CREATE POLICY "Service role has full access to offline_campaign_stats" 
  ON offline_campaign_stats FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Uploads: Service role kan alles
CREATE POLICY "Service role has full access to uploads" 
  ON uploads FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Google Ads Tokens: Alleen service role
CREATE POLICY "Service role has full access to google_ads_tokens" 
  ON google_ads_tokens FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Admin Users: Alleen service role
CREATE POLICY "Service role has full access to admin_users" 
  ON admin_users FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- ============================================
-- ANON POLICIES (Anonieme gebruikers - frontend)
-- ============================================

-- Anon kan reviews aanmaken
CREATE POLICY "Anyone can create reviews" 
  ON reviews FOR INSERT 
  TO anon 
  WITH CHECK (true);

-- Anon kan zich abonneren op nieuwsbrief
CREATE POLICY "Anyone can subscribe to newsletter" 
  ON email_subscribers FOR INSERT 
  TO anon 
  WITH CHECK (true);

-- Anon kan checkout events aanmaken
CREATE POLICY "Anyone can create checkout events" 
  ON checkout_events FOR INSERT 
  TO anon 
  WITH CHECK (true);

-- Anon kan QR scans registreren
CREATE POLICY "Anyone can register QR scans" 
  ON qr_scans FOR INSERT 
  TO anon 
  WITH CHECK (true);

-- Anon kan SEO visits registreren
CREATE POLICY "Anyone can register SEO visits" 
  ON seo_visits FOR INSERT 
  TO anon 
  WITH CHECK (true);

-- ============================================
-- AUTHENTICATED USER POLICIES (Ingelogde klanten)
-- ============================================

-- Klanten kunnen hun eigen orders zien (via Supabase Auth)
-- Uncomment als je Supabase Auth gebruikt voor klanten
/*
CREATE POLICY "Users can view own orders" 
  ON orders FOR SELECT 
  TO authenticated 
  USING (customer_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can view own order items" 
  ON order_items FOR SELECT 
  TO authenticated 
  USING (
    order_id IN (
      SELECT id FROM orders WHERE customer_email = auth.jwt() ->> 'email'
    )
  );
*/

-- ============================================
-- 11. VIEWS (Handige overzichten)
-- ============================================

-- Order overzicht met totalen
CREATE OR REPLACE VIEW order_summary AS
SELECT 
  o.id,
  o.order_number,
  o.customer_email,
  o.customer_name,
  o.total_amount,
  o.status,
  o.payment_method,
  o.created_at,
  COUNT(oi.id) as item_count,
  SUM(oi.quantity) as total_items
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id;

-- Product performance (verkoop statistieken)
CREATE OR REPLACE VIEW product_performance AS
SELECT 
  p.id,
  p.name,
  p.sku,
  p.price,
  COALESCE(SUM(oi.quantity), 0) as total_sold,
  COALESCE(SUM(oi.total_price), 0) as total_revenue,
  p.rating,
  p.review_count
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('paid', 'shipped', 'delivered')
GROUP BY p.id;

-- Campaign performance
CREATE OR REPLACE VIEW campaign_performance AS
SELECT 
  id,
  name,
  status,
  recipient_count,
  sent_count,
  opened_count,
  clicked_count,
  CASE WHEN sent_count > 0 
    THEN ROUND((opened_count::DECIMAL / sent_count) * 100, 2) 
    ELSE 0 
  END as open_rate,
  CASE WHEN opened_count > 0 
    THEN ROUND((clicked_count::DECIMAL / opened_count) * 100, 2) 
    ELSE 0 
  END as click_rate,
  created_at
FROM email_campaigns;

-- ============================================
-- 12. INITIAL DATA (Default admin user)
-- ============================================

-- Insert default admin user (password: Droomvriendjes!2024)
-- Hash gegenereerd met bcrypt
INSERT INTO admin_users (email, password_hash, name, role) VALUES 
('admin@droomvriendjes.nl', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4XZWJ.ALNQ5', 'Admin', 'superadmin')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- EINDE SCHEMA
-- ============================================

-- Om te gebruiken:
-- 1. Ga naar je Supabase project
-- 2. Open SQL Editor
-- 3. Plak deze hele SQL code
-- 4. Klik op "Run"
--
-- Let op:
-- - Gebruik de 'service_role' key in je backend voor volledige toegang
-- - Gebruik de 'anon' key in je frontend voor beperkte toegang
-- - RLS zorgt ervoor dat de juiste data zichtbaar is per rol
