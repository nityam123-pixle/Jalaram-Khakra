-- =============================================
-- JALARAM KHAKRA — Customers table + backfill from orders
-- Run in Supabase SQL Editor (or psql). Safe to re-run with ON CONFLICT.
-- =============================================

-- Step 1: Extension (required before pg_trgm GIN index)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Step 2: Customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name text NOT NULL,
  city text NOT NULL,
  address text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (shop_name, city)
);

-- Step 3: Indexes
CREATE INDEX IF NOT EXISTS customers_shop_name_idx
  ON customers USING gin (to_tsvector('english', shop_name));

CREATE INDEX IF NOT EXISTS customers_shop_name_trgm_idx
  ON customers USING gin (shop_name gin_trgm_ops);

-- Step 4: Populate from existing orders (unique shop + city)
INSERT INTO customers (shop_name, city, address)
SELECT DISTINCT ON (shop_name, city)
  shop_name,
  city,
  address
FROM orders
WHERE shop_name IS NOT NULL AND trim(shop_name) != ''
ORDER BY shop_name, city, address
ON CONFLICT (shop_name, city) DO NOTHING;

-- =============================================
-- Done
-- =============================================
