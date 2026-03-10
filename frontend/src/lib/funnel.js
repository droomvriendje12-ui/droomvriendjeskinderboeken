/**
 * Funnel Tracking - tracks customer journey events
 * Events: product_view, add_to_cart, checkout_start, address_filled, payment_selected, purchase_success
 */

const SESSION_KEY = 'dv_session_id';

function getSessionId() {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = Math.random().toString(36).substring(2, 10).toUpperCase();
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

export function trackEvent(eventType, data = {}) {
  try {
    const payload = {
      event_type: eventType,
      session_id: getSessionId(),
      ...data,
    };
    navigator.sendBeacon?.('/api/funnel/event', JSON.stringify(payload))
      || fetch('/api/funnel/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
  } catch {
    // Silent fail - tracking should never break UX
  }
}

export function trackProductView(productId, productName) {
  trackEvent('product_view', { product_id: productId, product_name: productName });
}

export function trackAddToCart(productId, productName, cartTotal) {
  trackEvent('add_to_cart', { product_id: productId, product_name: productName, cart_total: cartTotal });
}

export function trackCheckoutStart(cartTotal) {
  trackEvent('checkout_start', { cart_total: cartTotal });
}

export function trackAddressFilled(email) {
  trackEvent('address_filled', { customer_email: email });
}

export function trackPaymentSelected(method) {
  trackEvent('payment_selected', { metadata: { method } });
}

export function trackPurchaseSuccess(orderId, total) {
  trackEvent('purchase_success', { metadata: { order_id: orderId }, cart_total: total });
}
