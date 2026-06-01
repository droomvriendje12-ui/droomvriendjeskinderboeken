"""
Iteration 33 backend tests:
- Sitemap (blog_cms.py) with products + blogs
- Ads Builder generate + export-csv (admin-protected)
- Shopping Feed Builder audit + optimize + export.csv + export.xml
- Existing /api/feed/google-shopping.xml still intact
- Outreach AI-draft uses keywords; /send guardrails still in place
"""
import os
import re
import pytest
import requests
import xml.etree.ElementTree as ET

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/") or "https://ecommerce-digits.preview.emergentagent.com"
ADMIN_USER = "admin"
ADMIN_PASS = "Droomvriendjes2024!"


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/admin/login", json={"username": ADMIN_USER, "password": ADMIN_PASS}, timeout=30)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---------- Sitemap ----------
class TestSitemap:
    def test_sitemap_xml_status(self):
        r = requests.get(f"{BASE_URL}/api/blog-cms/sitemap.xml", timeout=30)
        assert r.status_code == 200
        ct = r.headers.get("content-type", "")
        assert "xml" in ct.lower(), f"unexpected content-type: {ct}"

    def test_sitemap_includes_blogs_and_products(self):
        r = requests.get(f"{BASE_URL}/api/blog-cms/sitemap.xml", timeout=30)
        root = ET.fromstring(r.text)
        ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        locs = [el.text for el in root.findall(".//sm:loc", ns)]
        assert len(locs) >= 25, f"expected many urls, got {len(locs)}"
        # has product URLs
        product_locs = [l for l in locs if "/product/" in l]
        assert len(product_locs) >= 10, f"expected product URLs, got {len(product_locs)}"
        # has blog URLs
        blog_locs = [l for l in locs if "/blog/" in l]
        assert len(blog_locs) >= 10, f"expected 10 blog URLs, got {len(blog_locs)}"


# ---------- Ads Builder ----------
class TestAdsBuilder:
    def test_generate_requires_auth(self):
        r = requests.post(f"{BASE_URL}/api/ads-builder/generate", json={"theme": "nachtlampje"}, timeout=30)
        assert r.status_code in (401, 403), f"expected 401/403 without token got {r.status_code}"

    def test_generate_campaign(self, auth_headers):
        body = {
            "product_focus": "Slaapknuffel met nachtlampje",
            "seed_keywords": ["slaapknuffel", "kalmerende knuffel", "nachtlampje kind"],
            "daily_budget": 25,
            "language": "nl",
        }
        r = requests.post(f"{BASE_URL}/api/ads-builder/generate", headers=auth_headers, json=body, timeout=120)
        assert r.status_code == 200, f"generate failed {r.status_code} {r.text[:400]}"
        data = r.json()
        assert "campaign_name" in data and data["campaign_name"]
        assert "ad_groups" in data and isinstance(data["ad_groups"], list)
        assert len(data["ad_groups"]) >= 3, f"expected >=3 ad_groups, got {len(data['ad_groups'])}"
        for ag in data["ad_groups"]:
            assert ag.get("keywords"), "ad group missing keywords"
            # each keyword should have match type
            for kw in ag["keywords"]:
                assert "match" in kw or "match_type" in kw, f"keyword missing match info: {kw}"
            assert ag.get("headlines"), "ad group missing headlines"
            assert ag.get("descriptions"), "ad group missing descriptions"
        assert "sitelinks" in data
        assert "callouts" in data
        assert "negative_keywords" in data
        # cache for next test
        pytest.shared_campaign = data

    def test_export_csv(self, auth_headers):
        campaign = getattr(pytest, "shared_campaign", None)
        if not campaign:
            pytest.skip("no campaign cached")
        r = requests.post(f"{BASE_URL}/api/ads-builder/export-csv", headers=auth_headers, json={"campaign": campaign}, timeout=60)
        assert r.status_code == 200, f"export-csv failed: {r.status_code} {r.text[:400]}"
        ct = r.headers.get("content-type", "")
        assert "csv" in ct.lower(), f"expected csv content-type, got {ct}"
        body = r.text
        # google ads editor csv usually has a header line; just sanity check
        assert "," in body and len(body) > 50


