/**
 * Google Analytics 4 E-commerce Tracking - Enhanced Version
 * Full GA4 e-commerce implementation with rich product data
 * Events: view_item_list, view_item, select_item, add_to_cart, remove_from_cart,
 *         view_cart, begin_checkout, add_shipping_info, add_payment_info, purchase
 */

// Constants
const CURRENCY = 'EUR';
const AFFILIATION = 'Droomvriendjes';
const BRAND = 'Droomvriendjes';
const GOOGLE_BUSINESS_VERTICAL = 'retail';
const LOCATION_ID = 'ChIJoYkNjjS3xUcRn0k9ufyJO7A'; // Netherlands

// Check if gtag is available
const isGtagAvailable = () => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
};

// Push to dataLayer for GTM
const pushToDataLayer = (event, ecommerce) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    // Clear previous ecommerce object
    window.dataLayer.push({ ecommerce: null });
    
    // Push new event
    window.dataLayer.push({
      event,
      ecommerce
    });
  }
};

/**
 * Format product for GA4 with full e-commerce tags
 * @param {Object} product - Product object from mockData
 * @param {number} index - Position in list
 * @param {string} listId - Item list ID
 * @param {string} listName - Item list name
 * @param {number} quantity - Quantity
 * @param {string} coupon - Applied coupon code
 */
const formatProductForGA4 = (product, index = 0, listId = null, listName = null, quantity = 1, coupon = null) => {
  const item = {
    item_id: product.item_id || `KNUF_${String(product.id).padStart(3, '0')}`,
    item_name: product.name,
    affiliation: AFFILIATION,
    index,
    item_brand: BRAND,
    item_category: product.item_category || 'Knuffels',
    item_category2: product.item_category2 || 'Slaapknuffels',
    item_category3: product.item_category3 || product.shortName,
    item_category4: product.item_category4 || 'Medium',
    item_category5: product.item_category5 || 'Met Projectie',
    item_variant: product.item_variant || 'standaard',
    price: parseFloat(product.price) || 0,
    google_business_vertical: GOOGLE_BUSINESS_VERTICAL,
    location_id: LOCATION_ID,
    quantity
  };

  // Optional fields
  if (listId) item.item_list_id = listId;
  if (listName) item.item_list_name = listName;
  if (coupon) item.coupon = coupon;
  if (product.originalPrice && product.originalPrice > product.price) {
    item.discount = Number((product.originalPrice - product.price).toFixed(2));
  }

  return item;
};

// Calculate cart total
const calculateTotal = (cart) => {
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
};

/**
 * Track: Product List View (view_item_list)
 */
export const trackViewItemList = (products, listId = 'alle_knuffels', listName = 'Alle Knuffels') => {
  if (!products || !products.length) return;
  
  const items = products.map((product, index) => 
    formatProductForGA4(product, index, listId, listName)
  );

  const ecommerce = {
    item_list_id: listId,
    item_list_name: listName,
    items
  };

  // Push to dataLayer for GTM
  pushToDataLayer('view_item_list', ecommerce);

  // Also send via gtag if available
  if (isGtagAvailable()) {
    window.gtag('event', 'view_item_list', ecommerce);
  }
  
  console.log('📊 GA4: view_item_list', listName, products.length, 'products');
};

/**
 * Track: Product Click from List (select_item)
 */
export const trackSelectItem = (product, index = 0, listId = 'alle_knuffels', listName = 'Alle Knuffels') => {
  const item = formatProductForGA4(product, index, listId, listName);

  const ecommerce = {
    item_list_id: listId,
    item_list_name: listName,
    items: [item]
  };

  pushToDataLayer('select_item', ecommerce);

  if (isGtagAvailable()) {
    window.gtag('event', 'select_item', ecommerce);
  }
  
  console.log('📊 GA4: select_item', product.shortName || product.name);
};

/**
 * Track: Product Viewed (view_item)
 */
export const trackViewItem = (product) => {
  const item = formatProductForGA4(product);

  const ecommerce = {
    currency: CURRENCY,
    value: parseFloat(product.price) || 0,
    items: [item]
  };

  pushToDataLayer('view_item', ecommerce);

  if (isGtagAvailable()) {
    window.gtag('event', 'view_item', ecommerce);
  }
  
  console.log('📊 GA4: view_item', product.shortName || product.name);
};

