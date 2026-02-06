-- Simmer Down Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- MENU ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('pizza', 'sides', 'drinks', 'desserts')),
  available BOOLEAN DEFAULT true,
  tags TEXT[], -- Array for dietary tags: vegetarian, vegan, gluten-free, spicy
  size VARCHAR(20), -- e.g., '12"', '16oz'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_email VARCHAR(255),
  delivery_address TEXT,
  is_delivery BOOLEAN DEFAULT false,
  items_json JSONB, -- Store cart items as JSON
  items_description TEXT, -- Human-readable: "2x Margherita, 1x Pepperoni"
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'cash',
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed', 'cancelled')),
  notes TEXT,
  location_id UUID,
  estimated_ready_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROFILES TABLE (Admin/Staff Users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(20) DEFAULT 'staff' CHECK (role IN ('admin', 'staff', 'manager')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LOCATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  tagline VARCHAR(255),
  address TEXT NOT NULL,
  city VARCHAR(100),
  phone VARCHAR(50),
  hours_weekday VARCHAR(100),
  hours_weekend VARCHAR(100),
  features TEXT[],
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  map_url TEXT,
  image_url TEXT,
  delivery_available BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'coming_soon')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CUSTOMERS TABLE (Optional - for loyalty program)
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  loyalty_points INTEGER DEFAULT 0,
  loyalty_tier VARCHAR(20) DEFAULT 'bronze' CHECK (loyalty_tier IN ('bronze', 'silver', 'gold')),
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(available);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Menu items: Public read, admin write
CREATE POLICY "Menu items are viewable by everyone" ON menu_items
  FOR SELECT USING (true);

CREATE POLICY "Menu items are editable by admins" ON menu_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager'))
  );

-- Orders: Anyone can create, admins can view/update all
CREATE POLICY "Anyone can create orders" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Orders viewable by admins" ON orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager', 'staff'))
  );

CREATE POLICY "Orders updatable by admins" ON orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager', 'staff'))
  );

-- Profiles: Users can view own, admins can view all
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Locations: Public read
CREATE POLICY "Locations are viewable by everyone" ON locations
  FOR SELECT USING (true);

CREATE POLICY "Locations editable by admins" ON locations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager'))
  );

-- Customers: Public insert/update own, admins view all
CREATE POLICY "Customers can be created" ON customers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Customers viewable by admins" ON customers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager'))
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SEED DATA: MENU ITEMS
-- ============================================
INSERT INTO menu_items (name, description, price, category, available, tags, size, image_url) VALUES
-- Pizzas
('The Salvadoreño', 'Chorizo local, queso fresco, jalapeños, cilantro', 18.99, 'pizza', true, ARRAY['spicy'], '12"', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80'),
('Margherita', 'Tomates San Marzano, mozzarella fresca, albahaca', 14.99, 'pizza', true, ARRAY['vegetarian'], '12"', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80'),
('Pepperoni', 'Pepperoni clásico, mozzarella, salsa de tomate de la casa', 15.99, 'pizza', true, NULL, '12"', 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&q=80'),
('Truffle Mushroom', 'Hongos silvestres, aceite de trufa, fontina, arúgula', 22.99, 'pizza', true, ARRAY['vegetarian'], '12"', 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600&q=80'),
('Spicy Diavola', 'Salami picante, chiles Calabrian, miel', 19.99, 'pizza', true, ARRAY['spicy'], '12"', 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=600&q=80'),
('BBQ Chicken', 'Pollo a la parrilla, cebolla roja, cilantro, salsa BBQ', 17.99, 'pizza', true, NULL, '12"', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80'),

-- Sides
('Garlic Breadsticks', 'Pan recién horneado con mantequilla de ajo y parmesano', 7.99, 'sides', true, ARRAY['vegetarian'], NULL, 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=600&q=80'),
('Caesar Salad', 'Lechuga romana, parmesano, crutones, aderezo caesar', 9.99, 'sides', true, ARRAY['vegetarian', 'gluten-free'], NULL, 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&q=80'),

-- Drinks
('Craft Lemonade', 'Limonada fresca con menta', 4.99, 'drinks', true, ARRAY['vegan', 'gluten-free'], '16oz', NULL),
('Horchata', 'Bebida tradicional salvadoreña de arroz', 4.49, 'drinks', true, ARRAY['vegan', 'gluten-free'], '16oz', NULL),

-- Desserts
('Chocolate Lava Cake', 'Pastel de chocolate tibio con centro fundido', 8.99, 'desserts', true, ARRAY['vegetarian'], NULL, 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=600&q=80'),
('Tiramisu', 'Clásico italiano con espresso y mascarpone', 7.99, 'desserts', true, ARRAY['vegetarian'], NULL, NULL)

ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DATA: LOCATIONS
-- ============================================
INSERT INTO locations (name, tagline, address, city, phone, hours_weekday, hours_weekend, features, lat, lng, delivery_available) VALUES
('Santa Ana', 'Donde Todo Comenzó', '1ra Calle Pte y Callejuela Sur Catedral', 'Santa Ana, El Salvador', '+503 2445-5999', 'Dom – Jue: 11am – 9pm', 'Vie – Sáb: 11am – 10pm', ARRAY['Frente a Catedral', 'Historia', 'Cultura', 'Terraza'], 13.9942, -89.5597, true),
('Coatepeque', 'Vista al Lago', 'Calle Principal al Lago de Coatepeque #119', 'Lago de Coatepeque, El Salvador', '+503 6831-6907', 'Dom – Jue: 11am – 8pm', 'Vie – Sáb: 11am – 9pm', ARRAY['Vista al Lago', 'Atardeceres', 'Naturaleza', 'Terraza'], 13.8667, -89.5500, true),
('San Benito', 'El Punto Urbano', 'Boulevard El Hipódromo #548, San Benito', 'San Salvador, El Salvador', '+503 7487-7792', 'Lun – Mié: 12–2:30pm, 5:30–9pm', 'Jue: 12–2:30pm, 5:30–10pm | Vie–Sáb: 12pm–11pm', ARRAY['Zona Rosa', 'Vida Nocturna', 'Cosmopolita', 'Full Bar'], 13.6929, -89.2365, true),
('Simmer Garden', 'Ruta de las Flores', 'Kilómetro 91.5, San José La Majada', 'Juayúa, Sonsonate, El Salvador', '+503 6990-4674', 'Dom – Jue: 11am – 8pm', 'Vie – Sáb: 11am – 8:30pm', ARRAY['Ruta de las Flores', 'Jardín', 'Montaña', 'Naturaleza'], 13.8467, -89.7456, false),
('Surf City', 'Frente al Mar', 'Hotel Casa Santa Emilia, Conchalio 2', 'La Libertad, El Salvador', '+503 7576-4655', 'Miércoles – Domingo: 12pm – 8pm', '', ARRAY['Playa', 'Surf', 'Atardeceres', 'Brisa Marina'], 13.4833, -89.3333, false)

ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Database schema created successfully!' as message;
