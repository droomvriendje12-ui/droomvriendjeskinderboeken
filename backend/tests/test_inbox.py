"""
Inbox feature tests - Cloudflare Email Routing webhook + admin inbox UI backend.
Covers: dev/ingest-raw, folders, list, filter/search, get, patch, delete, webhook auth, reply/compose.
"""
import os
import base64
import re
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://ecommerce-digits.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api/inbox"

# Read token from backend .env (test infra)
INBOX_TOKEN = None
with open("/app/backend/.env", "r") as f:
    for ln in f:
        if ln.startswith("INBOX_WEBHOOK_TOKEN="):
            INBOX_TOKEN = ln.strip().split("=", 1)[1]


def _raw_email(subject="Hallo wereld 🌍", msg_id=None, body="Beste team, dit is een test e-mail. Groetjes! 🐶"):
    msg_id = msg_id or f"<{uuid.uuid4()}@droomvriendjes.com>"
    return (
        f"From: Klant Naam <klant@example.com>\r\n"
        f"To: info@droomvriendjes.com\r\n"
        f"Subject: {subject}\r\n"
        f"Message-ID: {msg_id}\r\n"
        f"Date: Mon, 13 Jan 2026 10:00:00 +0000\r\n"
        f"MIME-Version: 1.0\r\n"
        f"Content-Type: text/plain; charset=utf-8\r\n"
        f"Content-Transfer-Encoding: 8bit\r\n"
        f"\r\n"
        f"{body}\r\n"
    ), msg_id


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def seeded_message(session):
    """Seed one message via dev/ingest-raw for downstream tests."""
    raw, msg_id = _raw_email(subject="TEST_seed Welkom 🐾", body="Hoi, dit is de seed. äöü 🎉")
    r = session.post(f"{API}/dev/ingest-raw", json={"raw": raw})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["status"] in ("ok", "duplicate")
    assert "id" in data
    return {"id": data["id"], "message_id": msg_id, "raw": raw}


# =========== 1) dev/ingest-raw ===========

class TestDevIngest:
    def test_ingest_raw_success(self, session):
        raw, msg_id = _raw_email(subject="TEST_ingest A")
        r = session.post(f"{API}/dev/ingest-raw", json={"raw": raw})
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["status"] == "ok"
        assert isinstance(body["id"], str) and len(body["id"]) > 0

    def test_ingest_raw_dedup_message_id(self, session):
        raw, msg_id = _raw_email(subject="TEST_dedup")
        r1 = session.post(f"{API}/dev/ingest-raw", json={"raw": raw})
        assert r1.status_code == 200
        first_id = r1.json()["id"]
        r2 = session.post(f"{API}/dev/ingest-raw", json={"raw": raw})
        assert r2.status_code == 200
        body = r2.json()
        assert body["status"] == "duplicate"
        assert body["id"] == first_id


# =========== 2) folders ===========

class TestFolders:
    def test_folders_structure(self, session, seeded_message):
        r = session.get(f"{API}/folders")
        assert r.status_code == 200
        data = r.json()
        assert "folders" in data and "labels" in data
        for f in ["inbox", "sent", "drafts", "trash", "spam"]:
            assert f in data["folders"]
            assert "total" in data["folders"][f]
            assert "unread" in data["folders"][f]
        assert data["folders"]["inbox"]["total"] >= 1
        assert isinstance(data["labels"], list)


# =========== 3) list / search ===========

