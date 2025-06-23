-- Create the orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- Insert sample data
INSERT INTO orders (shop_name, address, city, status, wants_patra, patra_packets, total_khakhra_kg, due_date) VALUES
('Raj Snacks Corner', '123 Main Street, Near Railway Station', 'Ahmedabad', 'pending', true, 5, 15.5, '2024-01-15'),
('Gujarati Delights', '456 Market Road, Opposite Bus Stand', 'Surat', 'completed', false, 0, 8.0, '2024-01-10'),
('Snack Palace', '789 Commercial Street, City Center', 'Vadodara', 'overdue', true, 3, 12.0, '2024-01-05');

-- Insert sample khakhra items
INSERT INTO khakhra_items (order_id, khakhra_type, quantity_kg) VALUES
((SELECT id FROM orders WHERE shop_name = 'Raj Snacks Corner'), 'Methi Khakhra', 5.0),
((SELECT id FROM orders WHERE shop_name = 'Raj Snacks Corner'), 'Jeera Khakhra', 7.5),
((SELECT id FROM orders WHERE shop_name = 'Raj Snacks Corner'), 'Plain Khakhra', 3.0),
((SELECT id FROM orders WHERE shop_name = 'Gujarati Delights'), 'Masala Khakhra', 8.0),
((SELECT id FROM orders WHERE shop_name = 'Snack Palace'), 'Methi Khakhra', 6.0),
((SELECT id FROM orders WHERE shop_name = 'Snack Palace'), 'Garlic Khakhra', 6.0);
