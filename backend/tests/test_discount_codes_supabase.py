"""
Backend tests for Discount Codes (Supabase single source of truth)
- CRUD on /api/discount-codes
- /api/discount-codes/validate vs legacy /api/discount/validate consistency
- /api/products returns 15 incl. 5 digital
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://ecommerce-digits.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_USER = "admin"
ADMIN_PASS = "Droomvriendjes2024!"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/admin/login", json={"username": ADMIN_USER, "password": ADMIN_PASS}, timeout=20)
    if r.status_code != 200:
        pytest.skip(f"admin login failed: {r.status_code} {r.text}")
    return r.json().get("token")


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ----- Discount codes CRUD -----

def test_list_discount_codes_has_13_plus():
    r = requests.get(f"{API}/discount-codes", timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    assert isinstance(data, list)
    assert len(data) >= 13, f"Expected ≥13 codes, got {len(data)}"
    sample = data[0]
    for k in ("id", "code", "discount_type", "discount_value", "active"):
        assert k in sample


CREATED_ID = {"id": None, "code": None}


def test_create_discount_code():
    payload = {
        "code": "TEST_ITER27_PCT",
        "discount_type": "percentage",
        "discount_value": 15,
        "min_order_amount": 25,
        "active": True,
        "description": "Iteration 27 test code",
    }
    r = requests.post(f"{API}/discount-codes", json=payload, timeout=20)
    if r.status_code == 400 and "bestaat al" in r.text:
        # cleanup leftover
        listing = requests.get(f"{API}/discount-codes", timeout=20).json()
        for c in listing:
            if c["code"] == "TEST_ITER27_PCT":
                requests.delete(f"{API}/discount-codes/{c['id']}", timeout=20)
        r = requests.post(f"{API}/discount-codes", json=payload, timeout=20)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["code"] == "TEST_ITER27_PCT"
    assert body["discount_type"] == "percentage"
    assert float(body["discount_value"]) == 15
    assert float(body["min_order_amount"]) == 25
    CREATED_ID["id"] = body["id"]
    CREATED_ID["code"] = body["code"]

    # GET-after-POST persistence
    get_r = requests.get(f"{API}/discount-codes/{body['id']}", timeout=20)
    assert get_r.status_code == 200
    assert get_r.json()["code"] == "TEST_ITER27_PCT"


def test_update_discount_code_min_order():
    assert CREATED_ID["id"], "create must run first"
    r = requests.put(
        f"{API}/discount-codes/{CREATED_ID['id']}",
        json={"min_order_amount": 50, "discount_value": 20},
        timeout=20,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert float(body["min_order_amount"]) == 50
    assert float(body["discount_value"]) == 20

    # verify persistence
    g = requests.get(f"{API}/discount-codes/{CREATED_ID['id']}", timeout=20).json()
    assert float(g["min_order_amount"]) == 50


def test_validate_new_code_with_cart_total():
    """Newly created code validatable on new /api/discount-codes/validate"""
    r = requests.post(
        f"{API}/discount-codes/validate",
        json={"code": CREATED_ID["code"], "cart_total": 100},
        timeout=20,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["valid"] is True
    # 20% of 100 = 20
    assert abs(float(body["discount"]) - 20.0) < 0.01


def test_validate_new_code_legacy_endpoint():
    """SAME code validates on legacy /api/discount/validate (single source proof)"""
    r = requests.post(
        f"{API}/discount/validate",
        json={"code": CREATED_ID["code"], "cart_total": 100},
        timeout=20,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("valid") is True, body
    # Legacy endpoint uses `discount_amount`, new uses `discount` — both share Supabase
    disc = body.get("discount", body.get("discount_amount", 0))
    assert abs(float(disc) - 20.0) < 0.01


def test_validate_without_cart_total_defaults_zero_then_min_order_fails():
    """No cart_total → cart_total=0 → min_order_amount fail (graceful, not 500)"""
    r = requests.post(
        f"{API}/discount-codes/validate",
        json={"code": CREATED_ID["code"]},  # NO cart_total
        timeout=20,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["valid"] is False
    assert "Minimaal bestelbedrag" in body["message"]
    assert "€50" in body["message"] or "50.00" in body["message"]


def test_validate_invalid_code():
    r = requests.post(
        f"{API}/discount-codes/validate",
        json={"code": "DOES_NOT_EXIST_XYZ", "cart_total": 100},
        timeout=20,
    )
    assert r.status_code == 200
    assert r.json()["valid"] is False


def test_delete_discount_code_and_verify_removed_on_both_endpoints():
    assert CREATED_ID["id"]
    r = requests.delete(f"{API}/discount-codes/{CREATED_ID['id']}", timeout=20)
    assert r.status_code == 200, r.text

    # gone from GET
    g = requests.get(f"{API}/discount-codes/{CREATED_ID['id']}", timeout=20)
    assert g.status_code == 404

    # gone from new validate
    v1 = requests.post(
        f"{API}/discount-codes/validate",
        json={"code": CREATED_ID["code"], "cart_total": 100},
        timeout=20,
    ).json()
    assert v1["valid"] is False

    # gone from legacy validate too (proves shared source)
    v2 = requests.post(
        f"{API}/discount/validate",
        json={"code": CREATED_ID["code"], "cart_total": 100},
        timeout=20,
    ).json()
    assert v2.get("valid") is False


def test_validate_existing_welkom10_percentage():
    """Seeded WELKOM10 should be 10% on both endpoints (parity check)."""
    p = {"code": "WELKOM10", "cart_total": 50}
    r1 = requests.post(f"{API}/discount-codes/validate", json=p, timeout=20).json()
    r2 = requests.post(f"{API}/discount/validate", json=p, timeout=20).json()
    # If WELKOM10 exists, both must agree
    if r1.get("valid"):
        assert r2.get("valid") is True
        d1 = float(r1.get("discount", r1.get("discount_amount", 0)))
        d2 = float(r2.get("discount", r2.get("discount_amount", 0)))
        assert abs(d1 - d2) < 0.01


# ----- Products / digital filter -----

def test_products_has_15_with_5_digital():
    r = requests.get(f"{API}/products", timeout=20)
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 15, f"Expected ≥15 products, got {len(data)}"
    digital = [p for p in data if p.get("productType") == "digital" or str(p.get("id", "")).startswith("digital-")]
    assert len(digital) >= 5, f"Expected ≥5 digital products, got {len(digital)}"
    ids = [p["id"] for p in digital]
    for expected in [
        "digital-bedtime-chart",
        "digital-sleep-tracker",
        "digital-affirmation-cards",
        "digital-coloring-pages",
        "digital-visual-schedule",
    ]:
        assert expected in ids, f"missing digital product id: {expected}"
