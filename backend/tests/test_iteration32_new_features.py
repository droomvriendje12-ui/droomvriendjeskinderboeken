"""Iteration 32: backend tests for new features
- /api/inbox/{id}/ai-draft (GPT-5.2 concept)
- /api/inbox/compose + /api/inbox/{id}/reply with attachments (metadata only persisted)
- /api/b2b/research-signup (public) -> outreach_leads visible in /api/outreach/leads
"""
import os
import base64
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "Droomvriendjes2024!"
TEST_RECIPIENT = "delivered@resend.dev"


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(api):
    r = api.post(f"{BASE_URL}/api/admin/login",
                 json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    tok = r.json().get("token")
    assert tok, "No token in admin login response"
    return tok


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# ===========================  INBOX AI DRAFT ===========================

@pytest.fixture(scope="module")
def ingested_message_id(api, admin_headers):
    """Ingest a test inbox message used across AI-draft + reply tests."""
    unique = uuid.uuid4().hex[:8]
    raw = (
        f"From: TestKlant <klant_{unique}@example.com>\r\n"
        f"To: info@droomvriendjes.com\r\n"
        f"Subject: TEST_iter32 Vraag over Slimme Leeuw\r\n"
        f"Message-ID: <test-iter32-{unique}@example.com>\r\n"
        f"Date: Mon, 5 Jan 2026 10:00:00 +0000\r\n"
        f"Content-Type: text/plain; charset=utf-8\r\n\r\n"
        "Hoi, hoe lang gaat de accu mee van de Slimme Leeuw en wat kost hij? Groet, Sanne"
    )
    r = api.post(f"{BASE_URL}/api/inbox/dev/ingest-raw",
                 json={"raw": raw}, headers=admin_headers)
    assert r.status_code == 200, f"ingest failed: {r.text}"
    mid = r.json().get("id")
    assert mid
    yield mid
    # Cleanup
    try:
        api.delete(f"{BASE_URL}/api/inbox/{mid}?hard=true", headers=admin_headers)
    except Exception:
        pass


class TestAIDraft:
    def test_ai_draft_returns_non_empty_text(self, api, admin_headers, ingested_message_id):
        r = api.post(f"{BASE_URL}/api/inbox/{ingested_message_id}/ai-draft",
                     headers=admin_headers, timeout=45)
        assert r.status_code == 200, f"ai-draft failed: {r.status_code} {r.text}"
        data = r.json()
        assert "draft" in data
        draft = data["draft"]
        assert isinstance(draft, str) and len(draft.strip()) > 30, f"draft too short: {draft!r}"

    def test_ai_draft_404_on_unknown(self, api, admin_headers):
        r = api.post(f"{BASE_URL}/api/inbox/does-not-exist-xyz/ai-draft", headers=admin_headers)
        assert r.status_code == 404

    def test_ai_draft_requires_auth(self, api):
        r = requests.post(f"{BASE_URL}/api/inbox/whatever/ai-draft")
        assert r.status_code in (401, 403)


# ===========================  COMPOSE + REPLY WITH ATTACHMENTS ===========================

def _tiny_attachment():
    content = b"Hello from iteration 32 test attachment."
    return {
        "filename": "TEST_iter32.txt",
        "content": base64.b64encode(content).decode("ascii"),
        "content_type": "text/plain",
        "size": len(content),
    }


class TestComposeAttachments:
    def test_compose_with_attachment(self, api, admin_headers):
        payload = {
            "to": [TEST_RECIPIENT],
            "subject": "TEST_iter32 compose attachment",
            "body_html": "<p>Hallo, dit is een testbericht met bijlage.</p>",
            "body_text": "Hallo, dit is een testbericht met bijlage.",
            "attachments": [_tiny_attachment()],
        }
        r = api.post(f"{BASE_URL}/api/inbox/compose", json=payload, headers=admin_headers, timeout=30)
        assert r.status_code == 200, f"compose failed: {r.status_code} {r.text}"
        doc = r.json()
        assert doc.get("folder") == "sent"
        atts = doc.get("attachments") or []
        assert len(atts) == 1
        a = atts[0]
        assert a["filename"] == "TEST_iter32.txt"
        assert a["content_type"] == "text/plain"
        assert "content" not in a, "Base64 content must NOT be persisted"
        # Cleanup the sent test record
        sent_id = doc.get("id")
        if sent_id:
            d = api.delete(f"{BASE_URL}/api/inbox/{sent_id}?hard=true", headers=admin_headers)
            assert d.status_code == 200

    def test_reply_with_attachment(self, api, admin_headers, ingested_message_id):
        payload = {
            "body_html": "<p>Bedankt voor je vraag, Sanne. Hier de info.</p>",
            "body_text": "Bedankt voor je vraag, Sanne.",
            "to": [TEST_RECIPIENT],
            "attachments": [_tiny_attachment()],
        }
        r = api.post(f"{BASE_URL}/api/inbox/{ingested_message_id}/reply",
                     json=payload, headers=admin_headers, timeout=30)
        assert r.status_code == 200, f"reply failed: {r.status_code} {r.text}"
        doc = r.json()
        assert doc.get("folder") == "sent"
        atts = doc.get("attachments") or []
        assert len(atts) == 1 and atts[0]["filename"] == "TEST_iter32.txt"
        assert "content" not in atts[0]
        # Cleanup
        sent_id = doc.get("id")
        if sent_id:
            api.delete(f"{BASE_URL}/api/inbox/{sent_id}?hard=true", headers=admin_headers)

    def test_attachment_too_large_returns_413(self, api, admin_headers):
        big = base64.b64encode(b"A" * (16 * 1024 * 1024)).decode("ascii")  # 16MB raw
        payload = {
            "to": [TEST_RECIPIENT],
            "subject": "TEST_iter32 oversized",
            "body_html": "<p>oversized</p>",
            "attachments": [{"filename": "big.bin", "content": big, "content_type": "application/octet-stream", "size": 16 * 1024 * 1024}],
        }
        r = api.post(f"{BASE_URL}/api/inbox/compose", json=payload, headers=admin_headers, timeout=30)
        assert r.status_code == 413, f"expected 413, got {r.status_code} {r.text[:200]}"


# ===========================  B2B RESEARCH SIGNUP ===========================

class TestB2BResearchSignup:
    created_lead_ids = []

    def test_signup_public_no_auth(self, api, admin_headers):
        unique = uuid.uuid4().hex[:8]
        email = f"TEST_iter32_{unique}@example.com"
        payload = {
            "naam": f"TEST_iter32 Lead {unique}",
            "email": email,
            "organisatie": "TestPraktijk",
            "rol": "slaapcoach",
            "telefoon": "0612345678",
            "kinderen_per_maand": "20",
            "licht_belang": "4",
            "geluid_belang": "5",
            "huidige_aanpak": "Witte ruis machine",
            "deelnemen": "ja",
            "bericht": "graag testpanel",
        }
        # No auth header
        r = requests.post(f"{BASE_URL}/api/b2b/research-signup", json=payload, timeout=20)
        assert r.status_code == 200, f"signup failed: {r.status_code} {r.text}"
        data = r.json()
        assert data.get("status") == "ok"
        lead_id = data.get("id")
        assert lead_id

        # Visible in leads list
        time.sleep(0.3)
        list_r = api.get(f"{BASE_URL}/api/outreach/leads?search={email}", headers=admin_headers)
        assert list_r.status_code == 200, list_r.text
        body = list_r.json()
        items = body.get("items") or body.get("leads") or body
        if isinstance(items, dict):
            items = items.get("items", [])
        found = [x for x in items if x.get("id") == lead_id or x.get("email", "").lower() == email.lower()]
        assert found, f"Lead {email} not found in /api/outreach/leads response: {body!r}"
        lead = found[0]
        assert lead.get("source") == "B2B Onderzoek"
        assert lead.get("type") == "slaapcoach"

        # Cleanup
        d = api.delete(f"{BASE_URL}/api/outreach/leads/{lead_id}", headers=admin_headers)
        assert d.status_code in (200, 204), f"delete lead failed: {d.status_code} {d.text}"

    def test_signup_invalid_email_returns_400(self):
        r = requests.post(f"{BASE_URL}/api/b2b/research-signup",
                          json={"naam": "TEST_iter32 BadMail", "email": "not-an-email"},
                          timeout=15)
        assert r.status_code == 400, f"expected 400, got {r.status_code} {r.text}"
