-- ═══════════════════════════════════════════════════════════════════════════
-- SIMMER DOWN - COMPLETE INTELLIGENT MENU DEPLOYMENT
-- Run this SINGLE FILE in Supabase SQL Editor to deploy everything
-- Dashboard: https://supabase.com/dashboard/project/qusvynxzslpmjoqfabyq/sql
-- ═══════════════════════════════════════════════════════════════════════════
--
-- WHAT THIS DOES:
-- 1. Creates all new tables (menu_categories, ingredients, locations_v2, etc.)
-- 2. Sets up RLS policies for security
-- 3. Creates indexes for performance
-- 4. Seeds all 4 locations
-- 5. Seeds all categories
-- 6. Seeds 70+ ingredients with allergen tags
-- 7. Seeds the complete menu (60+ items)
-- 8. Sets up location overrides (Lago Coatepeque premium pricing)
-- 9. Creates upsell pairings (pizza + beverage + dessert)
--
-- SAFE TO RE-RUN: Uses IF NOT EXISTS and ON CONFLICT DO UPDATE
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════
-- MENU CATEGORIES TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name_es VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  icon VARCHAR(10),
  display_order INTEGER DEFAULT 0,
  note_es TEXT,
  note_en TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "menu_categories_public_read" ON menu_categories;
CREATE POLICY "menu_categories_public_read" ON menu_categories FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "menu_categories_admin_all" ON menu_categories;
CREATE POLICY "menu_categories_admin_all" ON menu_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);

-- ═══════════════════════════════════════════════════════════════════════════
-- INGREDIENTS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ingredients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  name_es VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  allergens TEXT[] DEFAULT '{}',
  dietary_tags TEXT[] DEFAULT '{}',
  ingredient_type VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ingredients_public_read" ON ingredients;
CREATE POLICY "ingredients_public_read" ON ingredients FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "ingredients_admin_all" ON ingredients;
CREATE POLICY "ingredients_admin_all" ON ingredients FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);

-- ═══════════════════════════════════════════════════════════════════════════
-- LOCATIONS V2 TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS locations_v2 (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name_es VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  brand VARCHAR(50) DEFAULT 'simmer-down',
  tagline_es VARCHAR(255),
  tagline_en VARCHAR(255),
  whatsapp VARCHAR(50) NOT NULL,
  whatsapp_full VARCHAR(50),
  delivery_enabled BOOLEAN DEFAULT true,
  features TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE locations_v2 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "locations_v2_public_read" ON locations_v2;
CREATE POLICY "locations_v2_public_read" ON locations_v2 FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "locations_v2_admin_all" ON locations_v2;
CREATE POLICY "locations_v2_admin_all" ON locations_v2 FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);

