-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  shop_name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
  wants_patra BOOLEAN DEFAULT false,
  patra_packets INTEGER DEFAULT 0,
  total_khakhra_kg DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date DATE
);

-- Create the khakhra_items table for order line items
CREATE TABLE IF NOT EXISTS khakhra_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  khakhra_type TEXT NOT NULL,
  quantity_kg DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_city ON orders(city);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_khakhra_items_order_id ON khakhra_items(order_id);

-- Enable Row Level Security (RLS)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE khakhra_items ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations for now (you can restrict later)
CREATE POLICY "Allow all operations on orders" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all operations on khakhra_items" ON khakhra_items FOR ALL USING (true);

-- Insert sample data for testing
INSERT INTO orders (shop_name, address, city, status, wants_patra, patra_packets, total_khakhra_kg, due_date) VALUES
('Raj Snacks Corner', '123 Main Street, Near Railway Station', 'Ahmedabad', 'pending', true, 5, 15.5, CURRENT_DATE + INTERVAL '5 days'),
('Gujarati Delights', '456 Market Road, Opposite Bus Stand', 'Surat', 'completed', false, 0, 8.0, CURRENT_DATE - INTERVAL '2 days'),
('Snack Palace', '789 Commercial Street, City Center', 'Vadodara', 'overdue', true, 3, 12.0, CURRENT_DATE - INTERVAL '3 days'),
('Taste of Gujarat', '321 Shopping Complex, Main Bazaar', 'Rajkot', 'pending', true, 2, 6.5, CURRENT_DATE + INTERVAL '7 days'),
('Khakhra King', '654 Food Street, Market Area', 'Bhavnagar', 'completed', false, 0, 10.0, CURRENT_DATE - INTERVAL '1 day');

-- Insert sample khakhra items
DO $$
DECLARE
    raj_order_id UUID;
    gujarati_order_id UUID;
    snack_order_id UUID;
    taste_order_id UUID;
    king_order_id UUID;
BEGIN
    -- Get order IDs
    SELECT id INTO raj_order_id FROM orders WHERE shop_name = 'Raj Snacks Corner';
    SELECT id INTO gujarati_order_id FROM orders WHERE shop_name = 'Gujarati Delights';
    SELECT id INTO snack_order_id FROM orders WHERE shop_name = 'Snack Palace';
    SELECT id INTO taste_order_id FROM orders WHERE shop_name = 'Taste of Gujarat';
    SELECT id INTO king_order_id FROM orders WHERE shop_name = 'Khakhra King';

    -- Insert khakhra items
    INSERT INTO khakhra_items (order_id, khakhra_type, quantity_kg) VALUES
    (raj_order_id, 'Methi Khakhra', 5.0),
    (raj_order_id, 'Jeera Khakhra', 7.5),
    (raj_order_id, 'Plain Khakhra', 3.0),
    (gujarati_order_id, 'Masala Khakhra', 8.0),
    (snack_order_id, 'Methi Khakhra', 6.0),
    (snack_order_id, 'Garlic Khakhra', 6.0),
    (taste_order_id, 'Palak Khakhra', 3.5),
    (taste_order_id, 'Bajra Khakhra', 3.0),
    (king_order_id, 'Plain Khakhra', 4.0),
    (king_order_id, 'Jeera Khakhra', 6.0);
END $$;

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Display success message
DO $$
BEGIN
    RAISE NOTICE 'Database setup completed successfully!';
    RAISE NOTICE 'Created tables: orders, khakhra_items';
    RAISE NOTICE 'Added sample data with 5 orders and their khakhra items';
    RAISE NOTICE 'Enabled Row Level Security with open policies';
END $$;
