import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Star, ChevronUp, X, Minus, Plus } from 'lucide-react';
import { Button } from './ui/button';

// Helper function to manage stock scarcity logic
const getSessionStock = (productId) => {
  const storageKey = `stock_${productId}`;
  const sessionKey = `stock_session_${productId}`;
  
  // Check if we have a session-locked stock number
  let currentStock = sessionStorage.getItem(storageKey);
  let sessionCreated = sessionStorage.getItem(sessionKey);
  
  if (!currentStock || !sessionCreated) {
    // First visit - initialize with a random low stock (3-7)
    const initialStock = Math.floor(Math.random() * 5) + 3;
    sessionStorage.setItem(storageKey, initialStock.toString());
    sessionStorage.setItem(sessionKey, Date.now().toString());
    return initialStock;
  }
  
  // Parse existing stock
  let stock = parseInt(currentStock);
  const sessionTime = parseInt(sessionCreated);
  const timeSinceSession = Date.now() - sessionTime;
  
  // Controlled decay: decrease by 1 every 2 minutes (120000ms), max decrease of 2
  const minutesElapsed = Math.floor(timeSinceSession / 120000);
  if (minutesElapsed > 0) {
    const decrease = Math.min(minutesElapsed, 2); // Max 2 decrease
    stock = Math.max(1, stock - decrease); // Never go below 1
    sessionStorage.setItem(storageKey, stock.toString());
    sessionStorage.setItem(sessionKey, Date.now().toString());
  }
  
  return stock;
};

