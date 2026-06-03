"""
Iteration 37 — FASE 1: Mollie/PayPal express checkout customer & address recovery.

These are UNIT tests (no live Mollie needed) that verify the webhook enrichment
logic which reads customer name, email and shipping address back from a Mollie
payment (PayPal) and fills the express order so physical fulfilment is possible.

Run: cd /app/backend && python -m pytest tests/test_iteration37_mollie_express.py -v
"""
import asyncio
import os
import sys
from types import SimpleNamespace

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import routes.orders_supabase as osr  # noqa: E402


# ── Fakes ──────────────────────────────────────────────────────────────────
class _FakeUpdateChain:
    def __init__(self, store, payload):
        self._store = store
        self._payload = payload

    def eq(self, field, value):
        self._store["last_update"] = {"field": field, "value": value, "payload": self._payload}
        # apply onto the in-memory row
        row = self._store["rows"].get(value)
        if row is not None:
            row.update(self._payload)
        return self

    def execute(self):
        return SimpleNamespace(data=[])


class _FakeTable:
    def __init__(self, store):
        self._store = store

    def update(self, payload):
        return _FakeUpdateChain(self._store, payload)


class _FakeSupabase:
    def __init__(self):
        self.store = {"rows": {}, "last_update": None}

    def table(self, _name):
        return _FakeTable(self.store)


def _paypal_payment(country="NL", email="jane.doe@paypal.com"):
    return SimpleNamespace(
        id="tr_test_pp",
        status="paid",
        method="paypal",
        metadata={"order_id": "order-123"},
        amount={"currency": "EUR", "value": "49.95"},
        details={
            "consumerName": "Jane Doe",
            "consumerAccount": email,
            "paypalReference": "9AL23456789012345",
            "shippingAddress": {
                "streetAndNumber": "Keizersgracht 123",
                "postalCode": "1015CJ",
                "city": "Amsterdam" if country == "NL" else "Antwerpen",
                "country": country,
            },
        },
    )


def _creditcard_payment():
    return SimpleNamespace(
        id="tr_test_cc",
        status="paid",
        method="creditcard",
        metadata={"order_id": "order-cc"},
        amount={"currency": "EUR", "value": "49.95"},
        details={
            "cardHolder": "J DOE",
            "cardNumber": "**** **** **** 4242",
            "cardLabel": "Visa",
            "cardCountryCode": "NL",
        },
    )


# ── _order_missing_customer_data ────────────────────────────────────────────
def test_missing_detects_express_placeholder():
    assert osr._order_missing_customer_data(
        {"customer_email": "express@pending.nl", "customer_name": "Express Checkout", "shipping_address": ""}
    ) is True


def test_missing_detects_empty_address():
    assert osr._order_missing_customer_data(
        {"customer_email": "real@klant.nl", "customer_name": "Echt Persoon", "shipping_address": ""}
    ) is True


def test_not_missing_for_complete_order():
    assert osr._order_missing_customer_data(
        {"customer_email": "real@klant.nl", "customer_name": "Echt Persoon", "shipping_address": "Dorpsstraat 1"}
    ) is False


# ── _extract_mollie_customer_details ────────────────────────────────────────
def test_extract_paypal_nl():
    out = osr._extract_mollie_customer_details(_paypal_payment("NL"))
    assert out["customer_name"] == "Jane Doe"
    assert out["customer_email"] == "jane.doe@paypal.com"
    assert out["shipping_address"] == "Keizersgracht 123"
    assert out["shipping_zipcode"] == "1015CJ"
    assert out["shipping_city"] == "Amsterdam"
    assert out["shipping_country"] == "NL"


def test_extract_paypal_be():
    out = osr._extract_mollie_customer_details(_paypal_payment("BE", email="jan@paypal.be"))
    assert out["shipping_country"] == "BE"
    assert out["shipping_city"] == "Antwerpen"
    assert out["customer_email"] == "jan@paypal.be"


def test_extract_creditcard_has_no_shipping_address():
    out = osr._extract_mollie_customer_details(_creditcard_payment())
    assert "shipping_address" not in out
    assert "shipping_city" not in out


def test_extract_handles_none_details():
    p = SimpleNamespace(id="x", status="paid", method="ideal", details=None)
    assert osr._extract_mollie_customer_details(p) == {}


# ── _enrich_order_from_mollie ───────────────────────────────────────────────
def test_enrich_fills_placeholder_express_order(monkeypatch):
    fake = _FakeSupabase()
    monkeypatch.setattr(osr, "supabase", fake)
    monkeypatch.setattr(osr, "mongo_db", None)

    order = {
        "id": "order-123",
        "customer_email": "express@pending.nl",
        "customer_name": "Express Checkout",
        "shipping_address": "",
        "shipping_zipcode": "",
        "shipping_city": "",
        "shipping_country": "",
    }
    fake.store["rows"]["order-123"] = order

    result = asyncio.run(osr._enrich_order_from_mollie(order, _paypal_payment("NL"), source="test"))

    assert result["customer_email"] == "jane.doe@paypal.com"
    assert result["customer_name"] == "Jane Doe"
    assert result["shipping_address"] == "Keizersgracht 123"
    assert result["shipping_zipcode"] == "1015CJ"
    assert result["shipping_city"] == "Amsterdam"
    assert result["shipping_country"] == "NL"
    # a DB update was issued
    assert fake.store["last_update"] is not None
    assert osr._order_missing_customer_data(result) is False


def test_enrich_is_noop_for_complete_order(monkeypatch):
    fake = _FakeSupabase()
    monkeypatch.setattr(osr, "supabase", fake)
    monkeypatch.setattr(osr, "mongo_db", None)

    order = {
        "id": "order-real",
        "customer_email": "echt@klant.nl",
        "customer_name": "Echte Klant",
        "shipping_address": "Dorpsstraat 1",
        "shipping_zipcode": "1234AB",
        "shipping_city": "Utrecht",
    }
    result = asyncio.run(osr._enrich_order_from_mollie(order, _paypal_payment("NL"), source="test"))

    # PayPal data must NOT overwrite a real, complete order
    assert result["customer_email"] == "echt@klant.nl"
    assert result["shipping_address"] == "Dorpsstraat 1"
    assert fake.store["last_update"] is None


def test_enrich_creditcard_leaves_order_missing(monkeypatch):
    """Creditcard/Google Pay returns no address → order stays flagged as missing."""
    fake = _FakeSupabase()
    monkeypatch.setattr(osr, "supabase", fake)
    monkeypatch.setattr(osr, "mongo_db", None)

    order = {
        "id": "order-cc",
        "customer_email": "express@pending.nl",
        "customer_name": "Express Checkout",
        "shipping_address": "",
    }
    fake.store["rows"]["order-cc"] = order
    result = asyncio.run(osr._enrich_order_from_mollie(order, _creditcard_payment(), source="test"))
    # No usable shipping address from creditcard
    assert osr._order_missing_customer_data(result) is True


def test_has_physical_items():
    assert osr._has_physical_items([{"product_sku": "14"}]) is True
    assert osr._has_physical_items([{"product_sku": "digital-bedtime-chart"}]) is False
    assert osr._has_physical_items(
        [{"product_sku": "digital-x"}, {"product_sku": "7"}]
    ) is True


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))