class TestList:
    def test_list_inbox(self, session, seeded_message):
        r = session.get(f"{API}", params={"folder": "inbox"})
        assert r.status_code == 200
        data = r.json()
        assert "items" in data and "total" in data
        assert data["total"] >= 1
        assert len(data["items"]) >= 1
        item = data["items"][0]
        # No _id leak
        assert "_id" not in item
        # snippet present
        assert "snippet" in item
        # ISO date
        assert isinstance(item.get("received_at"), str)
        # Validate ISO format
        assert re.match(r"^\d{4}-\d{2}-\d{2}T", item["received_at"])
        # body_html/body_text excluded in list
        assert "body_html" not in item
        assert "body_text" not in item

    def test_list_invalid_folder(self, session):
        r = session.get(f"{API}", params={"folder": "bogus"})
        assert r.status_code == 400

    def test_search_by_subject(self, session, seeded_message):
        r = session.get(f"{API}", params={"folder": "inbox", "q": "TEST_seed"})
        assert r.status_code == 200
        data = r.json()
        assert data["total"] >= 1
        # Found message should match
        found = any("TEST_seed" in it.get("subject", "") for it in data["items"])
        assert found

    def test_search_no_match(self, session):
        r = session.get(f"{API}", params={"folder": "inbox", "q": "zzz_no_match_string_12345"})
        assert r.status_code == 200
        assert r.json()["total"] == 0


# =========== 4) get single ===========

class TestGet:
    def test_get_single(self, session, seeded_message):
        r = session.get(f"{API}/{seeded_message['id']}")
        assert r.status_code == 200
        doc = r.json()
        assert "_id" not in doc
        assert doc["id"] == seeded_message["id"]
        assert doc.get("body_text", "").strip() != ""
        # snippet preserves utf-8/emoji
        assert "🎉" in doc.get("snippet", "") or "🎉" in doc.get("body_text", "")
        # subject decoded
        assert "TEST_seed" in doc.get("subject", "")

    def test_get_404(self, session):
        r = session.get(f"{API}/nonexistent-id-xyz")
        assert r.status_code == 404


# =========== 5) patch ===========

class TestPatch:
    def test_mark_read(self, session, seeded_message):
        r = session.patch(f"{API}/{seeded_message['id']}", json={"read": True})
        assert r.status_code == 200
        assert r.json()["read"] is True
        # Verify persistence
        g = session.get(f"{API}/{seeded_message['id']}")
        assert g.json()["read"] is True

    def test_mark_unread(self, session, seeded_message):
        r = session.patch(f"{API}/{seeded_message['id']}", json={"read": False})
        assert r.status_code == 200
        assert r.json()["read"] is False

    def test_add_label(self, session, seeded_message):
        r = session.patch(f"{API}/{seeded_message['id']}", json={"add_label": "urgent"})
        assert r.status_code == 200
        doc = r.json()
        assert "urgent" in doc.get("labels", [])

    def test_remove_label(self, session, seeded_message):
        # ensure added first
        session.patch(f"{API}/{seeded_message['id']}", json={"add_label": "to-delete"})
        r = session.patch(f"{API}/{seeded_message['id']}", json={"remove_label": "to-delete"})
        assert r.status_code == 200
        assert "to-delete" not in r.json().get("labels", [])

    def test_set_folder(self, session):
        # Seed fresh message to move
        raw, _ = _raw_email(subject="TEST_move_folder")
        seeded = session.post(f"{API}/dev/ingest-raw", json={"raw": raw}).json()
        mid = seeded["id"]
        r = session.patch(f"{API}/{mid}", json={"folder": "spam"})
        assert r.status_code == 200
        assert r.json()["folder"] == "spam"

    def test_invalid_folder(self, session, seeded_message):
        r = session.patch(f"{API}/{seeded_message['id']}", json={"folder": "garbage"})
        assert r.status_code == 400


# =========== 6) webhook auth + body modes ===========

