import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { products as fallbackProducts } from '../mockData';

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

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      if (data && data.length > 0) {
        setProducts(data);
      } else {
        setProducts(fallbackProducts);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching products, using fallback:', err);
      setProducts(fallbackProducts);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProductById = useCallback(async (id) => {
    try {
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) throw new Error('Product not found');
      return await response.json();
    } catch (err) {
      return fallbackProducts.find(p => String(p.id) === String(id)) || null;
    }
  }, []);

  const getProductById = useCallback((id) => {
    return products.find(p => String(p.id) === String(id));
  }, [products]);

  const refreshProducts = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

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
