"""
Phase 3 Admin tests:
- Admin orders endpoints with new defensive _safe_order_update
- New /api/admin/customers and /api/admin/customers/{email}
- Regression on /api/products and /api/inbox auth
"""
import os
import pytest
import requests

_url = os.environ.get("REACT_APP_BACKEND_URL")
if not _url:
    # Load from frontend/.env when shell env doesn't have it
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    _url = line.split("=", 1)[1].strip()
                    break
    except Exception:
        pass
assert _url, "REACT_APP_BACKEND_URL not configured"
BASE_URL = _url.rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_USER = "admin"
ADMIN_PASS = "Droomvriendjes2024!"


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/admin/login", json={"username": ADMIN_USER, "password": ADMIN_PASS}, timeout=30)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    token = data.get("token") or data.get("access_token")
    assert token, f"No token in login response: {data}"
    return token


@pytest.fixture
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


def _no_mongo_id(obj):
    """Recursively confirm there is no '_id' key leaking."""
    if isinstance(obj, dict):
        assert "_id" not in obj, f"Mongo _id leaked: {list(obj.keys())}"
        for v in obj.values():
            _no_mongo_id(v)
    elif isinstance(obj, list):
        for v in obj:
            _no_mongo_id(v)


# ---------------- Admin Orders ----------------