const StickyAddToCart = ({ product, onAddToCart, isCartOpen }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState('bottom'); // 'bottom' or 'top'
  const [quantity, setQuantity] = useState(1);
  const [isMinimized, setIsMinimized] = useState(false);
  const [stockLeft, setStockLeft] = useState(null);
  const lastScrollY = useRef(0);
  const addToCartButtonRef = useRef(null);

  // Digital products don't have physical inventory — never run scarcity logic for them
  const isDigital = !!product && (
    product.productType === 'digital' ||
    (typeof product.id === 'string' && product.id.startsWith('digital-'))
  );

  // Initialize stock on mount and check periodically
  useEffect(() => {
    if (!product) return;
    
    const updateStock = () => {
      const stock = getSessionStock(product.id);
      setStockLeft(stock);
    };
    
    // Initial stock
    updateStock();
    
    // Check every minute for potential decay
    const interval = setInterval(updateStock, 60000);
    
    return () => clearInterval(interval);
  }, [product]);

  useEffect(() => {
    // Find the main add-to-cart button on the page
    const mainAddToCartBtn = document.querySelector('[data-testid="add-to-cart-button"]');
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY.current;
      
      // Check if main add-to-cart button is out of view
      if (mainAddToCartBtn) {
        const rect = mainAddToCartBtn.getBoundingClientRect();
        const isMainButtonVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
        
        // Show sticky bar when main button is not visible and we've scrolled down
        if (!isMainButtonVisible && currentScrollY > 400) {
          setIsVisible(true);
          
          // Smart positioning: bottom when scrolling down, top when scrolling up
          if (scrollingDown) {
            setPosition('bottom');
          } else {
            setPosition('top');
          }
        } else {
          setIsVisible(false);
        }
      } else {
        // Fallback: show after scrolling 400px
        if (currentScrollY > 400) {
          setIsVisible(true);
          setPosition(scrollingDown ? 'bottom' : 'top');
        } else {
          setIsVisible(false);
        }
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hide when cart is open
  useEffect(() => {
    if (isCartOpen) {
      setIsVisible(false);
    }
  }, [isCartOpen]);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      onAddToCart(product);
    }
    // Visual feedback
    setIsMinimized(true);
    setTimeout(() => setIsMinimized(false), 2000);
  };

  const incrementQuantity = () => setQuantity(prev => Math.min(prev + 1, 10));
  const decrementQuantity = () => setQuantity(prev => Math.max(prev - 1, 1));

  if (!product || !isVisible) return null;

  // Always show 50% discount badge for marketing purposes
  const showDiscountBadge = true;
  const discountPercent = 50;
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  return (
    <div 
      className={`fixed left-0 right-0 z-50 transform transition-all duration-300 ease-out ${
        position === 'bottom' ? 'bottom-0' : 'top-0'
      } ${
        isMinimized ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
      }`}
      data-testid="sticky-add-to-cart"
    >
      {/* Backdrop blur effect */}
      <div className="absolute inset-0 bg-white/95 backdrop-blur-md shadow-2xl" />
      
      {/* Main content */}
      <div className="relative max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Product Info - Left Side */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Product Image */}
            <div className="relative flex-shrink-0">
              <img 
                src={product.image} 
                alt={product.shortName}
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-xl bg-[#fdf8f3] p-1"
              />
              {showDiscountBadge && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  -{discountPercent}%
                </span>
              )}
            </div>
            
            {/* Product Details */}
            <div className="min-w-0 hidden sm:block">
              <h3 className="font-bold text-[#5a4a3a] truncate text-sm sm:text-base">
                {product.shortName}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                {/* Rating */}
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-3 h-3 ${
                        i < Math.floor(product.rating) 
                          ? 'fill-amber-400 text-amber-400' 
                          : 'fill-gray-200 text-gray-200'
                      }`} 
                    />
                  ))}
                  <span className="text-xs text-gray-500 ml-1">{product.rating}</span>
                </div>
                {/* Stock indicator */}
                <span className="text-xs text-green-600 font-medium hidden md:inline">
                  {isDigital ? '📥 Direct download' : '✓ Op voorraad'}
                </span>
              </div>
            </div>
          </div>

          {/* Quantity Selector - Middle */}
          <div className="hidden md:flex items-center gap-1 bg-gray-100 rounded-full px-1 py-1">
            <button 
              onClick={decrementQuantity}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white transition-colors"
              aria-label="Verminder aantal"
            >
              <Minus className="w-4 h-4 text-gray-600" />
            </button>
            <span className="w-8 text-center font-semibold text-[#5a4a3a]">{quantity}</span>
            <button 
              onClick={incrementQuantity}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white transition-colors"
              aria-label="Verhoog aantal"
            >
              <Plus className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Price - Right Side */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-right">
              {hasDiscount && (
                <span className="text-xs sm:text-sm text-gray-400 line-through block">
                  €{product.originalPrice.toFixed(2)}
                </span>
              )}
              <span className="text-lg sm:text-xl font-bold text-[#5a4a3a]">
                €{product.price.toFixed(2)}
              </span>
            </div>

            {/* Add to Cart Button */}
            <Button 
              onClick={handleAddToCart}
              className="bg-[#8B7355] hover:bg-[#6d5a45] text-white px-4 sm:px-6 py-5 sm:py-6 rounded-full font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-2"
              data-testid="sticky-add-to-cart-btn"
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Toevoegen</span>
              <span className="xs:hidden">+</span>
            </Button>
          </div>
        </div>

        {/* Progress bar for urgency — physical only */}
        {!isDigital && (
        <div className="mt-2 hidden sm:block">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>🔥 Bijna uitverkocht!</span>
            <span>Nog {stockLeft || 3} op voorraad</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            {/* Progress bar synced with stock - lower stock = emptier bar */}
            <div 
              className="bg-gradient-to-r from-orange-400 to-red-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, ((stockLeft || 3) / 10) * 100)}%` }} 
            />
          </div>
        </div>
        )}

        {/* Digital ready-now indicator */}
        {isDigital && (
        <div className="mt-2 hidden sm:block">
          <div className="flex items-center justify-between text-xs text-emerald-700 mb-1">
            <span>📥 Direct beschikbaar na betaling</span>
            <span>🖨️ Onbeperkt printen</span>
          </div>
          <div className="w-full bg-emerald-100 rounded-full h-1.5">
            <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-1.5 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>
        )}

        {/* Mobile close hint */}
        <button 
          onClick={() => setIsMinimized(true)}
          className="absolute top-1 right-1 p-1 text-gray-400 hover:text-gray-600 sm:hidden"
          aria-label="Sluiten"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Top shadow when at top */}
      {position === 'top' && (
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-b from-transparent to-black/5" />
      )}
      
      {/* Bottom shadow when at bottom */}
      {position === 'bottom' && (
        <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-t from-transparent to-black/5" />
      )}
    </div>
  );
};

export default StickyAddToCart;
