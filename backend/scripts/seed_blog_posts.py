"""
Create `blog_posts` table in Supabase and seed it with our 6 posts.
Idempotent - can be re-run safely.
"""
import os
import sys
from dotenv import load_dotenv

sys.path.insert(0, "/app/backend")
load_dotenv("/app/backend/.env")

from supabase import create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
sb = create_client(SUPABASE_URL, SUPABASE_KEY)

IMG = "https://plxbmkwuacbdzookygtg.supabase.co/storage/v1/object/public/product-images"

POSTS = [
    {
        "slug": "waarom-huilt-baby-s-nachts",
        "title": "Waarom huilt mijn baby 's nachts? 10 oorzaken en wat je eraan kunt doen",
        "excerpt": "Je baby huilt elke nacht en je weet niet meer wat je moet doen? 10 oorzaken én praktische slaaptips waar je vanavond mee kunt beginnen.",
        "category": "Babyslaap",
        "category_color": "bg-rose-100 text-rose-800",
        "image_url": f"{IMG}/sheep-main.png",
        "published_at": "2026-05-18",
        "read_minutes": 9,
        "tags": ["slaap", "baby", "huilen", "tips"],
        "featured": True,
        "is_published": True,
    },
    {
        "slug": "verschil-verzwaringsknuffel-nachtlampje",
        "title": "Verzwaringsknuffel vs nachtlampje-knuffel: welke past bij jouw kind?",
        "excerpt": "Beide knuffels helpen bij beter slapen, maar werken totaal anders. We leggen het verschil uit.",
        "category": "Productgids",
        "category_color": "bg-sky-100 text-sky-800",
        "image_url": f"{IMG}/bearbrown-main.png",
        "published_at": "2026-05-18",
        "read_minutes": 6,
        "tags": ["knuffel", "vergelijking", "kopen", "angst"],
        "is_published": True,
    },
    {
        "slug": "beste-slaapknuffel-2026",
        "title": "Wat is de beste slaapknuffel voor je kind in 2026? Complete koopgids",
        "excerpt": "Ouders kiezen tussen tientallen slaapknuffels. Maar welke is écht de beste? Onze eerlijke top 5.",
        "category": "Productgids",
        "category_color": "bg-emerald-100 text-emerald-800",
        "image_url": f"{IMG}/panda-main.png",
        "published_at": "2026-05-18",
        "read_minutes": 8,
        "tags": ["knuffel", "kopen", "review", "kraamcadeau"],
        "is_published": True,
    },
    {
        "slug": "5-tips-betere-nachtrust-kinderen",
        "title": "5 Tips voor een Betere Nachtrust bij Kinderen",
        "excerpt": "Ontdek de beste tips om je kind te helpen beter te slapen. Van een vaste slaaproutine tot een rustige slaapomgeving.",
        "category": "Slaaptips",
        "category_color": "bg-amber-100 text-amber-900",
        "image_url": f"{IMG}/sheep-main.png",
        "published_at": "2025-01-10",
        "read_minutes": 7,
        "tags": ["slaap", "tips", "kinderen", "routine"],
        "is_published": True,
    },
    {
        "slug": "hoe-helpen-kalmerende-knuffels-bij-stress",
        "title": "Hoe Helpen Kalmerende Knuffels bij Stress?",
        "excerpt": "Hoe onze kalmerende knuffels met licht en muziek wetenschappelijk bewezen helpen bij stress en angst bij kinderen.",
        "category": "Wetenschap",
        "category_color": "bg-violet-100 text-violet-800",
        "image_url": f"{IMG}/panda-main.png",
        "published_at": "2025-01-05",
        "read_minutes": 7,
        "tags": ["knuffel", "stress", "angst", "wetenschap"],
        "is_published": True,
    },
    {
        "slug": "droomvriendjes-mondriaan-samenwerking",
        "title": "Rust in de avond: hoe slaap bijdraagt aan mentale veerkracht bij kinderen",
        "excerpt": "In een druk gezinsleven is tot rust komen niet altijd vanzelfsprekend. Praktische rustmomenten en een slaapritueel dat haalbaar blijft maken een groot verschil.",
        "category": "Mentale rust",
        "category_color": "bg-amber-100 text-amber-900",
        "image_url": f"{IMG}/bearbrown-main.png",
        "published_at": "2025-01-19",
        "read_minutes": 8,
        "tags": ["rust", "gezin", "mentale gezondheid", "slaap"],
        "is_published": True,
    },
]


def seed():
    # Test if table exists
    try:
        sb.table("blog_posts").select("slug").limit(1).execute()
        print("✅ blog_posts table exists")
    except Exception as e:
        print("❌ blog_posts table does NOT exist. Run the SQL below in Supabase SQL Editor first:")
        print(SQL_DDL)
        return

    # Upsert each post
    for p in POSTS:
        try:
            r = sb.table("blog_posts").upsert(p, on_conflict="slug").execute()
            print(f"  upserted: {p['slug']}")
        except Exception as e:
            print(f"  failed: {p['slug']} - {e}")
    print("✅ Seeding complete")


SQL_DDL = """
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
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts(is_published, published_at DESC);
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_published" ON public.blog_posts;
CREATE POLICY "public_read_published" ON public.blog_posts FOR SELECT TO anon USING (is_published = true);
"""


if __name__ == "__main__":
    seed()
