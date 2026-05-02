-- ═══════════════════════════════════════════════════════════════════════════
-- SIMMER DOWN - DEPLOY NEW INTELLIGENT MENU TABLES
-- Safe migration - only creates tables that don't exist
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/qusvynxzslpmjoqfabyq/sql
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

-- Enable RLS
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

-- Enable RLS
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "ingredients_public_read" ON ingredients;
CREATE POLICY "ingredients_public_read" ON ingredients FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "ingredients_admin_all" ON ingredients;
CREATE POLICY "ingredients_admin_all" ON ingredients FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);

-- ═══════════════════════════════════════════════════════════════════════════
-- LOCATIONS V2 TABLE (Enhanced)
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

-- Enable RLS
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

-- Enable RLS
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

-- Enable RLS
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

-- Enable RLS
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

-- Enable RLS
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
CREATE INDEX IF NOT EXISTS idx_upsell_paired ON upsell_pairings(paired_item_id);

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
-- DONE - Tables created
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 'Schema deployed successfully!' as status;