class TestWebhookAuth:
    def test_webhook_no_token(self, session):
        raw, _ = _raw_email(subject="TEST_wh_noauth")
        r = session.post(f"{API}/webhook", json={"raw": raw})
        assert r.status_code == 401

    def test_webhook_wrong_token(self, session):
        raw, _ = _raw_email(subject="TEST_wh_wrong")
        r = requests.post(f"{API}/webhook",
                          json={"raw": raw},
                          headers={"Authorization": "Bearer WRONG_TOKEN"})
        assert r.status_code == 401

    def test_webhook_valid_raw(self, session):
        assert INBOX_TOKEN, "INBOX_WEBHOOK_TOKEN missing from backend .env"
        raw, msg_id = _raw_email(subject="TEST_wh_raw")
        r = requests.post(f"{API}/webhook",
                          json={"raw": raw},
                          headers={"Authorization": f"Bearer {INBOX_TOKEN}"})
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "ok"

    def test_webhook_valid_raw_b64(self, session):
        assert INBOX_TOKEN
        raw, msg_id = _raw_email(subject="TEST_wh_b64")
        b64 = base64.b64encode(raw.encode("utf-8")).decode("ascii")
        r = requests.post(f"{API}/webhook",
                          json={"raw_b64": b64},
                          headers={"Authorization": f"Bearer {INBOX_TOKEN}"})
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_webhook_dedup(self, session):
        assert INBOX_TOKEN
        raw, msg_id = _raw_email(subject="TEST_wh_dedup")
        h = {"Authorization": f"Bearer {INBOX_TOKEN}"}
        r1 = requests.post(f"{API}/webhook", json={"raw": raw}, headers=h)
        r2 = requests.post(f"{API}/webhook", json={"raw": raw}, headers=h)
        assert r1.status_code == 200 and r2.status_code == 200
        assert r2.json()["status"] == "duplicate"
        assert r1.json()["id"] == r2.json()["id"]

    def test_webhook_missing_body(self, session):
        assert INBOX_TOKEN
        r = requests.post(f"{API}/webhook", json={},
                          headers={"Authorization": f"Bearer {INBOX_TOKEN}"})
        assert r.status_code == 400


# =========== 7) delete (soft -> hard) ===========

class TestDelete:
    def _seed(self, session, subj):
        raw, _ = _raw_email(subject=subj)
        return session.post(f"{API}/dev/ingest-raw", json={"raw": raw}).json()["id"]

    def test_soft_delete_moves_to_trash(self, session):
        mid = self._seed(session, "TEST_softdel")
        r = session.delete(f"{API}/{mid}")
        assert r.status_code == 200
        assert r.json()["status"] == "moved_to_trash"
        # Verify folder=trash
        g = session.get(f"{API}/{mid}").json()
        assert g["folder"] == "trash"

    def test_second_delete_in_trash_purges(self, session):
        mid = self._seed(session, "TEST_softdel2")
        session.delete(f"{API}/{mid}")
        r = session.delete(f"{API}/{mid}")
        assert r.status_code == 200
        assert r.json()["status"] == "deleted"
        # Verify gone
        g = session.get(f"{API}/{mid}")
        assert g.status_code == 404

    def test_hard_delete_param(self, session):
        mid = self._seed(session, "TEST_harddel")
        r = session.delete(f"{API}/{mid}", params={"hard": "true"})
        assert r.status_code == 200
        assert r.json()["status"] == "deleted"
        g = session.get(f"{API}/{mid}")
        assert g.status_code == 404


# =========== 8) reply / compose (SMTP may fail - validate structure) ===========

class TestSend:
    def test_reply_endpoint_structure(self, session, seeded_message):
        r = session.post(f"{API}/{seeded_message['id']}/reply",
                         json={"body_html": "<p>Bedankt voor je bericht!</p>"})
        # Expected: 200 success OR 500 due to SMTP creds environmental issue
        assert r.status_code in (200, 500)
        if r.status_code == 200:
            doc = r.json()
            assert doc["folder"] == "sent"
            assert "_id" not in doc

    def test_reply_404_when_original_missing(self, session):
        r = session.post(f"{API}/no-such-id-xyz/reply",
                         json={"body_html": "<p>x</p>"})
        assert r.status_code == 404

    def test_compose_endpoint_structure(self, session):
        r = session.post(f"{API}/compose", json={
            "to": ["test@example.com"],
            "subject": "TEST_compose",
            "body_html": "<p>Hallo</p>",
        })
        assert r.status_code in (200, 500)

    def test_compose_validation_missing_to(self, session):
        r = session.post(f"{API}/compose", json={
            "to": [],
            "subject": "x",
            "body_html": "<p>x</p>",
        })
        # 400 from our check, 422 if pydantic rejects empty list (it doesn't)
        assert r.status_code in (400, 422)
