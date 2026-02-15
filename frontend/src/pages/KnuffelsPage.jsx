import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductsContext';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Star, ShoppingCart, Filter } from 'lucide-react';
import { trackViewItemList, trackSelectItem } from '../utils/analytics';

const KnuffelsPage = () => {
  const { addToCart } = useCart();
  const { products, loading } = useProducts();

  // Sort products: in-stock first, out-of-stock at the end
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const aInStock = a.inStock !== false;
      const bInStock = b.inStock !== false;
      if (aInStock === bInStock) return 0;
      return aInStock ? -1 : 1;
    });
  }, [products]);

  // GA4: Track view_item_list when page loads
  useEffect(() => {
    if (sortedProducts.length > 0) {
      trackViewItemList(sortedProducts, 'alle_knuffels', 'Alle Knuffels');
    }
  }, [sortedProducts]);

  // GA4: Track product click
  const handleProductClick = (product, index) => {
    trackSelectItem(product, index, 'alle_knuffels', 'Alle Knuffels');
  };

  return (
    <Layout showBackButton={true}>
      {/* Hero Section - Brown Theme */}
      <section className="bg-gradient-to-b from-[#f5efe8] via-[#fdf8f3] to-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block bg-[#8B7355]/10 text-[#8B7355] px-4 py-2 rounded-full text-sm font-semibold mb-4">
            Onze Collectie
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-[#5a4a3a] mb-4">
            Alle <span className="text-[#8B7355]">Droomvriendjes</span>
          </h1>
          <p className="text-lg text-[#7a6a5a] max-w-2xl mx-auto">
            Ontdek onze complete collectie slaapknuffels met rustgevende lichtjes en geluiden. 
            Perfect voor een betere nachtrust.
          </p>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-white border-b border-[#e8e0d8] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-sm text-[#7a6a5a]">
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Gratis verzending</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>14 dagen bedenktijd</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Veilig betalen</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Voor 23:00 besteld = morgen in huis</span>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid - Brown Theme */}
      <section className="py-12 bg-gradient-to-b from-[#fdf8f3] to-[#f5efe8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Results Count */}
          <div className="flex items-center justify-between mb-8">
            <p className="text-[#7a6a5a]">
              <span className="font-semibold text-[#5a4a3a]">{sortedProducts.length}</span> producten gevonden
            </p>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="products-grid">
            {sortedProducts.map((product, index) => (
              <div 
                key={product.id} 
                className={`group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-full ${product.inStock === false ? 'opacity-75' : ''}`}
                data-testid={`product-card-${product.id}`}
              >
                {/* Product Image with Badge */}
                <div className="relative aspect-square">
                  {/* Badge - Top Left */}
                  {product.badge && (
                    <div className="absolute top-3 left-3 z-10">
                      <span className={`text-white text-[10px] font-bold px-3 py-1 uppercase tracking-wide ${
                        product.badge === 'UITVERKOCHT' ? 'bg-gray-600' : 'bg-[#2d2d2d]'
                      }`}>
                        {product.badge}
                      </span>
                    </div>
                  )}
                  
                  {/* Product Image */}
                  <Link to={`/product/${product.id}`} onClick={() => { handleProductClick(product, index); window.scrollTo(0, 0); }}>
                    <div className="relative bg-[#faf7f4] cursor-pointer w-full h-full flex items-center justify-center p-4">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className={`w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 ${product.inStock === false ? 'grayscale' : ''}`}
                        style={{ aspectRatio: '1/1' }}
                      />
                      {product.inStock === false && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="bg-red-600 text-white px-4 py-2 rounded-full font-bold text-sm">UITVERKOCHT</span>
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
                
                {/* Product Info */}
                <div className="p-4 flex-1 flex flex-col">
                  {/* Product Name and Price Row */}
                  <Link to={`/product/${product.id}`} onClick={() => window.scrollTo(0, 0)}>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-base font-semibold text-[#3d3d3d] group-hover:text-[#8B7355] transition-colors cursor-pointer flex-1 pr-2 line-clamp-2">
                        {product.shortName || product.name}
                      </h3>
                      <span className="text-lg font-bold text-[#8B7355] flex-shrink-0">€{product.price.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </Link>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-300 text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">({product.reviews} reviews)</span>
                  </div>
                  
                  {/* Description with line-clamp */}
                  <div className="min-h-[3.6rem] mb-3 flex-grow">
                    <p className="text-sm text-gray-500 line-clamp-3">
                      {product.description}
                    </p>
                  </div>
                  
                  {/* Stock Status */}
                  <div className="mb-3">
                    {product.inStock === false ? (
                      <p className="text-xs text-red-600 font-medium">✗ Uitverkocht</p>
                    ) : (
                      <p className="text-xs text-green-600">✓ Op voorraad - morgen in huis</p>
                    )}
                  </div>
                  
                  {/* Add to Cart Button - Always at bottom */}
                  <div className="mt-auto">
                    {product.inStock === false ? (
                      <Button 
                        className="w-full bg-gray-400 text-white font-medium py-3 rounded-lg cursor-not-allowed"
                        disabled
                      >
                        Uitverkocht
                      </Button>
                    ) : (
                      <Button 
                        className="w-full bg-[#8B7355] hover:bg-[#6d5a45] text-white font-medium py-3 rounded-lg transition-colors"
                        onClick={() => addToCart(product)}
                        data-testid={`add-to-cart-${product.id}`}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        In Winkelwagen
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Brown Theme */}
      <section className="py-12 bg-gradient-to-r from-[#8B7355] to-[#6d5a45] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Hulp nodig bij het kiezen?
          </h2>
          <p className="text-lg mb-6 opacity-90">
            Neem contact met ons op en we helpen je graag de perfecte Droomvriendje te vinden.
          </p>
          <Link to="/contact">
            <Button size="lg" className="bg-white text-[#8B7355] hover:bg-gray-100 px-8 py-6 font-bold rounded-full">
              Neem Contact Op
            </Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default KnuffelsPage;
