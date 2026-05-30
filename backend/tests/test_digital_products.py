"""Backend tests for the new Digital Products PDF feature."""
import os
import io
import uuid
import pytest
import requests
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://ecommerce-digits.preview.emergentagent.com").rstrip("/")
ADMIN_USER = "admin"
ADMIN_PASS = "Droomvriendjes2024!"

_token_cache = {"token": None}
_created_entitlement_ids = []
_uploaded_paths = []


@pytest.fixture(scope="session")
def admin_token():
    if _token_cache["token"]:
        return _token_cache["token"]
    r = requests.post(f"{BASE_URL}/api/admin/login", json={"username": ADMIN_USER, "password": ADMIN_PASS}, timeout=15)
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    token = r.json().get("token") or r.json().get("access_token")
    if not token:
        pytest.skip(f"Admin login: no token field. body={r.json()}")
    _token_cache["token"] = token
    return token


@pytest.fixture(scope="session")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ============== REGRESSION ==============

def test_mollie_status_ok():
    r = requests.get(f"{BASE_URL}/api/mollie-status", timeout=20)
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


def test_products_list_has_digital_products():
    r = requests.get(f"{BASE_URL}/api/products", timeout=20)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) >= 15, f"Expected >=15 products, got {len(data)}"
    digitals = [p for p in data if p.get("productType") == "digital"]
    assert len(digitals) >= 5, f"Expected >=5 digital products, got {len(digitals)}: {[p.get('id') for p in digitals]}"


# ============== ADMIN ENDPOINTS ==============

def test_admin_list_requires_auth():
    r = requests.get(f"{BASE_URL}/api/digital-products/admin/list", timeout=15)
    assert r.status_code in (401, 403)


def test_admin_list_files(auth_headers):
    r = requests.get(f"{BASE_URL}/api/digital-products/admin/list", headers=auth_headers, timeout=20)
    assert r.status_code == 200, r.text
    body = r.json()
    assert "files" in body and "stats" in body
    assert isinstance(body["files"], list)


def test_admin_entitlements_list(auth_headers):
    r = requests.get(f"{BASE_URL}/api/digital-products/admin/entitlements", headers=auth_headers, timeout=20)
    assert r.status_code == 200, r.text
    assert "entitlements" in r.json()


