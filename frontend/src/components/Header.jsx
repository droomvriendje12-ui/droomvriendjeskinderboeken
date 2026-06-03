import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Menu, X, ShoppingCart, Search } from 'lucide-react';
import { useCart } from '../context/CartContext';

/**
 * Header Component - Consistent Warm Brown Theme
 */
const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { cart, setIsCartOpen } = useCart();

  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/knuffels", label: "Knuffels" },
    { href: "/kinderboek", label: "Maak een boek", badge: "Nieuw" },
    { href: "/pro", label: "Printables" },
    { href: "/quiz", label: "Quiz" },
    { href: "/cadeaubon", label: "Cadeaubonnen" },
    { href: "/over-ons", label: "Over Droomvriendjes" },
    { href: "/contact", label: "Contact" }
  ];

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 sm:h-28">
          
          {/* Logo */}
          <Link 
            to="/" 
            className="flex-shrink-0 flex items-center"
          >
            <img 
              alt="Droomvriendjes.nl" 
              className="h-16 sm:h-24 w-auto" 
              src="/logo.svg"
            />
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-5 lg:space-x-8">
            {navLinks.map((link) => (
              <Link 
                key={link.href}
                to={link.href} 
                data-testid={`nav-desktop-${link.href === '/' ? 'home' : link.href.replace('/', '')}`}
                className="text-slate-600 hover:text-warm-brown-500 font-medium transition flex items-center gap-1.5"
              >
                {link.label}
                {link.badge && (
                  <span className="text-[9px] font-bold uppercase tracking-wide bg-warm-brown-500 text-white px-1.5 py-0.5 rounded-full leading-none">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Right side: Search + Cart */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            {/* Search Button - Hidden on mobile */}
            <button className="hidden sm:block text-slate-600 hover:text-warm-brown-500 transition">
              <Search className="w-5 h-5" />
            </button>

            {/* Cart Button */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative cursor-pointer group"
              data-testid="header-cart-button"
            >
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 group-hover:text-warm-brown-500 transition" />
              <span className="absolute -top-2 -right-2 bg-warm-brown-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {cartItemsCount}
              </span>
            </button>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-slate-600 hover:text-warm-brown-500 p-2"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        <div className={`md:hidden border-t border-slate-100 overflow-hidden transition-all duration-300 ${isMobileMenuOpen ? 'max-h-[500px] py-4' : 'max-h-0'}`}>
          <div className="space-y-3">
            {navLinks.map((link) => (
              <Link 
                key={link.href}
                to={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                data-testid={`nav-mobile-${link.href === '/' ? 'home' : link.href.replace('/', '')}`}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-warm-brown-50 hover:text-warm-brown-600 font-medium transition rounded-lg"
              >
                {link.label}
                {link.badge && (
                  <span className="text-[9px] font-bold uppercase tracking-wide bg-warm-brown-500 text-white px-1.5 py-0.5 rounded-full leading-none">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
            <div className="px-4 pt-2">
              <button className="w-full text-left py-2 text-slate-600 hover:text-warm-brown-600">
                <Search className="w-4 h-4 inline mr-2" />
                Zoeken
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
