import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Use relative URLs for proxy support in development
const ProductsContext = createContext();

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
};

export const ProductsProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all products from API using relative URL (works with proxy)
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products');
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      setProducts(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch single product by ID with fallback
  const fetchProductById = useCallback(async (id) => {
    try {
      let response;
      try {
        response = await fetch(`${API_URL}/api/products/${id}`);
        if (!response.ok) throw new Error('External API failed');
      } catch (externalErr) {
        // Fallback to local API
        response = await fetch(`${LOCAL_API_URL}/api/products/${id}`);
      }
      
      if (!response.ok) {
        throw new Error('Product not found');
      }
      return await response.json();
    } catch (err) {
      console.error('Error fetching product:', err);
      return null;
    }
  }, []);

  // Get product from local state (faster)
  const getProductById = useCallback((id) => {
    // Support both string UUIDs and numeric IDs
    return products.find(p => String(p.id) === String(id));
  }, [products]);

  // Refresh products
  const refreshProducts = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Load products on mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const value = {
    products,
    loading,
    error,
    fetchProducts,
    fetchProductById,
    getProductById,
    refreshProducts,
  };

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
};

export default ProductsContext;
