-- Add specs and quick_features columns to products table
-- Run this in Supabase SQL Editor

-- Add specs column (JSONB for technical specifications)
ALTER TABLE products ADD COLUMN IF NOT EXISTS specs JSONB DEFAULT '{}';

-- Add quick_features column (JSONB for quick feature icons)
ALTER TABLE products ADD COLUMN IF NOT EXISTS quick_features JSONB DEFAULT '[]';

-- Comment for documentation
COMMENT ON COLUMN products.specs IS 'Technical specifications: projection, audio, power, timer, tipText';
COMMENT ON COLUMN products.quick_features IS 'Quick feature icons shown on product page: [{icon: "🤖", label: "AI Huilsensor"}]';
