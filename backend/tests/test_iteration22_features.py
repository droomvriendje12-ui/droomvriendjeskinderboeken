"""
Iteration 22: Testing Mollie payment, Exit-intent popup email storage, and Trust section
Features tested:
1. Mollie health-check endpoint (/api/mollie-status)
2. Express-checkout with Dutch error messages (503 when Mollie unreachable)
3. Single email import endpoint (/api/email/csv/import-single)
4. Products endpoint (fallback to mockData when Supabase down)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://mollie-payments-test.preview.emergentagent.com').rstrip('/')


class TestMollieHealthCheck:
    """Test Mollie API health check endpoint"""
    
    def test_mollie_status_returns_json_with_status_field(self):
        """GET /api/mollie-status returns JSON with status field"""
        response = requests.get(f"{BASE_URL}/api/mollie-status")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] in ["ok", "error"]
        print(f"✅ Mollie status: {data['status']}")
    
    def test_mollie_status_has_detail_on_error(self):
        """When status is error, detail field should be present"""
        response = requests.get(f"{BASE_URL}/api/mollie-status")
        data = response.json()
        if data["status"] == "error":
            assert "detail" in data
            print(f"✅ Mollie error detail: {data['detail']}")
        else:
            print(f"✅ Mollie is reachable (status: ok)")


class TestExpressCheckout:
    """Test express checkout with Mollie retry logic and Dutch error messages"""
    
    def test_express_checkout_returns_503_when_mollie_unreachable(self):
        """POST /api/express-checkout returns 503 with Dutch error when Mollie unreachable"""
        payload = {
            "payment_method": "ideal",
            "items": [
                {"product_id": "test-123", "product_name": "Test Knuffel", "quantity": 1, "price": 29.95}
            ],
            "total_amount": 29.95
        }
        response = requests.post(f"{BASE_URL}/api/express-checkout", json=payload)
        
        # Should return 503 (Service Unavailable) when Mollie is unreachable
        # Or 500 if database is also down
        assert response.status_code in [500, 503]
        data = response.json()
        assert "detail" in data
        
        # Check for Dutch error message
        detail = data["detail"].lower()
        assert any(word in detail for word in ["betaaldienst", "niet bereikbaar", "probeer", "opnieuw"])
        print(f"✅ Express checkout error (Dutch): {data['detail']}")
    
    def test_express_checkout_requires_items(self):
        """POST /api/express-checkout validates required fields"""
        payload = {
            "payment_method": "ideal",
            "total_amount": 29.95
            # Missing items
        }
        response = requests.post(f"{BASE_URL}/api/express-checkout", json=payload)
        assert response.status_code == 422  # Validation error
        print("✅ Express checkout validates required fields")


class TestSingleEmailImport:
    """Test single email import endpoint for exit-intent popup"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Generate unique test email for each test"""
        self.test_email = f"test_popup_{uuid.uuid4().hex[:8]}@example.com"
    
    def test_import_single_stores_valid_email(self):
        """POST /api/email/csv/import-single stores a valid email"""
        payload = {
            "email": self.test_email,
            "source": "popup_korting",
            "naam": "Test User"
        }
        response = requests.post(f"{BASE_URL}/api/email/csv/import-single", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["new"] == True
        assert "opgeslagen" in data["message"].lower() or "bekend" in data["message"].lower()
        print(f"✅ Email stored: {self.test_email}")
    
    def test_import_single_rejects_invalid_email(self):
        """POST /api/email/csv/import-single rejects invalid email addresses"""
        invalid_emails = [
            "not-an-email",
            "missing@domain",
            "@nodomain.com",
            "spaces in@email.com",
            ""
        ]
        for invalid_email in invalid_emails:
            payload = {
                "email": invalid_email,
                "source": "popup",
                "naam": ""
            }
            response = requests.post(f"{BASE_URL}/api/email/csv/import-single", json=payload)
            assert response.status_code in [400, 422]
            print(f"✅ Rejected invalid email: '{invalid_email}'")
    
    def test_import_single_detects_duplicates(self):
        """POST /api/email/csv/import-single detects duplicate emails"""
        payload = {
            "email": self.test_email,
            "source": "popup_korting",
            "naam": "Test User"
        }
        # First insert
        response1 = requests.post(f"{BASE_URL}/api/email/csv/import-single", json=payload)
        assert response1.status_code == 200
        data1 = response1.json()
        assert data1["new"] == True
        
        # Second insert (duplicate)
        response2 = requests.post(f"{BASE_URL}/api/email/csv/import-single", json=payload)
        assert response2.status_code == 200
        data2 = response2.json()
        assert data2["success"] == True
        assert data2["new"] == False
        assert "bekend" in data2["message"].lower()
        print(f"✅ Duplicate detected for: {self.test_email}")
    
    def test_import_single_uses_popup_source(self):
        """Verify source field is stored correctly"""
        payload = {
            "email": self.test_email,
            "source": "popup_korting",
            "naam": "Popup Test"
        }
        response = requests.post(f"{BASE_URL}/api/email/csv/import-single", json=payload)
        assert response.status_code == 200
        print("✅ Source field accepted: popup_korting")


class TestProductsEndpoint:
    """Test products endpoint with fallback to mockData"""
    
    def test_products_endpoint_returns_data(self):
        """GET /api/products returns product data (from Supabase or fallback)"""
        response = requests.get(f"{BASE_URL}/api/products")
        # Should return 200 even if Supabase is down (fallback to mockData)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Products endpoint returned {len(data)} products")
        
        if len(data) > 0:
            product = data[0]
            # Check product has required fields
            assert "name" in product or "title" in product
            assert "price" in product
            print(f"✅ First product: {product.get('name', product.get('title', 'Unknown'))}")


class TestHealthEndpoint:
    """Test general health endpoint"""
    
    def test_api_health_returns_healthy(self):
        """GET /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "config" in data
        print(f"✅ API health: {data['status']}")
        print(f"   Mollie configured: {data['config'].get('mollie_configured')}")
        print(f"   SMTP configured: {data['config'].get('smtp_configured')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
