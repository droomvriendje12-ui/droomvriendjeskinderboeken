"""Tests for the AI story generator endpoints (/api/story/quota, /api/story/preview).

We intentionally do NOT trigger a successful generation (LLM cost + 2/day IP limit).
We only test:
  - GET /api/story/quota structure
  - POST /api/story/preview validation (400) for missing name and missing theme
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback for tests run inside container
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                break


@pytest.fixture
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


class TestStoryQuota:
    def test_quota_structure(self, client):
        r = client.get(f"{BASE_URL}/api/story/quota", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "used" in data and "limit" in data and "remaining" in data
        assert data["limit"] == 2
        assert isinstance(data["used"], int)
        assert isinstance(data["remaining"], int)
        assert data["remaining"] == max(0, data["limit"] - data["used"])


class TestStoryPreviewValidation:
    def test_missing_name_returns_400(self, client):
        payload = {"theme": "de dappere kleine ridder", "characters": [{"name": "", "photo_base64": None}]}
        r = client.post(f"{BASE_URL}/api/story/preview", json=payload, timeout=15)
        assert r.status_code == 400, r.text
        body = r.json()
        assert "detail" in body
        assert "hoofdpersoon" in body["detail"].lower() or "naam" in body["detail"].lower()

    def test_missing_theme_returns_400(self, client):
        payload = {"theme": "", "characters": [{"name": "Noor", "photo_base64": None}]}
        r = client.post(f"{BASE_URL}/api/story/preview", json=payload, timeout=15)
        assert r.status_code == 400, r.text
        body = r.json()
        assert "detail" in body
        assert "thema" in body["detail"].lower()

    def test_missing_characters_returns_400(self, client):
        payload = {"theme": "de maan", "characters": []}
        r = client.post(f"{BASE_URL}/api/story/preview", json=payload, timeout=15)
        assert r.status_code == 400, r.text
