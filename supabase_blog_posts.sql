-- =====================================================
-- DROOMVRIENDJES - BLOG POSTS TABLE
-- =====================================================
-- Run this in Supabase SQL Editor (project plxbmkwuacbdzookygtg)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  excerpt         TEXT,
  category        TEXT,
  category_color  TEXT,
  image_url       TEXT,
  published_at    DATE,
  read_minutes    INTEGER DEFAULT 5,
  tags            TEXT[],
  featured        BOOLEAN DEFAULT false,
  is_published    BOOLEAN DEFAULT true,
  content_html    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug      ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category  ON public.blog_posts(category);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_published" ON public.blog_posts;
CREATE POLICY "public_read_published"
  ON public.blog_posts
  FOR SELECT
  TO anon
  USING (is_published = true);

SELECT 'blog_posts table ready' AS status;