/**
 * Track: Add to Cart (add_to_cart)
 */
export const trackAddToCart = (product, quantity = 1) => {
  const item = formatProductForGA4(product, 0, null, null, quantity);
  const value = parseFloat(product.price) * quantity;

  const ecommerce = {
    currency: CURRENCY,
    value,
    items: [item]
  };

  pushToDataLayer('add_to_cart', ecommerce);

  if (isGtagAvailable()) {
    // GA4: Standard e-commerce event
    window.gtag('event', 'add_to_cart', ecommerce);
    
    // Google Ads: Conversion events
    window.gtag('event', 'ads_conversion_Add_to_cart_1', ecommerce);
    window.gtag('event', 'conversion_event_add_to_cart', ecommerce);
  }
  
  console.log('📊 GA4: add_to_cart', product.shortName || product.name, 'x', quantity);
};

/**
 * Track: Remove from Cart (remove_from_cart)
 */
export const trackRemoveFromCart = (product, quantity = 1) => {
  const item = formatProductForGA4(product, 0, null, null, quantity);

  const ecommerce = {
    currency: CURRENCY,
    value: parseFloat(product.price) * quantity,
    items: [item]
  };

  pushToDataLayer('remove_from_cart', ecommerce);

  if (isGtagAvailable()) {
    window.gtag('event', 'remove_from_cart', ecommerce);
  }
  
  console.log('📊 GA4: remove_from_cart', product.shortName || product.name);
};

/**
 * Track: View Cart (view_cart)
 */
export const trackViewCart = (cart) => {
  if (!cart || !cart.length) return;

  const items = cart.map((item, index) => 
    formatProductForGA4(item, index, null, null, item.quantity)
  );

  const ecommerce = {
    currency: CURRENCY,
    value: Number(calculateTotal(cart).toFixed(2)),
    items
  };

  pushToDataLayer('view_cart', ecommerce);

  if (isGtagAvailable()) {
    window.gtag('event', 'view_cart', ecommerce);
  }
  
  console.log('📊 GA4: view_cart', cart.length, 'items');
};

/**
 * Track: Begin Checkout (begin_checkout)
 */
export const trackBeginCheckout = (cart, coupon = null) => {
  if (!cart || !cart.length) return;

  const items = cart.map((item, index) => 
    formatProductForGA4(item, index, null, null, item.quantity, coupon)
  );

  const ecommerce = {
    currency: CURRENCY,
    value: Number(calculateTotal(cart).toFixed(2)),
    items
  };

  if (coupon) ecommerce.coupon = coupon;

  pushToDataLayer('begin_checkout', ecommerce);

  if (isGtagAvailable()) {
    window.gtag('event', 'begin_checkout', ecommerce);
  }
  
  console.log('📊 GA4: begin_checkout', calculateTotal(cart).toFixed(2), 'EUR');
};

/**
 * Track: Add Shipping Info (add_shipping_info)
 */
export const trackAddShippingInfo = (cart, shippingTier = 'Gratis Verzending', coupon = null) => {
  if (!cart || !cart.length) return;

  const items = cart.map((item, index) => 
    formatProductForGA4(item, index, null, null, item.quantity, coupon)
  );

  const ecommerce = {
    currency: CURRENCY,
    value: Number(calculateTotal(cart).toFixed(2)),
    shipping_tier: shippingTier,
    items
  };

  if (coupon) ecommerce.coupon = coupon;

  pushToDataLayer('add_shipping_info', ecommerce);

  if (isGtagAvailable()) {
    window.gtag('event', 'add_shipping_info', ecommerce);
  }
  
  console.log('📊 GA4: add_shipping_info', shippingTier);
};

/**
 * Track: Add Payment Info (add_payment_info)
 */
export const trackAddPaymentInfo = (cart, paymentType = 'iDEAL', coupon = null) => {
  if (!cart || !cart.length) return;

  const items = cart.map((item, index) => 
    formatProductForGA4(item, index, null, null, item.quantity, coupon)
  );

  const ecommerce = {
    currency: CURRENCY,
    value: Number(calculateTotal(cart).toFixed(2)),
    payment_type: paymentType,
    items
  };

  if (coupon) ecommerce.coupon = coupon;

  pushToDataLayer('add_payment_info', ecommerce);

  if (isGtagAvailable()) {
    window.gtag('event', 'add_payment_info', ecommerce);
  }
  
  console.log('📊 GA4: add_payment_info', paymentType);
};

