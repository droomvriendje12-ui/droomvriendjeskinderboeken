import React from 'react';
import Header from './Header';
import Footer from './Footer';
import CartSidebar from './CartSidebar';

/**
 * Layout Component - Wrapper voor alle pagina's met Header, Footer en CartSidebar
 * Consistent Warm Brown Theme
 */
const Layout = ({ 
  children, 
  showFullNav = false,
  showBackButton = true,
  backButtonText = "Terug",
  backButtonLink = "/",
  showPromoBanner = false,
  promoBannerText = "LENTE SALE: 2E KNUFFEL 50% KORTING 🌸",
  hideFooter = false,
  hideHeader = false,
  bgClassName = "bg-cream"
}) => {
  return (
    <div className={`min-h-screen flex flex-col ${bgClassName}`}>
      {/* Shopping Cart Sidebar - Always available */}
      <CartSidebar />

      {/* Header */}
      {!hideHeader && (
        <Header 
          showFullNav={showFullNav}
          showBackButton={showBackButton}
          backButtonText={backButtonText}
          backButtonLink={backButtonLink}
        />
      )}

      {/* Promo Banner */}
      {showPromoBanner && (
        <div className="bg-warm-brown-500 text-white py-3 text-center">
          <p className="text-sm md:text-base font-medium tracking-wide">
            {promoBannerText}
          </p>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      {!hideFooter && <Footer />}
    </div>
  );
};

export default Layout;