-- ═══════════════════════════════════════════════════════════════════════════
-- MENU ITEMS V2 TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS menu_items_v2 (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  name_es VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  description_es TEXT NOT NULL,
  description_en TEXT NOT NULL,
  category_code VARCHAR(50) NOT NULL,
  price_personal DECIMAL(10,2),
  price_regular DECIMAL(10,2) NOT NULL,
  dietary_tags TEXT[] DEFAULT '{}',
  allergen_summary TEXT[] DEFAULT '{}',
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_best_seller BOOLEAN DEFAULT false,
  is_signature BOOLEAN DEFAULT false,
  is_spicy BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE menu_items_v2 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "menu_items_v2_public_read" ON menu_items_v2;
CREATE POLICY "menu_items_v2_public_read" ON menu_items_v2 FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "menu_items_v2_admin_all" ON menu_items_v2;
CREATE POLICY "menu_items_v2_admin_all" ON menu_items_v2 FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ═══════════════════════════════════════════════════════════════════════════
-- MENU ITEM INGREDIENTS (Junction Table)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS menu_item_ingredients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  menu_item_id UUID NOT NULL REFERENCES menu_items_v2(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  is_removable BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  UNIQUE(menu_item_id, ingredient_id)
);

ALTER TABLE menu_item_ingredients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "menu_item_ingredients_public_read" ON menu_item_ingredients;
CREATE POLICY "menu_item_ingredients_public_read" ON menu_item_ingredients FOR SELECT USING (true);

DROP POLICY IF EXISTS "menu_item_ingredients_admin_all" ON menu_item_ingredients;
CREATE POLICY "menu_item_ingredients_admin_all" ON menu_item_ingredients FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ═══════════════════════════════════════════════════════════════════════════
-- LOCATION MENU OVERRIDES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS location_menu_overrides (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  location_id UUID NOT NULL REFERENCES locations_v2(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items_v2(id) ON DELETE CASCADE,
  price_personal_override DECIMAL(10,2),
  price_regular_override DECIMAL(10,2),
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  special_notes_es TEXT,
  special_notes_en TEXT,
  UNIQUE(location_id, menu_item_id)
);

ALTER TABLE location_menu_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "location_menu_overrides_public_read" ON location_menu_overrides;
CREATE POLICY "location_menu_overrides_public_read" ON location_menu_overrides FOR SELECT USING (true);

DROP POLICY IF EXISTS "location_menu_overrides_admin_all" ON location_menu_overrides;
CREATE POLICY "location_menu_overrides_admin_all" ON location_menu_overrides FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ═══════════════════════════════════════════════════════════════════════════
-- UPSELL PAIRINGS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS upsell_pairings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  primary_item_id UUID NOT NULL REFERENCES menu_items_v2(id) ON DELETE CASCADE,
  paired_item_id UUID NOT NULL REFERENCES menu_items_v2(id) ON DELETE CASCADE,
  pairing_type VARCHAR(50) NOT NULL DEFAULT 'complement',
  pairing_strength INTEGER DEFAULT 5 CHECK (pairing_strength BETWEEN 1 AND 10),
  suggestion_es TEXT,
  suggestion_en TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(primary_item_id, paired_item_id)
);

ALTER TABLE upsell_pairings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "upsell_pairings_public_read" ON upsell_pairings;
CREATE POLICY "upsell_pairings_public_read" ON upsell_pairings FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "upsell_pairings_admin_all" ON upsell_pairings;
CREATE POLICY "upsell_pairings_admin_all" ON upsell_pairings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_menu_categories_code ON menu_categories(code);
CREATE INDEX IF NOT EXISTS idx_ingredients_code ON ingredients(code);
CREATE INDEX IF NOT EXISTS idx_ingredients_allergens ON ingredients USING GIN(allergens);
CREATE INDEX IF NOT EXISTS idx_locations_v2_code ON locations_v2(code);
CREATE INDEX IF NOT EXISTS idx_menu_items_v2_code ON menu_items_v2(code);
CREATE INDEX IF NOT EXISTS idx_menu_items_v2_category ON menu_items_v2(category_code);
CREATE INDEX IF NOT EXISTS idx_menu_items_v2_best_seller ON menu_items_v2(is_best_seller) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_menu_item_ingredients_item ON menu_item_ingredients(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_location_overrides_location ON location_menu_overrides(location_id);
CREATE INDEX IF NOT EXISTS idx_upsell_primary ON upsell_pairings(primary_item_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- UPDATED_AT TRIGGER
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS menu_categories_updated_at ON menu_categories;
CREATE TRIGGER menu_categories_updated_at BEFORE UPDATE ON menu_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS ingredients_updated_at ON ingredients;
CREATE TRIGGER ingredients_updated_at BEFORE UPDATE ON ingredients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS locations_v2_updated_at ON locations_v2;
CREATE TRIGGER locations_v2_updated_at BEFORE UPDATE ON locations_v2
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS menu_items_v2_updated_at ON menu_items_v2;
CREATE TRIGGER menu_items_v2_updated_at BEFORE UPDATE ON menu_items_v2
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA: LOCATIONS (4 El Salvador locations)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO locations_v2 (code, name_es, name_en, brand, tagline_es, tagline_en, whatsapp, whatsapp_full, delivery_enabled, features) VALUES
  ('santa-ana', 'Simmer Down Santa Ana', 'Simmer Down Santa Ana', 'simmer-down', 'El Fuego Original', 'The Original Fire', '7890-1234', '+503 7890-1234', true, ARRAY['Classic menu', 'Original location']),
  ('san-benito', 'Simmer Down San Benito', 'Simmer Down San Benito', 'simmer-down', 'Calor Urbano', 'Urban Heat', '7487-7792', '+503 7487-7792', true, ARRAY['Classic menu', 'San Salvador location', 'Delivery available']),
  ('lago-coatepeque', 'Simmer Down Lago de Coatepeque', 'Simmer Down Lake Coatepeque', 'simmer-down', 'Sabores del Lago', 'Lakeside Flavors', '7890-9012', '+503 7890-9012', true, ARRAY['Lake view', 'Premium seafood', 'Ceviches', 'Weekend specials', 'Premium pricing']),
  ('la-majada', 'Simmer Garden La Majada', 'Simmer Garden La Majada', 'simmer-garden', '¡Escapa de la ciudad!', 'Escape the city!', '6990-4674', '+503 6990-4674', true, ARRAY['Garden atmosphere', 'Hamburguesa Casanova', 'Expanded coffee menu'])
ON CONFLICT (code) DO UPDATE SET
  name_es = EXCLUDED.name_es,
  whatsapp = EXCLUDED.whatsapp,
  whatsapp_full = EXCLUDED.whatsapp_full;

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA: CATEGORIES
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO menu_categories (code, name_es, name_en, icon, display_order, note_es, note_en) VALUES
  ('entradas', 'Entradas', 'Starters', '🍽️', 1, NULL, NULL),
  ('ensaladas', 'Ensaladas', 'Salads', '🥗', 2, NULL, NULL),
  ('pastas', 'Nuestras Pastas', 'Our Pastas', '🍝', 3, 'Todas nuestras pastas acompañadas de pan tostado al ajo', 'All our pastas served with garlic toast'),
  ('pizzas', 'Pizzas Clásicas', 'Classic Pizzas', '🍕', 4, 'Personal $5.75 | Grande $14.99', 'Personal $5.75 | Large $14.99'),
  ('pizzas-especiales', 'Pizzas Especiales', 'Specialty Pizzas', '🍕', 5, 'Personal $6.25 | Grande $17.99', 'Personal $6.25 | Large $17.99'),
  ('platos-fuertes', 'Platos Fuertes', 'Main Dishes', '🥩', 6, NULL, NULL),
  ('mariscos', 'Mariscos', 'Seafood', '🦐', 7, NULL, NULL),
  ('bebidas-frias', 'Bebidas Frías', 'Cold Drinks', '🍹', 8, NULL, NULL),
  ('bebidas-calientes', 'Bebidas Calientes', 'Hot Drinks', '☕', 9, NULL, NULL),
  ('cervezas', 'Cervezas', 'Beers', '🍺', 10, NULL, NULL),
  ('postres', 'Postres', 'Desserts', '🍰', 11, NULL, NULL),
  ('menu-infantil', 'Menú Infantil', 'Kids Menu', '👶', 12, NULL, NULL)
ON CONFLICT (code) DO UPDATE SET
  name_es = EXCLUDED.name_es,
  display_order = EXCLUDED.display_order;

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA: INGREDIENTS (70+ with allergen tags)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO ingredients (code, name_es, name_en, allergens, dietary_tags, ingredient_type) VALUES
  -- PROTEINS
  ('beef-coulotte', 'Carne Coulotte', 'Coulotte Beef', '{}', '{}', 'protein'),
  ('beef-tenderloin', 'Lomito de Res', 'Beef Tenderloin', '{}', '{}', 'protein'),
  ('beef-fajitas', 'Fajitas de Res', 'Beef Fajitas', '{}', '{}', 'protein'),
  ('filet-mignon', 'Filet Mignon', 'Filet Mignon', '{}', '{}', 'protein'),
  ('grilled-chicken', 'Pechuga de Pollo a la Plancha', 'Grilled Chicken Breast', '{}', '{}', 'protein'),
  ('chicken-fajitas', 'Fajitas de Pollo', 'Chicken Fajitas', '{}', '{}', 'protein'),
  ('breaded-chicken', 'Pechuga Empanizada', 'Breaded Chicken', '{gluten}', '{}', 'protein'),
  ('shrimp', 'Camarones', 'Shrimp', '{shellfish}', '{}', 'protein'),
  ('jumbo-shrimp', 'Camarones Jumbo', 'Jumbo Shrimp', '{shellfish}', '{}', 'protein'),
  ('clams', 'Almejas', 'Clams', '{shellfish}', '{}', 'protein'),
  ('squid', 'Calamar', 'Squid', '{shellfish}', '{}', 'protein'),
  ('mussels', 'Mejillones', 'Mussels', '{shellfish}', '{}', 'protein'),
  ('fresh-fish', 'Pescado Fresco', 'Fresh Fish', '{fish}', '{}', 'protein'),
  ('whole-fish', 'Pescado Entero', 'Whole Fish', '{fish}', '{}', 'protein'),
  ('bacon', 'Tocino', 'Bacon', '{}', '{}', 'protein'),
  ('crispy-bacon', 'Tocino Crujiente', 'Crispy Bacon', '{}', '{}', 'protein'),
  ('ham', 'Jamón', 'Ham', '{}', '{}', 'protein'),
  ('prosciutto', 'Jamón Prosciutto', 'Prosciutto', '{}', '{}', 'protein'),
  ('pepperoni', 'Pepperoni', 'Pepperoni', '{}', '{}', 'protein'),
  ('salami', 'Salami', 'Salami', '{}', '{}', 'protein'),
  ('salami-pamplona', 'Salami di Pamplona', 'Pamplona Salami', '{}', '{}', 'protein'),
  ('chorizo-argentino', 'Chorizo Argentino', 'Argentine Chorizo', '{}', '{}', 'protein'),
  ('chorizo-iberico', 'Chorizo Ibérico', 'Iberian Chorizo', '{}', '{}', 'protein'),
  ('chistorra', 'Chistorra', 'Chistorra Sausage', '{}', '{}', 'protein'),
  ('loroco', 'Loroco', 'Loroco Flower', '{}', '{vegetarian}', 'protein'),
  -- CHEESES
  ('mozzarella', 'Queso Mozzarella', 'Mozzarella Cheese', '{dairy}', '{vegetarian}', 'cheese'),
  ('cheddar', 'Queso Cheddar', 'Cheddar Cheese', '{dairy}', '{vegetarian}', 'cheese'),
  ('parmesan', 'Queso Parmesano', 'Parmesan Cheese', '{dairy}', '{vegetarian}', 'cheese'),
  ('cream-cheese', 'Queso Crema', 'Cream Cheese', '{dairy}', '{vegetarian}', 'cheese'),
  ('queso-criollo', 'Queso Criollo', 'Criollo Cheese', '{dairy}', '{vegetarian}', 'cheese'),
  ('cheese-blend', 'Mix de Quesos', 'Cheese Blend', '{dairy}', '{vegetarian}', 'cheese'),
  ('melted-cheese', 'Queso Derretido', 'Melted Cheese', '{dairy}', '{vegetarian}', 'cheese'),
  -- VEGETABLES
  ('fresh-mushrooms', 'Champiñones Frescos', 'Fresh Mushrooms', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('onion', 'Cebolla', 'Onion', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('caramelized-onion', 'Cebolla Caramelizada', 'Caramelized Onion', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('red-onion', 'Cebolla Morada', 'Red Onion', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('pickled-onion', 'Cebolla Encurtida', 'Pickled Onion', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('green-onion', 'Cebollín', 'Green Onion', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('green-peppers', 'Pimientos Verdes', 'Green Peppers', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('roasted-peppers', 'Pimientos Asados', 'Roasted Peppers', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('jalapeno', 'Jalapeño', 'Jalapeño', '{}', '{vegetarian,vegan,spicy}', 'vegetable'),
  ('cherry-tomatoes', 'Tomates Cherry', 'Cherry Tomatoes', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('fresh-tomatoes', 'Tomates Frescos', 'Fresh Tomatoes', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('sun-dried-tomatoes', 'Tomates Deshidratados', 'Sun-Dried Tomatoes', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('lettuce', 'Lechuga Fresca', 'Fresh Lettuce', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('cucumber', 'Pepino', 'Cucumber', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('carrot', 'Zanahoria', 'Carrot', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('broccoli', 'Brócoli', 'Broccoli', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('avocado', 'Aguacate', 'Avocado', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('sweet-corn', 'Elote Dulce', 'Sweet Corn', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('black-olives', 'Aceitunas Negras', 'Black Olives', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('green-olives', 'Aceitunas Verdes', 'Green Olives', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('green-apple', 'Manzana Verde', 'Green Apple', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('pineapple', 'Piña', 'Pineapple', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('fresh-basil', 'Albahaca Fresca', 'Fresh Basil', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('fresh-cilantro', 'Cilantro Fresco', 'Fresh Cilantro', '{}', '{vegetarian,vegan}', 'vegetable'),
  -- SAUCES
  ('pomodoro-sauce', 'Salsa Pomodoro', 'Pomodoro Sauce', '{}', '{vegetarian,vegan}', 'sauce'),
  ('alfredo-sauce', 'Salsa Alfredo', 'Alfredo Sauce', '{dairy}', '{vegetarian}', 'sauce'),
  ('bolognese-sauce', 'Salsa Bolognesa', 'Bolognese Sauce', '{}', '{}', 'sauce'),
  ('bbq-sauce', 'Salsa BBQ', 'BBQ Sauce', '{}', '{vegetarian,vegan}', 'sauce'),
  ('chimichurri', 'Chimichurri', 'Chimichurri', '{}', '{vegetarian,vegan}', 'sauce'),
  ('garlic-sauce', 'Salsa de Ajo', 'Garlic Sauce', '{}', '{vegetarian,vegan}', 'sauce'),
  ('pesto', 'Pesto de Albahaca', 'Basil Pesto', '{dairy,nuts}', '{vegetarian}', 'sauce'),
  ('maitre-butter', 'Mantequilla Maître', 'Maître Butter', '{dairy}', '{vegetarian}', 'sauce'),
  -- CARBS
  ('pizza-dough', 'Masa de Pizza', 'Pizza Dough', '{gluten}', '{vegetarian,vegan}', 'base'),
  ('fettuccine', 'Fettuccine', 'Fettuccine', '{gluten,eggs}', '{vegetarian}', 'base'),
  ('penne', 'Penne', 'Penne', '{gluten}', '{vegetarian,vegan}', 'base'),
  ('garlic-bread', 'Pan Tostado al Ajo', 'Garlic Toast', '{gluten,dairy}', '{vegetarian}', 'base'),
  ('french-fries', 'Papas Francesas', 'French Fries', '{}', '{vegetarian,vegan,gluten_free}', 'base'),
  ('mashed-potatoes', 'Puré de Papa', 'Mashed Potatoes', '{dairy}', '{vegetarian}', 'base'),
  ('plantain-chips', 'Chips de Plátano', 'Plantain Chips', '{}', '{vegetarian,vegan,gluten_free}', 'base'),
  -- TOPPINGS
  ('almonds', 'Almendras', 'Almonds', '{nuts}', '{vegetarian,vegan}', 'topping'),
  ('sesame', 'Ajonjolí', 'Sesame', '{sesame}', '{vegetarian,vegan}', 'topping')
ON CONFLICT (code) DO UPDATE SET
  name_es = EXCLUDED.name_es,
  allergens = EXCLUDED.allergens,
  dietary_tags = EXCLUDED.dietary_tags;

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA: MENU ITEMS - ENTRADAS
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO menu_items_v2 (code, name_es, name_en, description_es, description_en, category_code, price_regular, is_best_seller, is_signature, is_spicy) VALUES
  ('molcajete-coulotte', 'Molcajete Coulotte', 'Molcajete Coulotte',
   'Carne coulotte, salsa aguacate, mix de cebolla, jalapeño, cebollín ajo tuteado, servido con tortilla en molcajete tradicional',
   'Beef coulotte, avocado salsa, onion mix, jalapeño, sautéed green onion and garlic, served with tortilla in traditional molcajete',
   'entradas', 13.99, true, true, true),
  ('fundido-camaron-pollo', 'Fundido Camarón y Pollo', 'Shrimp & Chicken Fundido',
   'Camarones y pechuga a la plancha con salsa pomodoro, mozzarella derretido, servido con pan al ajo',
   'Grilled shrimp and chicken breast with pomodoro sauce, melted mozzarella, served with garlic bread',
   'entradas', 7.99, false, false, false),
  ('fundido-champinones', 'Fundido de Champiñones', 'Mushroom Fundido',
   'Champiñones frescos con mezcla de quesos, salsa pomodoro, servido con pan al ajo',
   'Fresh mushrooms with cheese blend, pomodoro sauce, served with garlic bread',
   'entradas', 7.99, false, false, false),
  ('fundido-filet-mignon', 'Fundido Filet Mignon', 'Filet Mignon Fundido',
   'Cortes premium de filet mignon con mezcla de quesos derretidos y pan al ajo',
   'Premium filet mignon cuts with melted cheese blend and garlic bread',
   'entradas', 7.99, false, false, false),
  ('cheese-balls', 'Cheese Balls', 'Cheese Balls',
   'Bolitas crujientes de mezcla de quesos servidas con salsa pomodoro',
   'Crispy mixed cheese balls served with pomodoro dipping sauce',
   'entradas', 6.99, false, false, false),
  ('patatas-tocino', 'Patatas con Tocino', 'Bacon Potatoes',
   'Rondeles de papa, tocino crujiente, salsa pomodoro, queso mozzarella',
   'Potato rounds, crispy bacon, pomodoro sauce, mozzarella cheese',
   'entradas', 5.99, false, false, false),
  ('camarones-empanizados', 'Camarones Empanizados', 'Breaded Shrimp',
   'Camarones empanizados con papas fritas, salsa a elegir (búfalo / cilantro parmesano / teriyaki picante)',
   'Breaded shrimp with french fries, choice of sauce (buffalo / cilantro parmesan / spicy teriyaki)',
   'entradas', 9.99, false, false, false),
  ('leche-de-tigre', 'Leche de Tigre', 'Tiger''s Milk Ceviche',
   'Pescado blanco fresco y camarones marinados en cítricos con cebolla morada, cilantro, limón, servido con chips de plátano',
   'Fresh white fish and shrimp marinated in citrus with red onion, cilantro, lemon, served with plantain chips',
   'entradas', 13.99, true, true, true),
  ('ceviche-tropical', 'Ceviche Tropical', 'Tropical Ceviche',
   'Ceviche de pescado fresco con piña tropical, cebolla morada, cilantro, servido con chips de plátano crujientes',
   'Fresh fish ceviche with tropical pineapple, red onion, cilantro, served with crispy plantain chips',
   'entradas', 13.99, true, false, false),
  ('aguachile-camaron', 'Aguachile de Camarón', 'Shrimp Aguachile',
   'Camarones frescos en aguachile verde picante con pepino, cebolla morada, jalapeño, cilantro, ajo, chips de plátano',
   'Fresh shrimp in spicy green aguachile with cucumber, red onion, jalapeño, cilantro, garlic, plantain chips',
   'entradas', 11.99, false, false, true)
ON CONFLICT (code) DO UPDATE SET
  description_es = EXCLUDED.description_es,
  price_regular = EXCLUDED.price_regular;

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA: MENU ITEMS - ENSALADAS
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO menu_items_v2 (code, name_es, name_en, description_es, description_en, category_code, price_regular, is_best_seller) VALUES
  ('ensalada-gambas', 'Ensalada Gambas', 'Shrimp Salad',
   'Camarones a la plancha, lechugas, tomates cherry, zanahoria, pepino, aguacate, elote dulce; con crotones y aderezo rosa',
   'Grilled shrimp over fresh lettuce with cherry tomatoes, carrot, cucumber, avocado, sweet corn, croutons, pink dressing',
   'ensaladas', 9.99, false),
  ('ensalada-criolla', 'Ensalada Criolla', 'Creole Salad',
   'Lechuga fresca, lomito de res, aguacate, champiñones, tomates cherry, elote dulce, cebolla morada; aderezo yogurlantro; chips de maíz',
   'Fresh lettuce with beef tenderloin strips, avocado, mushrooms, cherry tomatoes, sweet corn, red onion, yogurt-cilantro dressing, corn chips',
   'ensaladas', 8.99, false),
  ('ensalada-impecable', 'Ensalada Impecable', 'Impeccable Salad',
   'Lechuga fresca, trozos de pechuga de pollo a la plancha, manzana verde, zanahoria fresca, elote dulce, aguacate, tocino, almendras y tomates cherry; aderezo yogurlantro; chips de maíz',
   'Fresh lettuce, grilled chicken breast pieces, green apple, fresh carrot, sweet corn, avocado, bacon, almonds and cherry tomatoes; yogurt-cilantro dressing; corn chips',
   'ensaladas', 9.99, true)
ON CONFLICT (code) DO UPDATE SET
  description_es = EXCLUDED.description_es,
  price_regular = EXCLUDED.price_regular;

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA: MENU ITEMS - PASTAS
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO menu_items_v2 (code, name_es, name_en, description_es, description_en, category_code, price_regular, is_best_seller) VALUES
  ('fettuccine-calamaridina', 'Fettuccine Calamaridina', 'Calamaridina Fettuccine',
   'Salsa calamaridina; camarón jumbo, almejas, calamar y mejillones. Servido con pan tostado al ajo',
   'Calamaridina sauce; jumbo shrimp, clams, squid and mussels. Served with garlic toast',
   'pastas', 13.00, true),
  ('fettuccine-mar-y-tierra', 'Fettuccine Mar y Tierra', 'Surf & Turf Fettuccine',
   'Salsa Alfredo; fusión de mariscos y pollo. Servido con pan tostado al ajo',
   'Alfredo sauce; seafood and chicken fusion. Served with garlic toast',
   'pastas', 9.99, true),
  ('lasagna-bolognesa', 'Lasagna Bolognesa', 'Bolognese Lasagna',
   'Salsa bolognesa + mix de quesos mozzarella y queso crema. Servido con pan tostado al ajo',
   'Bolognese sauce + mozzarella and cream cheese mix. Served with garlic toast',
   'pastas', 9.99, false),
  ('penne-brocoli-tocino', 'Penne Brócoli Tocino', 'Broccoli Bacon Penne',
   'Tocino crocante, brócoli, trozos de pechuga; bañada en Alfredo; mozzarella gratinado. Servido con pan tostado al ajo',
   'Crispy bacon, broccoli, chicken breast pieces; Alfredo sauce; gratinated mozzarella. Served with garlic toast',
   'pastas', 7.99, false)
ON CONFLICT (code) DO UPDATE SET
  description_es = EXCLUDED.description_es,
  price_regular = EXCLUDED.price_regular;

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA: MENU ITEMS - PIZZAS BASE ($5.75 / $14.99)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO menu_items_v2 (code, name_es, name_en, description_es, description_en, category_code, price_personal, price_regular, is_best_seller, is_signature) VALUES
  ('pizza-fungi', 'Pizza Fungie', 'Mushroom Pizza',
   'Cebolla + hongos al chimichurri', 'Onion + mushrooms with chimichurri',
   'pizzas', 5.75, 14.99, false, false),
  ('pizza-pepperoni', 'Pizza Pepperoni', 'Pepperoni Pizza',
   'Pepperoni clásico sobre mozzarella derretido', 'Classic pepperoni over melted mozzarella',
   'pizzas', 5.75, 14.99, false, false),
  ('pizza-maradona', 'Pizza Maradona', 'Maradona Pizza',
   'Chorizo argentino + pimientos verdes + cebolla + chimichurri', 'Argentine chorizo + green peppers + onion + chimichurri',
   'pizzas', 5.75, 14.99, true, true),
  ('pizza-brazuca', 'Pizza Brazuca', 'Brazuca Pizza',
   'Piña + salami; cubierta en salsa de ajo y jalapeños', 'Pineapple + salami; covered in garlic sauce and jalapeños',
   'pizzas', 5.75, 14.99, false, false),
  ('pizza-vegetariana', 'Pizza Vegetariana', 'Vegetarian Pizza',
   'Pimientos verdes, cebolla, tomates frescos, champiñones, lascas de zanahoria, brócoli marinados',
   'Green peppers, onion, fresh tomatoes, mushrooms, carrot strips, marinated broccoli',
   'pizzas', 5.75, 14.99, false, false),
  ('pizza-piccolo', 'Pizza Piccolo', 'Piccolo Pizza',
   'Pechuga marinada al grill + salsa de ajo + toque de cilantro',
   'Grilled marinated chicken breast + garlic sauce + cilantro touch',
   'pizzas', 5.75, 14.99, false, false),
  ('pizza-margherita', 'Pizza Margherita', 'Margherita Pizza',
   'Tomates cherry marinados + albahaca fresca', 'Marinated cherry tomatoes + fresh basil',
   'pizzas', 5.75, 14.99, false, false),
  ('pizza-hawaiana', 'Pizza La Hawaiana', 'Hawaiian Pizza',
   'Jamón + piña + pimientos asados; cubierta de mozzarella y cheddar',
   'Ham + pineapple + roasted peppers; mozzarella and cheddar topping',
   'pizzas', 5.75, 14.99, false, false),
  ('pizza-verde-mella', 'Pizza Verde Mella', 'Green Apple Pizza',
   'Fajitas de pollo al grill, manzana verde, rebanadas de almendra',
   'Grilled chicken fajitas, green apple, almond slices',
   'pizzas', 5.75, 14.99, false, false),
  ('pizza-loroka', 'Pizza La Loroka', 'La Loroka Pizza',
   'Simple y deliciosa: loroco, tocino y pepperoni', 'Simple and delicious: loroco, bacon and pepperoni',
   'pizzas', 5.75, 14.99, true, true),
  ('pizza-cuatro-quesos', 'Pizza Cuatro Quesos', 'Four Cheese Pizza',
   'Queso criollo especial, parmesano, mozzarella, queso crema + albahaca fresca',
   'Special criollo cheese, parmesan, mozzarella, cream cheese + fresh basil',
   'pizzas', 5.75, 14.99, false, false)
ON CONFLICT (code) DO UPDATE SET
  description_es = EXCLUDED.description_es,
  price_personal = EXCLUDED.price_personal,
  price_regular = EXCLUDED.price_regular;

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA: MENU ITEMS - PIZZAS ESPECIALES ($6.25 / $17.99)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO menu_items_v2 (code, name_es, name_en, description_es, description_en, category_code, price_personal, price_regular, is_best_seller, is_signature) VALUES
  ('pizza-castellana', 'Pizza La Castellana', 'La Castellana Pizza',
   'Salami di pamplona, chistorra y chorizo ibérico', 'Pamplona salami, chistorra and Iberian chorizo',
   'pizzas-especiales', 6.25, 17.99, false, false),
  ('pizza-prosciutto', 'Pizza Prosciutto', 'Prosciutto Pizza',
   'Tomates deshidratados, jamón prosciutto, pesto de albahaca', 'Sun-dried tomatoes, prosciutto ham, basil pesto',
   'pizzas-especiales', 6.25, 17.99, false, false),
  ('pizza-ghiottone', 'Pizza Ghiottone', 'Ghiottone Pizza',
   'Tomates deshidratados, salami, jamón, pepperoni, chorizo, aceitunas negras y hongos',
   'Sun-dried tomatoes, salami, ham, pepperoni, chorizo, black olives and mushrooms',
   'pizzas-especiales', 6.25, 17.99, true, true),
  ('pizza-memorable', 'Pizza La Memorable', 'La Memorable Pizza',
   'Fajitas de res y pollo, elotito amarillo, cubierta en salsa BBQ, toque de ajonjolí',
   'Beef and chicken fajitas, sweet corn, BBQ sauce, sesame touch',
   'pizzas-especiales', 6.25, 17.99, true, true),
  ('pizza-don-cangrejo', 'Pizza Don Cangrejo', 'Don Cangrejo Pizza',
   'Camarones frescos y almejas marinadas, cebolla, pimientos verdes, toque de aguacate fresco',
   'Fresh shrimp and marinated clams, onion, green peppers, fresh avocado touch',
   'pizzas-especiales', 6.25, 17.99, false, false),
  ('pizza-pescatore', 'Pizza La Pescatore', 'La Pescatore Pizza',
   'Calamar, almejas, camarones, cebolla morada y pimientos marinados',
   'Squid, clams, shrimp, red onion and marinated peppers',
   'pizzas-especiales', 6.25, 17.99, false, false),
  ('pizza-punta-jalapena', 'Pizza Punta Jalapeña', 'Punta Jalapeña Pizza',
   'Lomito de res, mozzarella, cilantro fresco, salsa punta jalapeña',
   'Beef tenderloin, mozzarella, fresh cilantro, punta jalapeña sauce',
   'pizzas-especiales', 6.25, 17.99, false, true),
  ('pizza-campesina', 'Pizza La Campesina', 'La Campesina Pizza',
   'Fajitas de res, chorizo ibérico, cubierta con mozzarella, decorada con frijoles fritos, salsa de aguacate y cilantro fresco; acompañada de cebolla encurtida',
   'Beef fajitas, Iberian chorizo, mozzarella topping, decorated with refried beans, avocado salsa and fresh cilantro; served with pickled onion',
   'pizzas-especiales', 6.25, 17.99, false, true),
  ('pizza-gamberetti', 'Pizza Gamberetti', 'Gamberetti Pizza',
   'Camarones frescos, piña, salsa Alfredo y pesto de albahaca',
   'Fresh shrimp, pineapple, Alfredo sauce and basil pesto',
   'pizzas-especiales', 6.25, 17.99, false, false)
ON CONFLICT (code) DO UPDATE SET
  description_es = EXCLUDED.description_es,
  price_personal = EXCLUDED.price_personal,
  price_regular = EXCLUDED.price_regular;

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA: MENU ITEMS - PLATOS FUERTES
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO menu_items_v2 (code, name_es, name_en, description_es, description_en, category_code, price_regular, is_best_seller, is_signature) VALUES
  ('terramar-al-maitre', 'Terramar al Maître', 'Terramar al Maître',
   'Lomito de res + camarones jumbo; acompañados de rondeles de papa, vegetales; coronado con mantequilla maître',
   'Beef tenderloin + jumbo shrimp; served with potato rounds, vegetables; topped with maître butter',
   'platos-fuertes', 19.99, true, true),
  ('medallon-lomito-maitre', 'Medallón de Lomito al Maître', 'Medallion al Maître',
   'Corte estilo New York albardado con tocino; salteados de hongos y cherrys; mantequilla maître - BEST SELLER #1',
   'New York-style cut wrapped in bacon; sautéed mushrooms and cherry tomatoes; maître butter - BEST SELLER #1',
   'platos-fuertes', 17.75, true, true),
  ('pechuga-capresse', 'Pechuga Capresse', 'Capresse Chicken',
   'Rellena de mozzarella, tomates deshidratados y pesto; en cama de puré de papa con vegetales',
   'Stuffed with mozzarella, sun-dried tomatoes and pesto; on mashed potato bed with vegetables',
   'platos-fuertes', 14.99, false, false),
  ('hamburguesa-casanova', 'Hamburguesa Casanova', 'Casanova Burger',
   'Doble carne 100% res, fusión de tocino, hongos y cebolla morada; queso mozzarella derretido; papas francesas',
   'Double 100% beef patty, bacon, mushroom and red onion fusion; melted mozzarella; french fries',
   'platos-fuertes', 11.99, true, false),
  ('pescado-parrilla', 'Pescado a la Parrilla', 'Grilled Fish',
   'Pescado entero a la parrilla con chimichurri; tortillas fritas + cebolla encurtida',
   'Whole grilled fish with chimichurri; fried tortillas + pickled onion',
   'platos-fuertes', 22.50, true, true),
  ('mariscada', 'Mariscada', 'Seafood Stew',
   'Sopa mariscada: camarones, almejas, calamares, mejillones y pescado (especial de fin de semana)',
   'Seafood soup: shrimp, clams, squid, mussels and fish (weekend special)',
   'mariscos', 17.99, true, true)
ON CONFLICT (code) DO UPDATE SET
  description_es = EXCLUDED.description_es,
  price_regular = EXCLUDED.price_regular;

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA: BEVERAGES + DESSERTS + KIDS MENU
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO menu_items_v2 (code, name_es, name_en, description_es, description_en, category_code, price_regular, is_best_seller) VALUES
  -- BEBIDAS FRÍAS
  ('frozen', 'Frozen', 'Frozen Drink', 'Sabores: coco, piña, coco piña, fresa, hierba buena, maracuyá, sandía', 'Flavors: coconut, pineapple, strawberry, mint, passion fruit, watermelon', 'bebidas-frias', 3.75, false),
  ('limonadas', 'Limonadas', 'Lemonades', 'Maracuyá, fresa, hierba buena, tradicional', 'Passion fruit, strawberry, mint, traditional', 'bebidas-frias', 3.25, false),
  ('naranja-natural', 'Naranja Natural', 'Fresh Orange Juice', '100% natural', '100% natural', 'bebidas-frias', 3.50, false),
  ('horchata', 'Horchata', 'Horchata', 'Bebida tradicional de arroz con canela', 'Traditional rice drink with cinnamon', 'bebidas-frias', 2.95, false),
  ('agua', 'Agua', 'Water', 'Agua 600ml', 'Water 600ml', 'bebidas-frias', 1.99, false),
  ('sodas', 'Sodas', 'Soft Drinks', 'Refrescos variados', 'Assorted soft drinks', 'bebidas-frias', 1.99, false),
  -- BEBIDAS CALIENTES
  ('cappuccino', 'Cappuccino', 'Cappuccino', 'Cappuccino clásico italiano', 'Classic Italian cappuccino', 'bebidas-calientes', 2.99, false),
  ('latte', 'Latte', 'Latte', 'Café latte cremoso', 'Creamy café latte', 'bebidas-calientes', 2.99, false),
  ('moccachino', 'Moccachino', 'Moccachino', 'Espresso con chocolate y leche', 'Espresso with chocolate and milk', 'bebidas-calientes', 2.99, false),
  ('cafe-americano', 'Café Americano', 'American Coffee', 'Espresso con agua caliente', 'Espresso with hot water', 'bebidas-calientes', 1.50, false),
  ('affogato', 'Affogato', 'Affogato', 'Helado de vainilla bañado en espresso caliente', 'Vanilla ice cream drowned in hot espresso', 'bebidas-calientes', 3.50, false),
  -- CERVEZAS LOCALES
  ('puente-quemado', 'Puente Quemado', 'Puente Quemado', 'Cerveza santaneca artesanal premium', 'Premium local Santa Ana craft beer', 'cervezas', 5.00, true),
  ('pilsener', 'Pilsener', 'Pilsener', 'Pilsener Salvadoreña', 'Salvadoran Pilsener', 'cervezas', 2.25, false),
  ('golden', 'Golden', 'Golden', 'Cerveza Golden', 'Golden Beer', 'cervezas', 2.25, false),
  -- CERVEZAS IMPORTADAS
  ('corona', 'Corona', 'Corona', 'Cerveza mexicana Corona Extra', 'Mexican Corona Extra beer', 'cervezas', 3.50, false),
  ('heineken', 'Heineken', 'Heineken', 'Cerveza holandesa Heineken', 'Dutch Heineken beer', 'cervezas', 3.50, false),
  ('stella-artois', 'Stella Artois', 'Stella Artois', 'Pilsner belga premium', 'Premium Belgian pilsner', 'cervezas', 3.50, false),
  -- POSTRES
  ('ganache-chocolate', 'Ganache de Chocolate', 'Chocolate Ganache', 'Postre de ganache de chocolate premium', 'Premium chocolate ganache dessert', 'postres', 3.99, false),
  ('brownie-helado', 'Brownie con Helado', 'Brownie with Ice Cream', 'Brownie de chocolate tibio con helado de vainilla', 'Warm chocolate brownie with vanilla ice cream', 'postres', 3.99, true),
  ('cheesecake-fresa', 'Cheesecake de Fresa', 'Strawberry Cheesecake', 'Cheesecake estilo New York con fresas frescas', 'New York style cheesecake with fresh strawberries', 'postres', 3.99, false),
  ('panna-cotta', 'Panna Cotta', 'Panna Cotta', 'Postre italiano de crema con opción: frutos rojos, maracuyá o fresa - TOP #1 POSTRE', 'Italian cream dessert with choice: red fruits, passion fruit or strawberry - TOP #1 DESSERT', 'postres', 3.99, true),
  -- MENÚ INFANTIL
  ('chunks-pollo', 'Chunks de Pollo', 'Chicken Chunks', 'Trozos de pechuga empanizados + papas francesas + té', 'Breaded chicken breast pieces + french fries + tea', 'menu-infantil', 5.99, false),
  ('cangreburger', 'Cangreburger', 'Crab Burger', 'Hamburguesa de pollo + papas francesas + té', 'Chicken burger + french fries + tea', 'menu-infantil', 5.50, false)
ON CONFLICT (code) DO UPDATE SET
  description_es = EXCLUDED.description_es,
  price_regular = EXCLUDED.price_regular;

-- ═══════════════════════════════════════════════════════════════════════════
-- LOCATION OVERRIDES (Lago Coatepeque Premium Pricing)
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  lago_id UUID;
BEGIN
  SELECT id INTO lago_id FROM locations_v2 WHERE code = 'lago-coatepeque';

  -- Lago Coatepeque premium pricing
  INSERT INTO location_menu_overrides (location_id, menu_item_id, price_regular_override, is_featured, special_notes_es)
  SELECT
    lago_id,
    mi.id,
    CASE mi.code
      WHEN 'terramar-al-maitre' THEN 22.50
      WHEN 'medallon-lomito-maitre' THEN 19.99
      WHEN 'hamburguesa-casanova' THEN 12.50
      ELSE NULL
    END,
    mi.code IN ('leche-de-tigre', 'ceviche-tropical', 'aguachile-camaron', 'pescado-parrilla', 'mariscada'),
    CASE
      WHEN mi.code IN ('leche-de-tigre', 'ceviche-tropical', 'aguachile-camaron', 'pescado-parrilla')
      THEN 'Especialidad del Lago'
      WHEN mi.code = 'mariscada' THEN 'Disponible sábado y domingo'
      ELSE NULL
    END
  FROM menu_items_v2 mi
  WHERE mi.code IN (
    'terramar-al-maitre', 'medallon-lomito-maitre', 'hamburguesa-casanova',
    'leche-de-tigre', 'ceviche-tropical', 'aguachile-camaron', 'pescado-parrilla', 'mariscada'
  )
  ON CONFLICT (location_id, menu_item_id) DO UPDATE SET
    price_regular_override = EXCLUDED.price_regular_override,
    is_featured = EXCLUDED.is_featured;

  -- Make lake-only items unavailable at other locations
  INSERT INTO location_menu_overrides (location_id, menu_item_id, is_available)
  SELECT
    loc.id,
    mi.id,
    false
  FROM locations_v2 loc
  CROSS JOIN menu_items_v2 mi
  WHERE loc.code != 'lago-coatepeque'
    AND mi.code IN ('leche-de-tigre', 'ceviche-tropical', 'aguachile-camaron', 'pescado-parrilla', 'mariscada')
  ON CONFLICT (location_id, menu_item_id) DO UPDATE SET
    is_available = false;

  -- Hamburguesa Casanova only at Garden and Lake
  INSERT INTO location_menu_overrides (location_id, menu_item_id, is_available)
  SELECT
    loc.id,
    mi.id,
    false
  FROM locations_v2 loc
  CROSS JOIN menu_items_v2 mi
  WHERE loc.code NOT IN ('lago-coatepeque', 'la-majada')
    AND mi.code = 'hamburguesa-casanova'
  ON CONFLICT (location_id, menu_item_id) DO UPDATE SET
    is_available = false;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- UPSELL PAIRINGS
-- ═══════════════════════════════════════════════════════════════════════════

-- Pizza + Beverage pairings
INSERT INTO upsell_pairings (primary_item_id, paired_item_id, pairing_type, pairing_strength, suggestion_es, suggestion_en)
SELECT
  pizza.id,
  beverage.id,
  'beverage',
  CASE
    WHEN beverage.code = 'puente-quemado' THEN 9
    WHEN beverage.code = 'frozen' THEN 8
    WHEN beverage.code = 'limonadas' THEN 7
    ELSE 5
  END,
  CASE
    WHEN beverage.code = 'puente-quemado' THEN '¡Perfecto con una cerveza artesanal Puente Quemado!'
    WHEN beverage.code = 'frozen' THEN '¡Refréscate con un delicioso Frozen!'
    WHEN beverage.code = 'limonadas' THEN '¡Acompaña con una limonada natural!'
    ELSE '¿Te gustaría una bebida?'
  END,
  CASE
    WHEN beverage.code = 'puente-quemado' THEN 'Perfect with a Puente Quemado craft beer!'
    WHEN beverage.code = 'frozen' THEN 'Refresh yourself with a delicious Frozen!'
    WHEN beverage.code = 'limonadas' THEN 'Pair it with a natural lemonade!'
    ELSE 'Would you like a drink?'
  END
FROM menu_items_v2 pizza
CROSS JOIN menu_items_v2 beverage
WHERE pizza.category_code IN ('pizzas', 'pizzas-especiales')
  AND beverage.code IN ('puente-quemado', 'frozen', 'limonadas')
ON CONFLICT (primary_item_id, paired_item_id) DO NOTHING;

-- Main dish + Dessert pairings
INSERT INTO upsell_pairings (primary_item_id, paired_item_id, pairing_type, pairing_strength, suggestion_es, suggestion_en)
SELECT
  main.id,
  dessert.id,
  'dessert',
  CASE
    WHEN dessert.code = 'panna-cotta' THEN 10
    WHEN dessert.code = 'brownie-helado' THEN 9
    ELSE 7
  END,
  CASE
    WHEN dessert.code = 'panna-cotta' THEN '¡No te pierdas nuestra Panna Cotta #1!'
    WHEN dessert.code = 'brownie-helado' THEN '¡El Brownie con Helado es el final perfecto!'
    ELSE '¿Un postre para terminar?'
  END,
  CASE
    WHEN dessert.code = 'panna-cotta' THEN 'Don''t miss our #1 Panna Cotta!'
    WHEN dessert.code = 'brownie-helado' THEN 'The Brownie with Ice Cream is the perfect ending!'
    ELSE 'A dessert to finish?'
  END
FROM menu_items_v2 main
CROSS JOIN menu_items_v2 dessert
WHERE main.category_code IN ('platos-fuertes', 'pastas')
  AND dessert.code IN ('panna-cotta', 'brownie-helado')
ON CONFLICT (primary_item_id, paired_item_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- DEPLOYMENT COMPLETE
-- ═══════════════════════════════════════════════════════════════════════════

SELECT
  'DEPLOYMENT COMPLETE!' as status,
  (SELECT COUNT(*) FROM locations_v2) as locations,
  (SELECT COUNT(*) FROM menu_categories) as categories,
  (SELECT COUNT(*) FROM ingredients) as ingredients,
  (SELECT COUNT(*) FROM menu_items_v2) as menu_items,
  (SELECT COUNT(*) FROM location_menu_overrides) as location_overrides,
  (SELECT COUNT(*) FROM upsell_pairings) as upsell_pairings;