def test_admin_upload_pdf(auth_headers):
    pdf_bytes = b"%PDF-1.4\n%\xc4\xe5\xf2\xe5\xeb\xa7\xf3\xa0\xd0\xc4\xc6\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF"
    files = {"file": ("TEST_smoke.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    r = requests.post(
        f"{BASE_URL}/api/digital-products/admin/upload",
        headers=auth_headers,
        files=files,
        timeout=30,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("status") == "ok"
    assert body.get("storage_path", "").endswith("TEST_smoke.pdf")
    _uploaded_paths.append(body["storage_path"])


def test_admin_upload_rejects_non_pdf(auth_headers):
    files = {"file": ("not.txt", io.BytesIO(b"hello"), "text/plain")}
    r = requests.post(
        f"{BASE_URL}/api/digital-products/admin/upload",
        headers=auth_headers,
        files=files,
        timeout=20,
    )
    assert r.status_code == 400


def test_admin_delete_uploaded(auth_headers):
    if not _uploaded_paths:
        pytest.skip("No uploaded path available")
    path = _uploaded_paths[0]
    r = requests.delete(
        f"{BASE_URL}/api/digital-products/admin/file",
        headers=auth_headers,
        params={"path": path},
        timeout=15,
    )
    assert r.status_code == 200


# ============== CUSTOMER ENDPOINTS ==============

def test_info_unknown_token_404():
    r = requests.get(f"{BASE_URL}/api/digital-products/info/does-not-exist-{uuid.uuid4().hex}", timeout=15)
    assert r.status_code == 404


def test_download_unknown_token_404():
    r = requests.get(f"{BASE_URL}/api/digital-products/download/missing-{uuid.uuid4().hex}", timeout=15)
    assert r.status_code == 404


# ============== ENTITLEMENT FLOW (via Supabase direct, simulating webhook) ==============

@pytest.fixture(scope="session")
def supabase_client():
    try:
        from supabase import create_client
    except Exception:
        pytest.skip("supabase package not installed")
    url = os.environ.get("SUPABASE_URL") or "https://plxbmkwuacbdzookygtg.supabase.co"
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not key:
        # try to read backend .env
        try:
            with open("/app/backend/.env") as f:
                for line in f:
                    if line.startswith("SUPABASE_SERVICE_KEY="):
                        key = line.split("=", 1)[1].strip()
                        break
        except Exception:
            pass
    if not key:
        pytest.skip("No SUPABASE_SERVICE_KEY available")
    return create_client(url, key)


def _find_digital_product_with_file(supa):
    res = supa.table("products").select("id,name,product_type,digital_file_path").eq("product_type", "digital").execute()
    for p in res.data or []:
        if p.get("digital_file_path"):
            return p
    return None


def _make_entitlement(supa, *, max_dl=3, used=0, expires_hours=24, file_path=None, product_id=None):
    import secrets
    ent_id = str(uuid.uuid4())
    token = "TEST_" + secrets.token_urlsafe(24)
    expires = datetime.now(timezone.utc) + timedelta(hours=expires_hours)
    row = {
        "id": ent_id,
        "order_id": f"TEST_order_{uuid.uuid4().hex[:8]}",
        "customer_email": "test+digital@example.com",
        "product_id": product_id,
        "file_path": file_path,
        "download_token": token,
        "downloads_used": used,
        "max_downloads": max_dl,
        "expires_at": expires.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    supa.table("digital_downloads").insert(row).execute()
    _created_entitlement_ids.append(ent_id)
    return token, ent_id


def test_info_endpoint_returns_metadata(supabase_client):
    product = _find_digital_product_with_file(supabase_client)
    if not product:
        pytest.skip("No digital product with file_path in DB")
    token, _ = _make_entitlement(
        supabase_client, file_path=product["digital_file_path"], product_id=product["id"]
    )
    r = requests.get(f"{BASE_URL}/api/digital-products/info/{token}", timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["max_downloads"] == 3
    assert body["downloads_used"] == 0
    assert body.get("product", {}).get("id") == product["id"]


def test_download_increments_counter(supabase_client):
    product = _find_digital_product_with_file(supabase_client)
    if not product:
        pytest.skip("No digital product with file_path")
    token, ent_id = _make_entitlement(
        supabase_client, file_path=product["digital_file_path"], product_id=product["id"]
    )
    # 1st download
    r1 = requests.get(f"{BASE_URL}/api/digital-products/download/{token}", timeout=20)
    assert r1.status_code == 200, r1.text
    j1 = r1.json()
    assert j1["downloads_remaining"] == 2
    assert j1["url"].startswith("http")
    # 2nd
    r2 = requests.get(f"{BASE_URL}/api/digital-products/download/{token}", timeout=20)
    assert r2.status_code == 200
    assert r2.json()["downloads_remaining"] == 1
    # 3rd
    r3 = requests.get(f"{BASE_URL}/api/digital-products/download/{token}", timeout=20)
    assert r3.status_code == 200
    assert r3.json()["downloads_remaining"] == 0
    # 4th - must be 403
    r4 = requests.get(f"{BASE_URL}/api/digital-products/download/{token}", timeout=20)
    assert r4.status_code == 403, f"4th attempt should 403, got {r4.status_code}: {r4.text}"


def test_download_expired_returns_410(supabase_client):
    product = _find_digital_product_with_file(supabase_client)
    if not product:
        pytest.skip("No digital product with file_path")
    token, ent_id = _make_entitlement(
        supabase_client,
        file_path=product["digital_file_path"],
        product_id=product["id"],
        expires_hours=-1,
    )
    r = requests.get(f"{BASE_URL}/api/digital-products/download/{token}", timeout=15)
    assert r.status_code == 410, f"expired should 410, got {r.status_code}: {r.text}"


# ============== HELPER: create_entitlements_for_order ==============

def test_create_entitlements_helper(supabase_client):
    """Simulate the Mollie webhook entitlement creation by calling helper directly via subprocess."""
    product = _find_digital_product_with_file(supabase_client)
    if not product:
        pytest.skip("No digital product with file_path")
    import subprocess, json as _json
    items = [{"product_sku": product["id"], "product_name": product["name"], "quantity": 1, "price": 9.99}]
    order_id = f"TEST_order_{uuid.uuid4().hex[:8]}"
    script = f"""
import sys, json
sys.path.insert(0, '/app/backend')
from supabase import create_client
import os
url = '{os.environ.get('SUPABASE_URL') or 'https://plxbmkwuacbdzookygtg.supabase.co'}'
# read service key
with open('/app/backend/.env') as f:
    for line in f:
        if line.startswith('SUPABASE_SERVICE_KEY='):
            key = line.split('=',1)[1].strip()
            break
client = create_client(url, key)
import routes.digital_products as dp
dp.set_supabase_client(client)
res = dp.create_entitlements_for_order(order_id='{order_id}', items={items!r}, customer_email='test+webhook@example.com')
print('RESULT_JSON:'+json.dumps(res))
"""
    out = subprocess.run(["python", "-c", script], capture_output=True, text=True, cwd="/app/backend", timeout=30)
    assert out.returncode == 0, f"stdout={out.stdout}\nstderr={out.stderr}"
    line = [ln for ln in out.stdout.splitlines() if ln.startswith("RESULT_JSON:")]
    assert line, f"no result line. stdout={out.stdout}"
    import json as _json
    res = _json.loads(line[0][len("RESULT_JSON:"):])
    assert isinstance(res, list)
    assert len(res) == 1
    assert res[0]["product_id"] == product["id"]
    assert res[0]["max_downloads"] == 3
    # Track for cleanup
    # Find the entitlement just created
    q = supabase_client.table("digital_downloads").select("id").eq("order_id", order_id).execute()
    for row in q.data or []:
        _created_entitlement_ids.append(row["id"])


# ============== CLEANUP ==============

def test_zzz_cleanup_test_entitlements(supabase_client):
    if not _created_entitlement_ids:
        return
    for ent_id in _created_entitlement_ids:
        try:
            supabase_client.table("digital_downloads").delete().eq("id", ent_id).execute()
        except Exception as e:
            print(f"cleanup failed for {ent_id}: {e}")
    print(f"Cleaned up {len(_created_entitlement_ids)} test entitlements")
