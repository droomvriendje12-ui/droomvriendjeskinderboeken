import { useEffect, useState } from 'react';

// Module-level cache so we hit /api/products at most once per page session
let _cache = null;
let _pending = null;

async function fetchAll() {
  if (_cache) return _cache;
  if (_pending) return _pending;
  _pending = (async () => {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      _cache = Array.isArray(data) ? data : [];
      return _cache;
    } catch (e) {
      _cache = [];
      return _cache;
    }
  })();
  return _pending;
}

/**
 * Returns a single digital product matched by id (e.g. "digital-bedtime-chart").
 * Returns `null` while loading or when not found.
 */
export const useDigitalProduct = (productId) => {
  const [product, setProduct] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetchAll().then((items) => {
      if (!mounted) return;
      const match = items.find((p) => String(p.id) === String(productId)) || null;
      setProduct(match);
    });
    return () => {
      mounted = false;
    };
  }, [productId]);

  return product;
};

export default useDigitalProduct;
