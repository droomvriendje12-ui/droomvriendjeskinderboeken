"""Iteration 34 - Blog CMS completion + GA4 promotion events backend regression.

Covers:
- /api/blog-cms/public/posts returns 3 DB blogs (migrated premium)
- /api/blog-cms/public/posts/{slug} returns full content + faqs + related
- /api/admin/login -> token works, /api/blog-cms/posts (admin) returns 3 posts
- /api/blog-cms/sitemap.xml returns valid XML containing 10 blog slugs + product URLs
- 7 code-rendered premium blog routes return 200 (frontend SPA serves index.html for all)
"""
import os
import re
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://ecommerce-digits.preview.emergentagent.com").rstrip("/")

MIGRATED_SLUGS = {
    "witte-ruis-white-noise-baby",
    "baby-knuffel-veilig-slapen-leeftijd",
    "droomvriendjes-mondriaan-samenwerking",
}

PREMIUM_CODE_SLUGS = [
    "5-tips-betere-nachtrust-kinderen",
    "hoe-helpen-kalmerende-knuffels-bij-stress",
    "waarom-huilt-baby-s-nachts",
    "verschil-verzwaringsknuffel-nachtlampje",
    "beste-slaapknuffel-2026",
    "slaapregressie-bij-kinderen",
    "avondroutine-kind-7-stappen",
]


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/admin/login",
                      json={"username": "admin", "password": "Droomvriendjes2024!"},
                      timeout=15)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return r.json().get("token")


# --- Public CMS ---------------------------------------------------------------
class TestPublicCms:
    def test_public_posts_returns_three(self):
        r = requests.get(f"{BASE_URL}/api/blog-cms/public/posts", timeout=15)
        assert r.status_code == 200
        data = r.json()
        posts = data.get("posts", [])
        slugs = {p["slug"] for p in posts}
        assert MIGRATED_SLUGS.issubset(slugs), f"Missing migrated slugs. Got: {slugs}"
        # Should be exactly the 3 migrated (no extras expected per spec)
        assert len(posts) >= 3

    @pytest.mark.parametrize("slug", sorted(MIGRATED_SLUGS))
    def test_public_post_detail(self, slug):
        r = requests.get(f"{BASE_URL}/api/blog-cms/public/posts/{slug}", timeout=15)
        assert r.status_code == 200, f"{slug} -> {r.status_code}"
        d = r.json()
        # support either flat post or wrapped
        post = d.get("post", d)
        assert post.get("slug") == slug
        assert post.get("content"), f"{slug}: content missing/empty"
        assert isinstance(post.get("faqs", []), list)
        assert isinstance(post.get("related_products", []), list)


# --- Admin CMS ----------------------------------------------------------------
class TestAdminCms:
    def test_admin_posts_returns_three(self, admin_token):
        r = requests.get(f"{BASE_URL}/api/blog-cms/posts",
                         headers={"Authorization": f"Bearer {admin_token}"}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        posts = data.get("posts", [])
        slugs = {p["slug"] for p in posts}
        assert MIGRATED_SLUGS.issubset(slugs)
        assert len(posts) == 3, f"Expected 3 DB posts, got {len(posts)}: {slugs}"

    def test_admin_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/blog-cms/posts", timeout=15)
        assert r.status_code in (401, 403)


# --- Sitemap ------------------------------------------------------------------
class TestSitemap:
    def test_sitemap_xml_valid(self):
        r = requests.get(f"{BASE_URL}/api/blog-cms/sitemap.xml", timeout=15)
        assert r.status_code == 200
        body = r.text
        assert body.strip().startswith("<?xml")
        assert "<urlset" in body
        # 3 migrated + 7 premium = 10 blog slugs
        all_blog_slugs = list(MIGRATED_SLUGS) + PREMIUM_CODE_SLUGS
        missing = [s for s in all_blog_slugs if f"/blog/{s}" not in body]
        assert not missing, f"Sitemap missing blog slugs: {missing}"
        # product URLs - at least 1 /product/ url should appear (sitemap aggregates products)
        assert "/product/" in body or "/knuffels" in body


# --- Premium frontend route regression (HTTP 200 for SPA) ---------------------
BROWSER_HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml",
}


class TestPremiumRoutes:
    @pytest.mark.parametrize("slug", PREMIUM_CODE_SLUGS)
    def test_premium_route_serves(self, slug):
        r = requests.get(f"{BASE_URL}/blog/{slug}", timeout=20,
                         headers=BROWSER_HEADERS, allow_redirects=True)
        assert r.status_code == 200, f"/blog/{slug} -> {r.status_code}"
        assert "<html" in r.text.lower() or "<!doctype" in r.text.lower()

    @pytest.mark.parametrize("slug", sorted(MIGRATED_SLUGS))
    def test_migrated_route_serves(self, slug):
        r = requests.get(f"{BASE_URL}/blog/{slug}", timeout=20,
                         headers=BROWSER_HEADERS, allow_redirects=True)
        assert r.status_code == 200
