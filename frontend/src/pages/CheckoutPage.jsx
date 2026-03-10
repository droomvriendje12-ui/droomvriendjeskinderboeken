import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShoppingCart, CreditCard, Lock, Check, Truck, Heart, ArrowLeft, Loader2, Plus, Minus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { trackBeginCheckout, trackAddPaymentInfo, trackAddShippingInfo } from '../utils/analytics';
import { products } from '../mockData';


const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, getSubtotal, getDiscount, getTotal, updateQuantity, removeFromCart, clearCart, addToCart, appliedCoupon, setAppliedCoupon } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const trackingTimeoutRef = useRef(null);
  const hasTrackedRef = useRef(false);
  const [addedProducts, setAddedProducts] = useState({});
  const crossSellRef = useRef(null);
  
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    zipCode: '',
    phone: '',
    giftWrap: false,
    paymentMethod: 'ideal'
  });

  // GA4: Track begin_checkout when page loads
  useEffect(() => {
    if (cart.length > 0) {
      trackBeginCheckout(cart);
    }
  }, []);

  // Load saved email from cart sidebar
  useEffect(() => {
    const savedEmail = localStorage.getItem('droomvriendjes_checkout_email');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (trackingTimeoutRef.current) {
        clearTimeout(trackingTimeoutRef.current);
      }
    };
  }, []);

  // Track checkout session for abandoned cart recovery
  const trackCheckoutSession = async (email, name) => {
    if (!email || cart.length === 0) return;
    
    try {
      await fetch(`/api/email/track-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          name: name || '',
          items: cart.map(item => ({
            product_id: String(item.id),
            name: item.shortName || item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image
          })),
          total: getTotal()
        })
      });
      hasTrackedRef.current = true;
    } catch (error) {
      console.error('Error tracking checkout session:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Track checkout session when email is entered (debounced)
    if (name === 'email' && value.includes('@') && value.includes('.')) {
      if (trackingTimeoutRef.current) {
        clearTimeout(trackingTimeoutRef.current);
      }
      trackingTimeoutRef.current = setTimeout(() => {
        const fullName = `${formData.firstName} ${formData.lastName}`.trim();
        trackCheckoutSession(value, fullName);
      }, 2000);
    }
  };

  const handlePaymentMethodChange = (value) => {
    setFormData(prev => ({ ...prev, paymentMethod: value }));
    trackAddPaymentInfo(cart, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.firstName || !formData.lastName || 
        !formData.address || !formData.zipCode || !formData.city) {
      setError('Vul alle verplichte velden in');
      return;
    }

    if (cart.length === 0) {
      setError('Je winkelwagen is leeg');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Track shipping info for GA4
      trackAddShippingInfo(cart, 'standard_shipping');
      
      // Notify backend of checkout start
      await fetch(`/api/checkout-started`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          name: `${formData.firstName} ${formData.lastName}`,
          items: cart
        })
      }).catch(() => {});
      
      // Create order
      // Calculate final total: (Subtotal - Auto Discount) - Manual Coupon = Total
      const subtotal = getSubtotal();
      const autoDiscount = getDiscount(); // 2nd item 50% off
      const couponDiscount = appliedCoupon ? appliedCoupon.discount_amount : 0;
      const giftWrapCost = formData.giftWrap ? GIFT_WRAP_PRICE : 0;
      const finalTotal = Math.max(0, subtotal - autoDiscount - couponDiscount + giftWrapCost);
      
      const orderResponse = await fetch(`/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_email: formData.email,
          customer_name: `${formData.firstName} ${formData.lastName}`,
          customer_phone: formData.phone || '',
          customer_address: formData.address,
          customer_city: formData.city,
          customer_zipcode: formData.zipCode,
          customer_comment: formData.giftWrap ? 'Cadeauverpakking gewenst' : '',
          gift_wrap: formData.giftWrap,
          items: cart.map(item => ({
            product_id: String(item.id),
            product_name: item.shortName || item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image
          })),
          subtotal: subtotal,
          discount: autoDiscount,
          coupon_code: appliedCoupon ? appliedCoupon.code : null,
          coupon_discount: couponDiscount,
          total_amount: finalTotal
        })
      });

      if (!orderResponse.ok) {
        throw new Error('Order kon niet worden aangemaakt');
      }

      const orderData = await orderResponse.json();

      // Create payment via backend (SECURE - no API key in frontend!)
      const paymentResponse = await fetch(`/api/payments/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderData.order_id,
          payment_method: formData.paymentMethod
        })
      });

      if (!paymentResponse.ok) {
        const errData = await paymentResponse.json();
        throw new Error(errData.detail || 'Betaling kon niet worden gestart');
      }

      const paymentData = await paymentResponse.json();

      if (paymentData.checkout_url) {
        clearCart();
        window.location.href = paymentData.checkout_url;
      } else {
        throw new Error('Geen checkout URL ontvangen');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Er is iets misgegaan. Probeer het opnieuw.');
      setIsLoading(false);
    }
  };

  const paymentMethods = [
    { value: 'ideal', label: 'iDEAL', icon: 'https://www.mollie.com/external/icons/payment-methods/ideal.svg', popular: true, description: 'Direct via je bank' },
    { value: 'creditcard', label: 'Creditcard', icon: 'https://www.mollie.com/external/icons/payment-methods/creditcard.svg', description: 'Visa, Mastercard, Amex' },
    { value: 'in3', label: 'iDEAL in3', icon: 'https://www.mollie.com/external/icons/payment-methods/in3.svg', description: 'Betaal in 3 termijnen' },
    { value: 'bancontact', label: 'Bancontact', icon: 'https://www.mollie.com/external/icons/payment-methods/bancontact.svg', description: 'Voor Belgie' },
  ];

  const expressMethods = [
    { value: 'applepay', label: 'Apple Pay', icon: 'https://www.mollie.com/external/icons/payment-methods/applepay.svg' },
  ];

  // Gift wrap price
  const GIFT_WRAP_PRICE = 3.00;

  // Get cross-sell products (exclude items already in cart)
  const cartProductIds = cart.map(item => item.id);
  const crossSellProducts = products
    .filter(p => !cartProductIds.includes(p.id) && p.id !== 6) // Exclude cart items and Duo set
    .slice(0, 5);

  // Handle quick add to cart
  const handleQuickAdd = (product) => {
    addToCart(product);
    setAddedProducts(prev => ({ ...prev, [product.id]: true }));
    
    // Reset the "added" state after 2 seconds
    setTimeout(() => {
      setAddedProducts(prev => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  // Scroll cross-sell strip
  const scrollCrossSell = (direction) => {
    if (crossSellRef.current) {
      const scrollAmount = 200;
      crossSellRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Empty cart view
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-warm-brown-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-12 h-12 text-warm-brown-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Je winkelwagen is leeg</h2>
          <p className="text-slate-600 mb-6">Voeg eerst producten toe aan je winkelwagen.</p>
          <Link to="/">
            <button className="bg-warm-brown-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-warm-brown-600 transition flex items-center gap-2 mx-auto">
              <ArrowLeft className="w-5 h-5" />
              Terug naar shop
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-block mb-4">
            <img 
              src="/logo.svg" 
              alt="Droomvriendjes" 
              className="h-20 md:h-24 w-auto mx-auto"
            />
          </Link>
          <p className="text-slate-600 flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            Veilig afrekenen
          </p>
        </div>

        {/* Back link */}
        <Link to="/" className="inline-flex items-center text-warm-brown-600 hover:text-warm-brown-700 mb-6 font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Terug naar shop
        </Link>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Form */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Express Checkout - Apple Pay First */}
              <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6" data-testid="express-checkout">
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Express Checkout</h2>
                <div className="space-y-2">
                  {expressMethods.map(method => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => {
                        handlePaymentMethodChange(method.value);
                        // For express, submit immediately if form is filled
                        if (formData.email && formData.firstName && formData.lastName && formData.address && formData.zipCode && formData.city) {
                          document.getElementById('checkout-form-submit')?.click();
                        }
                      }}
                      className="w-full flex items-center justify-center gap-3 p-4 bg-black text-white rounded-xl font-semibold text-base hover:bg-gray-900 transition-all"
                      data-testid={`express-${method.value}`}
                    >
                      <img src={method.icon} alt={method.label} className="h-6 brightness-0 invert" />
                      {method.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400 uppercase font-semibold">of vul je gegevens in</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-warm-brown-500" />
                  Contactgegevens
                </h2>
                <input
                  type="email"
                  name="email"
                  placeholder="E-mailadres *"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full p-4 text-base border-2 border-slate-200 rounded-xl focus:border-warm-brown-500 focus:outline-none transition"
                  data-testid="checkout-email"
                />
              </div>

              {/* Shipping Address */}
              <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-warm-brown-500" />
                  Verzendadres
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="Voornaam *"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="p-4 text-base border-2 border-slate-200 rounded-xl focus:border-warm-brown-500 focus:outline-none transition"
                    data-testid="checkout-firstname"
                  />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Achternaam *"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="p-4 text-base border-2 border-slate-200 rounded-xl focus:border-warm-brown-500 focus:outline-none transition"
                    data-testid="checkout-lastname"
                  />
                  <input
                    type="text"
                    name="address"
                    placeholder="Adres + huisnummer *"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="sm:col-span-2 p-4 text-base border-2 border-slate-200 rounded-xl focus:border-warm-brown-500 focus:outline-none transition"
                    data-testid="checkout-address"
                  />
                  <input
                    type="text"
                    name="zipCode"
                    placeholder="Postcode *"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    required
                    className="p-4 text-base border-2 border-slate-200 rounded-xl focus:border-warm-brown-500 focus:outline-none transition"
                    data-testid="checkout-zipcode"
                  />
                  <input
                    type="text"
                    name="city"
                    placeholder="Plaats *"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="p-4 text-base border-2 border-slate-200 rounded-xl focus:border-warm-brown-500 focus:outline-none transition"
                    data-testid="checkout-city"
                  />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Telefoonnummer (optioneel)"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="sm:col-span-2 p-4 text-base border-2 border-slate-200 rounded-xl focus:border-warm-brown-500 focus:outline-none transition"
                    data-testid="checkout-phone"
                  />
                </div>
              </div>

              {/* Gift Wrap Checkbox (replaces opmerkingen) */}
              <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
                <label 
                  className="flex items-center gap-4 cursor-pointer group"
                  data-testid="gift-wrap-option"
                >
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                    formData.giftWrap 
                      ? 'bg-warm-brown-500 border-warm-brown-500' 
                      : 'border-slate-300 group-hover:border-warm-brown-400'
                  }`}>
                    {formData.giftWrap && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.giftWrap}
                    onChange={(e) => setFormData(prev => ({ ...prev, giftWrap: e.target.checked }))}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <span className="font-semibold text-slate-800">Cadeauverpakking</span>
                    <span className="text-warm-brown-600 font-bold ml-2">(+ EUR 3,00)</span>
                    <p className="text-sm text-slate-500 mt-0.5">Mooi ingepakt met strik en kaartje</p>
                  </div>
                </label>
              </div>

              {/* Payment Methods - Compact Radio List */}
              <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-warm-brown-500" />
                  Betaalmethode
                </h2>
                <div className="space-y-2" data-testid="payment-methods-list">
                  {paymentMethods.map(method => (
                    <label 
                      key={method.value} 
                      className={`flex items-center gap-3 p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.paymentMethod === method.value 
                          ? 'border-warm-brown-500 bg-warm-brown-50' 
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                      data-testid={`payment-method-${method.value}`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        formData.paymentMethod === method.value 
                          ? 'border-warm-brown-500' 
                          : 'border-slate-300'
                      }`}>
                        {formData.paymentMethod === method.value && (
                          <div className="w-2.5 h-2.5 rounded-full bg-warm-brown-500" />
                        )}
                      </div>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.value}
                        checked={formData.paymentMethod === method.value}
                        onChange={() => handlePaymentMethodChange(method.value)}
                        className="sr-only"
                      />
                      <img src={method.icon} alt={method.label} className="w-8 h-6 object-contain flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 text-sm sm:text-base">{method.label}</span>
                          {method.popular && (
                            <span className="bg-warm-brown-500 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">Populair</span>
                          )}
                        </div>
                        <span className="text-xs sm:text-sm text-slate-500">{method.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
                
                {/* Payment Security Badge */}
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-600 bg-green-50 p-3 rounded-xl">
                  <Lock className="w-4 h-4 text-green-600" />
                  <span>Veilige betaling via Mollie - SSL versleuteld</span>
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:sticky lg:top-6">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 sm:mb-6 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-warm-brown-500" />
                  Besteloverzicht
                </h2>

                {/* Cart Items */}
                <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-3 pb-4 border-b border-slate-100">
                      <img 
                        src={item.image} 
                        alt={item.shortName || item.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl bg-warm-brown-50"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 text-sm sm:text-base truncate">{item.shortName || item.name}</h3>
                        <p className="text-warm-brown-600 font-bold text-base sm:text-lg">€{item.price.toFixed(2).replace('.', ',')}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-semibold text-base">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="ml-auto text-red-500 hover:text-red-700 transition p-2"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cross-sell Strip */}
                {crossSellProducts.length > 0 && (
                  <div className="mb-6 -mx-2 px-2">
                    <div className="bg-gradient-to-r from-warm-brown-50 to-amber-50 rounded-xl p-4 border border-warm-brown-100">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-bold text-warm-brown-700">
                            🎁 Voeg nog 1 knuffel toe voor 50% korting!
                          </p>
                          <p className="text-xs text-warm-brown-600">Meest gekozen samen met jouw bestelling</p>
                        </div>
                        <div className="flex gap-1">
                          <button 
                            type="button"
                            onClick={() => scrollCrossSell('left')}
                            className="w-7 h-7 bg-white rounded-full shadow flex items-center justify-center hover:bg-warm-brown-50 transition"
                          >
                            <ChevronLeft className="w-4 h-4 text-warm-brown-600" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => scrollCrossSell('right')}
                            className="w-7 h-7 bg-white rounded-full shadow flex items-center justify-center hover:bg-warm-brown-50 transition"
                          >
                            <ChevronRight className="w-4 h-4 text-warm-brown-600" />
                          </button>
                        </div>
                      </div>
                      
                      <div 
                        ref={crossSellRef}
                        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mb-2"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                      >
                        {crossSellProducts.map(product => (
                          <div 
                            key={product.id}
                            className="flex-shrink-0 w-[140px] bg-white rounded-xl p-2 shadow-sm border border-warm-brown-100 hover:shadow-md transition group"
                          >
                            <div className="relative">
                              <img 
                                src={product.image} 
                                alt={product.shortName}
                                className="w-full h-20 object-contain rounded-lg bg-warm-brown-50 mb-2"
                              />
                              <span className="absolute top-1 left-1 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                -50%
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-700 truncate mb-1">
                              {product.shortName}
                            </p>
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-xs font-bold text-warm-brown-600">
                                  €{(product.price * 0.5).toFixed(2).replace('.', ',')}
                                </span>
                                <span className="text-[10px] text-slate-400 line-through ml-1">
                                  €{product.price.toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleQuickAdd(product)}
                                disabled={addedProducts[product.id]}
                                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                                  addedProducts[product.id]
                                    ? 'bg-green-500 text-white scale-110'
                                    : 'bg-warm-brown-500 text-white hover:bg-warm-brown-600 hover:scale-105'
                                }`}
                              >
                                {addedProducts[product.id] ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <Plus className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Pricing */}
                <div className="space-y-2 text-sm sm:text-base mb-6">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Subtotaal</span>
                    <span className="font-semibold">€{getSubtotal().toFixed(2).replace('.', ',')}</span>
                  </div>
                  {getDiscount() > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Korting (2e 50%)</span>
                      <span className="font-semibold">-€{getDiscount().toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span>Kortingscode ({appliedCoupon.code})</span>
                      <span className="font-semibold">-€{appliedCoupon.discount_amount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  {formData.giftWrap && (
                    <div className="flex justify-between text-slate-700">
                      <span>Cadeauverpakking</span>
                      <span className="font-semibold">€{GIFT_WRAP_PRICE.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">Verzending</span>
                    <span className="font-semibold text-green-600">GRATIS</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between text-xl sm:text-2xl font-bold mb-6 pt-4 border-t-2 border-warm-brown-100">
                  <span>Totaal</span>
                  <span className="text-warm-brown-600">€{(Math.max(0, getTotal() - (appliedCoupon ? appliedCoupon.discount_amount : 0) + (formData.giftWrap ? GIFT_WRAP_PRICE : 0))).toFixed(2).replace('.', ',')}</span>
                </div>

                {/* Submit Button - visible on desktop */}
                <button
                  type="submit"
                  id="checkout-form-submit"
                  disabled={isLoading}
                  className="hidden lg:flex w-full bg-warm-brown-500 text-white py-5 sm:py-6 rounded-xl font-bold text-lg sm:text-xl hover:bg-warm-brown-600 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed items-center justify-center gap-2"
                  data-testid="checkout-submit-button"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                      <span>Verwerken...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span>Veilig betalen €{(Math.max(0, getTotal() - (appliedCoupon ? appliedCoupon.discount_amount : 0) + (formData.giftWrap ? GIFT_WRAP_PRICE : 0))).toFixed(2).replace('.', ',')}</span>
                    </>
                  )}
                </button>

                {/* Trust indicators */}
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4 text-warm-brown-400" />
                    Met liefde gemaakt
                  </span>
                  <span className="flex items-center gap-1">
                    <Truck className="w-4 h-4 text-warm-brown-500" />
                    1-2 werkdagen
                  </span>
                </div>

                {/* Terms */}
                <p className="text-center text-xs sm:text-sm text-slate-500 mt-4">
                  Door te bestellen ga je akkoord met onze{' '}
                  <Link to="/voorwaarden" className="text-warm-brown-600 underline hover:text-warm-brown-700">
                    algemene voorwaarden
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Sticky Mobile Payment Bar */}
          <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50 bg-warm-brown-500 shadow-[0_-4px_20px_rgba(0,0,0,0.15)]" data-testid="sticky-payment-bar">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 text-white font-bold text-lg disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verwerken...</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Veilig betalen €{(Math.max(0, getTotal() - (appliedCoupon ? appliedCoupon.discount_amount : 0) + (formData.giftWrap ? GIFT_WRAP_PRICE : 0))).toFixed(2).replace('.', ',')}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Bottom padding for sticky bar on mobile */}
        <div className="h-16 lg:hidden" />

        {/* Trust Section - Enhanced */}
        <div className="mt-8 lg:mt-12">
          {/* Main Trust Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
            {/* Card 1 - Secure Payment */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 sm:p-8 border-2 border-green-100 hover:shadow-xl transition-all group">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <h3 className="font-bold text-lg sm:text-xl text-slate-800 mb-2">100% Veilig Betalen</h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  SSL versleutelde verbinding via Mollie. Je gegevens zijn altijd beschermd.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs sm:text-sm font-medium text-green-700">Beveiligd door SSL</span>
                </div>
              </div>
            </div>

            {/* Card 2 - Fast Delivery */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6 sm:p-8 border-2 border-blue-100 hover:shadow-xl transition-all group">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Truck className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <h3 className="font-bold text-lg sm:text-xl text-slate-800 mb-2">Snelle Levering</h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  GRATIS verzending in heel Nederland. Morgen al bij jou thuis!
                </p>
                <div className="mt-3 inline-flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full">
                  <span className="text-xs sm:text-sm font-bold text-blue-700">✓ Altijd gratis</span>
                </div>
              </div>
            </div>

            {/* Card 3 - Return Policy */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-lg p-6 sm:p-8 border-2 border-amber-100 hover:shadow-xl transition-all group sm:col-span-2 lg:col-span-1">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <h3 className="font-bold text-lg sm:text-xl text-slate-800 mb-2">14 Dagen Retour</h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  Niet 100% tevreden? Geen probleem! Stuur het terug en krijg je geld terug.
                </p>
                <div className="mt-3 inline-flex items-center gap-2 bg-amber-100 px-3 py-1 rounded-full">
                  <span className="text-xs sm:text-sm font-bold text-amber-700">Geld-terug-garantie</span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Trust Badges */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-slate-100">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 items-center">
              <div className="flex flex-col items-center text-center p-3">
                <div className="text-3xl sm:text-4xl mb-2">✓</div>
                <p className="text-xs sm:text-sm font-semibold text-slate-700">Klantenservice</p>
                <p className="text-xs text-slate-500">7 dagen per week</p>
              </div>
              <div className="flex flex-col items-center text-center p-3">
                <div className="text-3xl sm:text-4xl mb-2">★</div>
                <p className="text-xs sm:text-sm font-semibold text-slate-700">4.8/5 Sterren</p>
                <p className="text-xs text-slate-500">1000+ reviews</p>
              </div>
              <div className="flex flex-col items-center text-center p-3">
                <div className="text-3xl sm:text-4xl mb-2">🇳🇱</div>
                <p className="text-xs sm:text-sm font-semibold text-slate-700">Nederlands Bedrijf</p>
                <p className="text-xs text-slate-500">Lokale service</p>
              </div>
              <div className="flex flex-col items-center text-center p-3">
                <div className="text-3xl sm:text-4xl mb-2">💚</div>
                <p className="text-xs sm:text-sm font-semibold text-slate-700">Eco Verpakking</p>
                <p className="text-xs text-slate-500">100% recyclebaar</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Icons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <span className="text-sm text-slate-500">Betaal veilig met:</span>
          <img src="https://www.mollie.com/external/icons/payment-methods/ideal.svg" alt="iDEAL" className="h-8" />
          <img src="https://www.mollie.com/external/icons/payment-methods/creditcard.svg" alt="Creditcard" className="h-8" />
          <img src="https://www.mollie.com/external/icons/payment-methods/paypal.svg" alt="PayPal" className="h-8" />
          <img src="https://www.mollie.com/external/icons/payment-methods/applepay.svg" alt="Apple Pay" className="h-8" />
          <img src="https://www.mollie.com/external/icons/payment-methods/bancontact.svg" alt="Bancontact" className="h-8" />
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