/**
 * Track: Purchase (purchase) - MAIN CONVERSION EVENT
 */
export const trackPurchase = (orderData) => {
  const items = (orderData.items || []).map((item, index) => ({
    item_id: item.item_id || item.product_id || `KNUF_${String(item.id).padStart(3, '0')}`,
    item_name: item.product_name || item.name,
    affiliation: AFFILIATION,
    index,
    item_brand: BRAND,
    item_category: item.item_category || 'Knuffels',
    item_category2: item.item_category2 || 'Slaapknuffels',
    item_category3: item.item_category3 || item.shortName,
    item_category4: item.item_category4 || 'Medium',
    item_category5: item.item_category5 || 'Met Projectie',
    item_variant: item.item_variant || 'standaard',
    price: parseFloat(item.price),
    quantity: item.quantity,
    google_business_vertical: GOOGLE_BUSINESS_VERTICAL,
    location_id: LOCATION_ID
  }));

  const ecommerce = {
    transaction_id: orderData.order_id || orderData._id,
    value: parseFloat(orderData.total_amount),
    currency: CURRENCY,
    tax: orderData.tax || 0,
    shipping: orderData.shipping || 0,
    items
  };

  if (orderData.coupon) ecommerce.coupon = orderData.coupon;

  pushToDataLayer('purchase', ecommerce);

  if (isGtagAvailable()) {
    window.gtag('event', 'purchase', ecommerce);

    // Google Ads purchase conversion — only fires when a real conversion label is configured
    // via REACT_APP_GOOGLE_ADS_PURCHASE_CONVERSION (e.g. "AW-1234567890/AbC-dEfGh").
    const adsConversion = process.env.REACT_APP_GOOGLE_ADS_PURCHASE_CONVERSION;
    if (adsConversion) {
      window.gtag('event', 'conversion', {
        send_to: adsConversion,
        value: parseFloat(orderData.total_amount),
        currency: 'EUR',
        transaction_id: orderData.order_id || orderData._id
      });
    }
  }
  
  console.log('📊 GA4: purchase', orderData.order_id, orderData.total_amount, 'EUR');
};

/**
 * Track: Refund (refund)
 */
export const trackRefund = (orderId, items = null) => {
  const ecommerce = {
    transaction_id: orderId,
    currency: CURRENCY
  };

  if (items && items.length > 0) {
    ecommerce.items = items.map((item, index) => 
      formatProductForGA4(item, index, null, null, item.quantity)
    );
    ecommerce.value = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  pushToDataLayer('refund', ecommerce);

  if (isGtagAvailable()) {
    window.gtag('event', 'refund', ecommerce);
  }
  
  console.log('📊 GA4: refund', orderId);
};

/**
 * Track: Contact Form Submit (generate_lead)
 */
export const trackContactFormSubmit = (formData) => {
  if (!isGtagAvailable()) return;
  
  window.gtag('event', 'generate_lead', {
    currency: CURRENCY,
    value: 10,
    lead_source: 'contact_form',
    form_name: formData.onderwerp || 'contact'
  });

  window.gtag('event', 'contact_form_submit', {
    form_subject: formData.onderwerp,
    page_location: formData.page_url || window.location.href
  });
  
  console.log('📊 GA4: contact_form_submit');
};

/**
 * Track: Checkout Clicked (custom micro-conversion)
 */
export const trackCheckoutClicked = (cart, customerEmail) => {
  if (!isGtagAvailable()) return;
  
  window.gtag('event', 'click_checkout', {
    currency: CURRENCY,
    value: calculateTotal(cart),
    items_count: cart.length,
    customer_email_provided: !!customerEmail
  });
  
  console.log('📊 GA4: click_checkout');
};

export default {
  trackViewItemList,
  trackSelectItem,
  trackViewItem,
  trackAddToCart,
  trackRemoveFromCart,
  trackViewCart,
  trackBeginCheckout,
  trackAddShippingInfo,
  trackAddPaymentInfo,
  trackPurchase,
  trackRefund,
  trackContactFormSubmit,
  trackCheckoutClicked
};