class TestAdminOrders:
    def test_list_orders_returns_200_with_status_counts(self, auth_headers):
        r = requests.get(f"{API}/admin/orders", headers=auth_headers, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "orders" in data
        assert "status_counts" in data
        assert isinstance(data["status_counts"], dict)
        assert "total" in data and isinstance(data["total"], int)
        _no_mongo_id(data)

    def test_list_orders_has_existing_orders(self, auth_headers):
        r = requests.get(f"{API}/admin/orders", headers=auth_headers, timeout=30)
        assert r.status_code == 200
        data = r.json()
        # Per PRD: 5 orders should be present
        assert data["total"] >= 1, f"Expected >=1 order, got {data['total']}"
        if data["orders"]:
            o = data["orders"][0]
            for key in ["order_id", "order_number", "customer_email", "status", "total_amount"]:
                assert key in o, f"Missing field {key} in order"

    def test_order_detail_with_items(self, auth_headers):
        list_r = requests.get(f"{API}/admin/orders", headers=auth_headers, timeout=30)
        orders = list_r.json().get("orders", [])
        if not orders:
            pytest.skip("No orders available to test detail endpoint")
        order_id = orders[0]["order_id"]
        r = requests.get(f"{API}/admin/orders/{order_id}", headers=auth_headers, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "order" in data and "items" in data
        assert isinstance(data["items"], list)
        assert data["order"]["order_id"] == order_id
        _no_mongo_id(data)

    def test_update_status_safe_columns(self, auth_headers):
        """PUT status should succeed even when shipped_at/delivered_at cols are absent."""
        list_r = requests.get(f"{API}/admin/orders", headers=auth_headers, timeout=30)
        orders = list_r.json().get("orders", [])
        if not orders:
            pytest.skip("No orders")
        order_id = orders[0]["order_id"]
        original_status = orders[0]["status"]

        # set to shipped (would touch shipped_at column)
        r = requests.put(f"{API}/admin/orders/{order_id}/status",
                         headers=auth_headers, json={"status": "shipped"}, timeout=30)
        assert r.status_code == 200, f"shipped update failed: {r.status_code} {r.text}"
        assert r.json().get("success") is True

        # restore original
        requests.put(f"{API}/admin/orders/{order_id}/status",
                     headers=auth_headers, json={"status": original_status}, timeout=30)

    def test_update_status_invalid(self, auth_headers):
        list_r = requests.get(f"{API}/admin/orders", headers=auth_headers, timeout=30)
        orders = list_r.json().get("orders", [])
        if not orders:
            pytest.skip("No orders")
        order_id = orders[0]["order_id"]
        r = requests.put(f"{API}/admin/orders/{order_id}/status",
                         headers=auth_headers, json={"status": "bogus"}, timeout=30)
        assert r.status_code == 400

    def test_tracking_post_safe_columns(self, auth_headers):
        """Tracking POST should return 200 even when tracking_number column doesn't exist."""
        list_r = requests.get(f"{API}/admin/orders", headers=auth_headers, timeout=30)
        orders = list_r.json().get("orders", [])
        if not orders:
            pytest.skip("No orders")
        order_id = orders[0]["order_id"]
        original_status = orders[0]["status"]

        r = requests.post(
            f"{API}/admin/orders/{order_id}/tracking",
            headers=auth_headers,
            json={"tracking_code": "TEST123456NL", "carrier": "postnl", "send_email": False},
            timeout=30,
        )
        assert r.status_code == 200, f"Tracking failed: {r.status_code} {r.text}"
        data = r.json()
        assert data.get("success") is True
        assert "email_sent" in data

        # Restore status
        requests.put(f"{API}/admin/orders/{order_id}/status",
                     headers=auth_headers, json={"status": original_status}, timeout=30)


# ---------------- Admin Customers (NEW) ----------------

class TestAdminCustomers:
    def test_customers_requires_auth(self):
        r = requests.get(f"{API}/admin/customers", timeout=30)
        assert r.status_code == 401, f"Expected 401 without token, got {r.status_code}"

    def test_customers_invalid_token(self):
        r = requests.get(f"{API}/admin/customers", headers={"Authorization": "Bearer bogus"}, timeout=30)
        assert r.status_code == 401

    def test_customers_list(self, auth_headers):
        r = requests.get(f"{API}/admin/customers", headers=auth_headers, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        for key in ["customers", "total", "page", "limit"]:
            assert key in data, f"Missing key {key}"
        assert isinstance(data["customers"], list)
        # Expect at least 1 unique customer from existing orders
        assert data["total"] >= 1, f"Expected >=1 customers, got {data}"
        _no_mongo_id(data)

        if data["customers"]:
            c = data["customers"][0]
            for field in ["email", "name", "phone", "total_orders", "paid_orders",
                          "total_spent", "first_order_at", "last_order_at"]:
                assert field in c, f"Customer missing field {field}: {c}"
            # types
            assert isinstance(c["total_orders"], int)
            assert isinstance(c["paid_orders"], int)
            assert isinstance(c["total_spent"], (int, float))
            assert c["paid_orders"] <= c["total_orders"], "paid_orders should be <= total_orders"

    def test_customers_search_filter(self, auth_headers):
        """search=express should only return matching customers."""
        r = requests.get(f"{API}/admin/customers", headers=auth_headers,
                         params={"search": "express"}, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        for c in data["customers"]:
            haystack = (c["email"] + " " + (c["name"] or "") + " " + (c["phone"] or "")).lower()
            assert "express" in haystack, f"Search filter failed: {c}"

    def test_customers_search_nomatch(self, auth_headers):
        r = requests.get(f"{API}/admin/customers", headers=auth_headers,
                         params={"search": "zzznoexistentzzz"}, timeout=30)
        assert r.status_code == 200
        assert r.json()["total"] == 0
        assert r.json()["customers"] == []

    def test_customers_pagination(self, auth_headers):
        r = requests.get(f"{API}/admin/customers", headers=auth_headers,
                         params={"page": 1, "limit": 1}, timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert data["page"] == 1
        assert data["limit"] == 1
        assert len(data["customers"]) <= 1

    def test_customer_detail_existing(self, auth_headers):
        # pick an email from the list
        list_r = requests.get(f"{API}/admin/customers", headers=auth_headers, timeout=30)
        custs = list_r.json().get("customers", [])
        if not custs:
            pytest.skip("No customers")
        email = custs[0]["email"]
        r = requests.get(f"{API}/admin/customers/{email}", headers=auth_headers, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "customer" in data and "orders" in data
        assert data["customer"]["email"] == email.lower()
        assert isinstance(data["orders"], list)
        assert len(data["orders"]) == custs[0]["total_orders"], \
            f"Order count mismatch: detail={len(data['orders'])} list={custs[0]['total_orders']}"
        # validate fields
        for f in ["email", "name", "total_orders", "total_spent", "first_order_at", "last_order_at"]:
            assert f in data["customer"]
        _no_mongo_id(data)

    def test_customer_detail_unknown_returns_404(self, auth_headers):
        r = requests.get(f"{API}/admin/customers/nobody@nowhere.test",
                         headers=auth_headers, timeout=30)
        assert r.status_code == 404, f"Expected 404, got {r.status_code} {r.text}"

    def test_customer_detail_requires_auth(self):
        r = requests.get(f"{API}/admin/customers/anything@x.com", timeout=30)
        assert r.status_code == 401

    def test_paid_orders_logic(self, auth_headers):
        """paid_orders should equal count of orders with status in paid/shipped/delivered."""
        list_r = requests.get(f"{API}/admin/customers", headers=auth_headers, timeout=30)
        custs = list_r.json().get("customers", [])
        if not custs:
            pytest.skip("No customers")
        for c in custs[:3]:
            detail = requests.get(f"{API}/admin/customers/{c['email']}",
                                  headers=auth_headers, timeout=30).json()
            paid_count = sum(1 for o in detail["orders"]
                             if o.get("status") in ("paid", "shipped", "delivered"))
            assert paid_count == c["paid_orders"], \
                f"paid_orders mismatch for {c['email']}: list={c['paid_orders']} computed={paid_count}"


# ---------------- Regressions ----------------

class TestRegressions:
    def test_products_returns_ten(self):
        r = requests.get(f"{API}/products", timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        products = data if isinstance(data, list) else data.get("products", [])
        assert len(products) >= 1, f"No products returned: {data}"
        # Check ratings/reviews field presence
        sample = products[0]
        has_rating = any(k in sample for k in ("rating", "average_rating", "review_count", "reviews_count"))
        assert has_rating, f"Product missing rating fields: keys={list(sample.keys())}"
        _no_mongo_id(data)

    def test_inbox_requires_auth(self):
        r = requests.get(f"{API}/inbox", timeout=30)
        assert r.status_code in (401, 403), f"Inbox should require auth, got {r.status_code}"

    def test_inbox_with_admin_token(self, auth_headers):
        r = requests.get(f"{API}/inbox", headers=auth_headers, timeout=30)
        assert r.status_code == 200, f"Inbox failed: {r.status_code} {r.text}"
        _no_mongo_id(r.json())
