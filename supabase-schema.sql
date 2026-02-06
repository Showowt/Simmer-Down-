-- SIMMER DOWN - SUPABASE DATABASE SCHEMA
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- PROFILES TABLE (for customers & admin users)
-- =====================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255),
  full_name VARCHAR(255),
  phone VARCHAR(50),
  loyalty_points INTEGER DEFAULT 0,
  loyalty_tier VARCHAR(20) DEFAULT 'bronze' CHECK (loyalty_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
  size VARCHAR(20),
  tags TEXT[],
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- LOCATIONS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(50),
  hours_weekday VARCHAR(100),
  hours_weekend VARCHAR(100),
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  is_open BOOLEAN DEFAULT true,
  delivery_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- CONTACT SUBMISSIONS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  reason VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'read', 'responded', 'archived')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact submissions: Public insert, admin read
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact form"
  ON contact_submissions FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can view contact submissions"
  ON contact_submissions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- =====================
-- ORDERS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE,
  customer_id UUID REFERENCES profiles(id),
  location_id UUID REFERENCES locations(id),
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_email VARCHAR(255),
  delivery_address TEXT,
  is_delivery BOOLEAN DEFAULT true,
  items_json JSONB NOT NULL,
  items_description TEXT,
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20) DEFAULT 'cash',
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'ready', 'delivered', 'cancelled')),
  notes TEXT,
  estimated_ready_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- ROW LEVEL SECURITY
-- =====================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- MENU ITEMS POLICIES (Public read, admin write)
CREATE POLICY "Menu items are viewable by everyone"
  ON menu_items FOR SELECT USING (true);

CREATE POLICY "Admins can manage menu items"
  ON menu_items FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- LOCATIONS POLICIES (Public read)
CREATE POLICY "Locations are viewable by everyone"
  ON locations FOR SELECT USING (true);

CREATE POLICY "Admins can manage locations"
  ON locations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ORDERS POLICIES
CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (
    customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR customer_phone IN (SELECT phone FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Staff can update orders"
  ON orders FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- =====================
-- REALTIME SUBSCRIPTIONS
-- =====================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- =====================
-- TRIGGER: Auto-create profile on signup
-- =====================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'customer'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================
-- TRIGGER: Update timestamps
-- =====================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================
-- SIMMER DOWN MENU DATA (Spanish)
-- =====================
INSERT INTO menu_items (name, description, price, category, size, tags, available, image_url) VALUES
  -- PIZZAS
  ('The Salvadoreño', 'Chorizo artesanal salvadoreño, queso fresco, jalapeños encurtidos, cilantro fresco', 18.99, 'pizza', '12"', ARRAY['spicy'], true, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80'),
  ('Margherita DOP', 'Tomate San Marzano, mozzarella di bufala, albahaca fresca, aceite de oliva', 16.99, 'pizza', '12"', ARRAY['vegetarian'], true, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80'),
  ('Pepperoni Clásica', 'Pepperoni artesanal, mozzarella, salsa de tomate de la casa', 15.99, 'pizza', '12"', NULL, true, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&q=80'),
  ('Truffle Mushroom', 'Mix de hongos silvestres, aceite de trufa negra, queso fontina, arúgula baby', 22.99, 'pizza', '12"', ARRAY['vegetarian'], true, 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=600&q=80'),
  ('Spicy Diavola', 'Salami picante, chiles calabreses, miel de abeja, base de tomate', 19.99, 'pizza', '12"', ARRAY['spicy'], true, 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=600&q=80'),
  ('BBQ Chicken', 'Pollo a la parrilla, cebolla morada, cilantro, salsa BBQ artesanal', 17.99, 'pizza', '12"', NULL, true, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80'),
  ('Quattro Formaggi', 'Mozzarella, gorgonzola, parmesano, queso de cabra', 20.99, 'pizza', '12"', ARRAY['vegetarian'], true, NULL),
  ('Hawaiana', 'Jamón, piña caramelizada, mozzarella', 16.99, 'pizza', '12"', NULL, true, NULL),
  -- SIDES
  ('Palitos de Ajo', 'Recién horneados con mantequilla de ajo y parmesano rallado', 7.99, 'sides', NULL, ARRAY['vegetarian'], true, 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=600&q=80'),
  ('Ensalada César', 'Lechuga romana, parmesano, crutones, aderezo césar de la casa', 9.99, 'sides', NULL, ARRAY['vegetarian'], true, 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&q=80'),
  ('Alitas de Pollo', 'Alitas crujientes con salsa buffalo o BBQ', 12.99, 'sides', NULL, NULL, true, 'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=600&q=80'),
  ('Mozzarella Sticks', 'Palitos de mozzarella empanizados con salsa marinara', 8.99, 'sides', NULL, ARRAY['vegetarian'], true, NULL),
  -- DRINKS
  ('Limonada Artesanal', 'Limón recién exprimido con hierba buena', 4.99, 'drinks', '16oz', ARRAY['vegan', 'gluten-free'], true, NULL),
  ('Horchata de la Casa', 'Bebida tradicional salvadoreña de arroz con canela', 4.49, 'drinks', '16oz', ARRAY['vegan', 'gluten-free'], true, NULL),
  ('Coca-Cola', 'Coca-Cola bien fría', 2.99, 'drinks', '12oz', ARRAY['vegan'], true, NULL),
  ('Agua Mineral', 'Agua con gas', 2.49, 'drinks', '12oz', ARRAY['vegan', 'gluten-free'], true, NULL),
  ('Cerveza Artesanal', 'Cerveza local de barril', 5.99, 'drinks', '16oz', ARRAY['vegan'], true, NULL),
  -- DESSERTS
  ('Volcán de Chocolate', 'Pastel tibio de chocolate con centro fundido', 8.99, 'desserts', NULL, ARRAY['vegetarian'], true, 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=600&q=80'),
  ('Tiramisú', 'Clásico italiano con espresso y mascarpone', 7.99, 'desserts', NULL, ARRAY['vegetarian'], true, NULL),
  ('Churros con Chocolate', 'Churros recién hechos con chocolate caliente', 6.99, 'desserts', NULL, ARRAY['vegetarian'], true, NULL)
ON CONFLICT DO NOTHING;

-- =====================
-- LOCATIONS DATA
-- =====================
INSERT INTO locations (name, address, phone, hours_weekday, hours_weekend, is_open, delivery_available) VALUES
  ('Santa Ana', '1ra Calle Pte y Callejuela Sur Catedral, Santa Ana', '+503 2445-5999', 'Dom-Jue 11am-9pm', 'Vie-Sáb 11am-10pm', true, true),
  ('Coatepeque', 'Calle Principal al Lago #119, Coatepeque', '+503 6831-6907', 'Dom-Jue 11am-8pm', 'Vie-Sáb 11am-9pm', true, true),
  ('San Benito', 'Boulevard del Hipódromo, San Benito, San Salvador', '+503 2263-7890', 'Lun-Dom 11am-11pm', 'Lun-Dom 11am-11pm', true, true),
  ('Juayúa', 'Calle Principal, Centro Histórico, Juayúa', '+503 7890-1234', 'Vie-Dom 11am-8pm', 'Vie-Dom 11am-8pm', false, false),
  ('Surf City', 'Boulevard Costa del Sol, La Libertad', '+503 7654-3210', 'Lun-Dom 10am-10pm', 'Lun-Dom 10am-10pm', true, true)
ON CONFLICT DO NOTHING;

-- =====================
-- CREATE ADMIN USER (run after first signup)
-- Replace 'your-email@example.com' with actual admin email
-- =====================
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
