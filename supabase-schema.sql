-- SIMMER DOWN - SUPABASE DATABASE SCHEMA
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- MENU ITEMS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('pizza', 'sides', 'drinks', 'desserts')),
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- ORDERS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_email VARCHAR(255),
  delivery_address TEXT,
  order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('delivery', 'pickup')),
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- PROFILES TABLE (for admin users)
-- =====================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255),
  role VARCHAR(20) DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- ROW LEVEL SECURITY
-- =====================

-- Enable RLS
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Menu Items: Public read, admin write
CREATE POLICY "Menu items are viewable by everyone"
  ON menu_items FOR SELECT
  USING (true);

CREATE POLICY "Menu items are editable by authenticated users"
  ON menu_items FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Orders: Public insert, authenticated read/update
CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Orders are viewable by authenticated users"
  ON orders FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Orders are updatable by authenticated users"
  ON orders FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Profiles: Only own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- =====================
-- REALTIME
-- =====================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- =====================
-- TRIGGER: Auto-create profile on signup
-- =====================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'staff');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================
-- SAMPLE MENU DATA
-- =====================
INSERT INTO menu_items (name, description, price, category, available, image_url) VALUES
  ('Margherita', 'Fresh mozzarella, tomatoes, basil, olive oil on our signature crust', 12.99, 'pizza', true, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500'),
  ('Pepperoni', 'Classic pepperoni with mozzarella and our house tomato sauce', 14.99, 'pizza', true, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500'),
  ('BBQ Chicken', 'Grilled chicken, red onion, cilantro, BBQ sauce, mozzarella', 16.99, 'pizza', true, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500'),
  ('Hawaiian', 'Ham, pineapple, mozzarella cheese with tomato sauce', 15.99, 'pizza', true, 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=500'),
  ('Supreme', 'Pepperoni, sausage, bell peppers, onions, mushrooms, olives', 18.99, 'pizza', true, 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=500'),
  ('Meat Lovers', 'Pepperoni, sausage, bacon, ham, ground beef', 19.99, 'pizza', true, NULL),
  ('Veggie Delight', 'Mushrooms, bell peppers, onions, tomatoes, olives, spinach', 15.99, 'pizza', true, NULL),
  ('Garlic Breadsticks', 'Fresh baked with garlic butter and parmesan, served with marinara', 6.99, 'sides', true, 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=500'),
  ('Chicken Wings', 'Crispy wings with your choice of buffalo, BBQ, or garlic parmesan', 11.99, 'sides', true, 'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=500'),
  ('Caesar Salad', 'Romaine, parmesan, croutons, caesar dressing', 8.99, 'sides', true, NULL),
  ('Mozzarella Sticks', 'Crispy breaded mozzarella with marinara sauce', 7.99, 'sides', true, NULL),
  ('Coca-Cola', 'Classic refreshing Coca-Cola, ice cold', 2.49, 'drinks', true, NULL),
  ('Sprite', 'Crisp, refreshing lemon-lime soda', 2.49, 'drinks', true, NULL),
  ('Fanta Orange', 'Sweet orange flavored soda', 2.49, 'drinks', true, NULL),
  ('Bottled Water', 'Pure spring water', 1.99, 'drinks', true, NULL),
  ('Chocolate Brownie', 'Warm fudgy brownie served with vanilla ice cream', 7.99, 'desserts', true, 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=500'),
  ('Cinnamon Sticks', 'Sweet dough sticks dusted with cinnamon sugar, icing for dipping', 5.99, 'desserts', true, NULL),
  ('Cheesecake', 'New York style cheesecake with berry topping', 6.99, 'desserts', true, NULL)
ON CONFLICT DO NOTHING;