# ---------- Shopping Feed ----------
class TestShoppingFeed:
    def test_audit_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/shopping-feed/audit", timeout=30)
        assert r.status_code in (401, 403), f"expected 401/403 got {r.status_code}"

    def test_audit_returns_summary(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/shopping-feed/audit", headers=auth_headers, timeout=120)
        assert r.status_code == 200, f"audit failed {r.status_code} {r.text[:400]}"
        data = r.json()
        # summary
        summary = data.get("summary") or {}
        assert "total_products" in summary
        assert summary["total_products"] >= 10, f"expected >=10 products, got {summary['total_products']}"
        for k in ("avg_merchant_readiness", "avg_shopping_seo", "gtin_missing"):
            assert k in summary, f"summary missing {k}"
        # products
        products = data.get("products") or []
        assert len(products) == summary["total_products"]
        sample = products[0]
        for k in ("merchant_readiness_score", "shopping_seo_score", "missing_attributes", "gtin_status", "product_type"):
            assert k in sample, f"product missing key {k}: {sample.keys()}"

    def test_optimize_product_14(self, auth_headers):
        # capture pre-score
        before = requests.get(f"{BASE_URL}/api/shopping-feed/audit", headers=auth_headers, timeout=60).json()
        pre_product = next((p for p in before["products"] if str(p.get("id")) == "14"), None)
        pre_seo = pre_product["shopping_seo_score"] if pre_product else None

        r = requests.post(
            f"{BASE_URL}/api/shopping-feed/optimize",
            headers=auth_headers,
            json={"product_id": "14", "save": True},
            timeout=120,
        )
        assert r.status_code == 200, f"optimize failed {r.status_code} {r.text[:400]}"
        data = r.json()
        for k in ("title", "description", "product_type", "google_product_category"):
            assert data.get(k), f"optimize missing {k}: keys={list(data.keys())}"
        assert data.get("suggested_keywords"), "missing suggested_keywords"

        # re-audit
        after = requests.get(f"{BASE_URL}/api/shopping-feed/audit", headers=auth_headers, timeout=60).json()
        post_product = next((p for p in after["products"] if str(p.get("id")) == "14"), None)
        assert post_product is not None
        assert post_product.get("has_override") is True, "expected has_override=True after save"
        # SEO score after optimize: should be reasonable (>=70). Note: LLM is non-deterministic
        # and pre_seo may already reflect a prior override - we only assert reasonable score.
        assert post_product["shopping_seo_score"] >= 70, (
            f"expected SEO >= 70 after optimize, got {post_product['shopping_seo_score']} (pre={pre_seo})"
        )

    def test_export_csv(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/shopping-feed/export.csv", headers=auth_headers, timeout=60)
        assert r.status_code == 200
        ct = r.headers.get("content-type", "")
        assert "csv" in ct.lower()
        # BOM check
        raw = r.content
        assert raw.startswith(b"\xef\xbb\xbf") or raw[:1] == b"\xef", "expected UTF-8 BOM"

    def test_export_xml(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/shopping-feed/export.xml", headers=auth_headers, timeout=60)
        assert r.status_code == 200
        assert "xml" in r.headers.get("content-type", "").lower()
        # parseable
        ET.fromstring(r.text)

    def test_existing_google_shopping_feed_unchanged(self):
        # public endpoint (no auth)
        r = requests.get(f"{BASE_URL}/api/feed/google-shopping.xml", timeout=60)
        assert r.status_code == 200, f"existing feed broken: {r.status_code}"
        assert "xml" in r.headers.get("content-type", "").lower()
        ET.fromstring(r.text)


# ---------- Outreach AI-draft + guardrails ----------
class TestOutreach:
    @pytest.fixture(scope="class")
    def test_lead_id(self, auth_headers):
        # use an existing lead (with email) from /api/outreach/leads
        r = requests.get(f"{BASE_URL}/api/outreach/leads?limit=5", headers=auth_headers, timeout=30)
        if r.status_code != 200:
            pytest.skip(f"could not list leads: {r.status_code}")
        items = r.json().get("items") or r.json().get("leads") or []
        with_email = [l for l in items if l.get("email") and l.get("email_valid")]
        if not with_email:
            pytest.skip("no leads with valid email found")
        yield with_email[0]["id"]

    def test_ai_draft_uses_keywords(self, auth_headers, test_lead_id):
        body = {"keywords": "10-Nachten Challenge, TikTok", "campaign": "Slaap-influencer outreach"}
        r = requests.post(
            f"{BASE_URL}/api/outreach/leads/{test_lead_id}/ai-draft",
            headers=auth_headers,
            json=body,
            timeout=120,
        )
        assert r.status_code == 200, f"ai-draft failed: {r.status_code} {r.text[:400]}"
        data = r.json()
        subject = (data.get("subject") or "").lower()
        bodyt = (data.get("body") or "").lower()
        combined = subject + " " + bodyt
        # at least one of the keywords should appear in the draft
        assert ("10-nachten" in combined) or ("tiktok" in combined) or ("nachten challenge" in combined), (
            f"keywords not reflected in draft: subj={subject!r} body[:200]={bodyt[:200]!r}"
        )

    def test_send_guardrails_constants_present(self):
        # Do NOT actually call /send (would send real mail to real leads). Verify code-level guardrails.
        with open("/app/backend/routes/outreach.py", "r") as f:
            src = f.read()
        assert "SEND_PER_REQUEST_LIMIT = 50" in src, "per-request limit constant missing/changed"
        assert "SEND_DAILY_LIMIT = 150" in src, "daily limit constant missing/changed"
        assert "remaining_daily" in src and "allowed_now" in src, "guardrail logic missing"
