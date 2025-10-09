-- Product Analyzer Database Schema
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/_/sql

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  brand TEXT NOT NULL DEFAULT 'Unknown',
  category TEXT NOT NULL DEFAULT '',
  sub_category TEXT NOT NULL DEFAULT '',
  expiry_date DATE,
  mrp TEXT,
  weight TEXT,
  ingredients TEXT,
  nutritional_info TEXT,
  health_score NUMERIC(3,1) DEFAULT 0,
  health_rating TEXT,
  concerns TEXT,
  quantity INTEGER DEFAULT 1,
  date_added TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_product_name ON products(product_name);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_expiry_date ON products(expiry_date);
CREATE INDEX IF NOT EXISTS idx_products_health_score ON products(health_score);
CREATE INDEX IF NOT EXISTS idx_products_date_added ON products(date_added DESC);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_products_name_brand ON products(product_name, brand);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (you can restrict this later)
CREATE POLICY "Enable all operations for all users" ON products
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Optional: Create a view for easier querying with computed days_to_expire
CREATE OR REPLACE VIEW products_view AS
SELECT
  id::text,
  product_name as "productName",
  brand,
  category,
  sub_category as "subCategory",
  expiry_date::text as "expiryDate",
  CASE
    WHEN expiry_date IS NOT NULL THEN (expiry_date - CURRENT_DATE)
    ELSE NULL
  END as "daysToExpire",
  mrp,
  weight,
  ingredients,
  nutritional_info as "nutritionalInfo",
  health_score as "healthScore",
  health_rating as "healthRating",
  concerns,
  quantity,
  date_added::text as "dateAdded",
  created_at::text as "createdAt",
  updated_at::text as "updatedAt"
FROM products
ORDER BY date_added DESC;

-- Grant permissions
GRANT ALL ON products TO anon, authenticated;
GRANT ALL ON products_view TO anon, authenticated;
