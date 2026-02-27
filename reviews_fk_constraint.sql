-- Reviews product_id Foreign Key constraint
-- Voer dit uit in je Supabase SQL Editor (Dashboard > SQL Editor)

-- Stap 1: Voeg FK constraint toe (product_id → products.id)
-- NULL is toegestaan zodat bestaande reviews zonder product_id niet falen
ALTER TABLE reviews 
ADD CONSTRAINT fk_reviews_product 
FOREIGN KEY (product_id) 
REFERENCES products(id) 
ON DELETE SET NULL;

-- Stap 2: Maak een index op product_id voor snellere queries
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);

-- Stap 3: Optioneel - Controleer hoeveel reviews per product
SELECT 
    p.short_name as product,
    COUNT(r.id) as reviews_count,
    ROUND(AVG(r.rating), 1) as avg_rating
FROM products p
LEFT JOIN reviews r ON r.product_id = p.id
GROUP BY p.id, p.short_name
ORDER BY reviews_count DESC;
