-- ═══════════════════════════════════════════════════════════════════════════
-- SIMMER DOWN - MASTER MENU SCHEMA v3.0
-- Intelligent Menu System with Ingredients, Allergens, and Location Overrides
-- ═══════════════════════════════════════════════════════════════════════════
-- Run in Supabase SQL Editor: https://supabase.com/dashboard

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════
-- ALLERGEN TYPES
-- ═══════════════════════════════════════════════════════════════════════════

-- Allergen tags as enum for type safety
DO $$ BEGIN
  CREATE TYPE allergen_tag AS ENUM (
    'gluten',
    'dairy',
    'shellfish',
    'fish',
    'eggs',
    'nuts',
    'peanuts',
    'soy',
    'sesame',
    'celery',
    'mustard',
    'sulfites'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Dietary tags
DO $$ BEGIN
  CREATE TYPE dietary_tag AS ENUM (
    'vegetarian',
    'vegan',
    'gluten_free',
    'spicy',
    'contains_alcohol',
    'raw',
    'halal',
    'kosher'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- LOCATIONS TABLE (Enhanced)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS locations_v2 (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL, -- 'santa-ana', 'san-benito', etc.
  name_es VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  brand VARCHAR(50) DEFAULT 'simmer-down' CHECK (brand IN ('simmer-down', 'simmer-garden')),
  tagline_es VARCHAR(255),
  tagline_en VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(50) DEFAULT 'El Salvador',
  phone VARCHAR(50),
  whatsapp VARCHAR(50) NOT NULL,
  whatsapp_full VARCHAR(50), -- Full international format: +503 7487 7792
  email VARCHAR(255),
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  timezone VARCHAR(50) DEFAULT 'America/El_Salvador',

  -- Operating status
  is_active BOOLEAN DEFAULT true,
  delivery_enabled BOOLEAN DEFAULT true,
  pickup_enabled BOOLEAN DEFAULT true,
  dine_in_enabled BOOLEAN DEFAULT true,

  -- Business hours stored as JSONB for flexibility
  -- Format: {"monday": {"open": "11:00", "close": "21:00"}, ...}
  hours JSONB DEFAULT '{}',

  -- Special features
  features TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- MENU CATEGORIES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL, -- 'entradas', 'pizzas', etc.
  name_es VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  description_es TEXT,
  description_en TEXT,
  icon VARCHAR(10), -- Emoji icon
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  -- For pastas: "Todas nuestras pastas acompañadas de pan tostado al ajo"
  note_es TEXT,
  note_en TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- INGREDIENTS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ingredients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL, -- 'beef-coulotte', 'mozzarella', etc.
  name_es VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,

  -- Allergen and dietary information
  allergens allergen_tag[] DEFAULT '{}',
  dietary_tags dietary_tag[] DEFAULT '{}',

  -- Categorization for smart recommendations
  ingredient_type VARCHAR(50), -- 'protein', 'cheese', 'vegetable', 'sauce', 'topping'
  flavor_profile VARCHAR(50)[], -- 'savory', 'spicy', 'sweet', 'umami', 'fresh'

  -- For chatbot intelligence
  is_common BOOLEAN DEFAULT true, -- Common ingredients don't need explanation
  description_es TEXT, -- For explaining unique ingredients
  description_en TEXT,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- MENU ITEMS TABLE (Master)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS menu_items_v2 (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL, -- 'pizza-maradona', 'molcajete-coulotte'

  -- Bilingual content
  name_es VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  description_es TEXT NOT NULL,
  description_en TEXT NOT NULL,

  -- Category reference
  category_id UUID REFERENCES menu_categories(id),
  category_code VARCHAR(50) NOT NULL, -- Denormalized for performance

  -- Pricing (base prices - can be overridden per location)
  price_personal DECIMAL(10,2), -- For pizzas: personal size
  price_regular DECIMAL(10,2) NOT NULL, -- Main price (or "grande" for pizzas)

  -- Calculated fields for chatbot
  dietary_tags dietary_tag[] DEFAULT '{}', -- Computed from ingredients
  allergen_summary allergen_tag[] DEFAULT '{}', -- Computed from ingredients

  -- Display
  image_url TEXT,
  display_order INTEGER DEFAULT 0,

  -- Flags
  is_best_seller BOOLEAN DEFAULT false,
  is_signature BOOLEAN DEFAULT false, -- House specialty
  is_new BOOLEAN DEFAULT false,
  is_seasonal BOOLEAN DEFAULT false,
  is_spicy BOOLEAN DEFAULT false,
  spice_level INTEGER DEFAULT 0 CHECK (spice_level >= 0 AND spice_level <= 3),

  -- Availability
  is_active BOOLEAN DEFAULT true,
  available_all_day BOOLEAN DEFAULT true,
  available_start_time TIME,
  available_end_time TIME,
  available_days INTEGER[] DEFAULT '{0,1,2,3,4,5,6}', -- 0=Sunday, 6=Saturday

  -- For upsell intelligence
  pairs_well_with UUID[], -- References to other menu_items_v2
  upsell_category VARCHAR(50), -- 'beverage', 'dessert', 'side'

  -- Metadata
  prep_time_minutes INTEGER,
  calories INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- MENU ITEM INGREDIENTS (Junction Table)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS menu_item_ingredients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  menu_item_id UUID NOT NULL REFERENCES menu_items_v2(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,

  -- Ingredient role
  is_primary BOOLEAN DEFAULT false, -- Main ingredients shown first
  is_base BOOLEAN DEFAULT false, -- Base ingredients (e.g., dough, sauce)
  is_topping BOOLEAN DEFAULT false,
  is_garnish BOOLEAN DEFAULT false,

  -- Customization
  is_removable BOOLEAN DEFAULT true, -- Can customer remove this?
  is_substitutable BOOLEAN DEFAULT false,
  extra_charge DECIMAL(10,2), -- Charge for adding extra

  -- Display
  display_order INTEGER DEFAULT 0,
  quantity_description VARCHAR(50), -- 'generous', 'light', 'on the side'

  -- Uniqueness constraint
  UNIQUE(menu_item_id, ingredient_id)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- LOCATION MENU OVERRIDES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS location_menu_overrides (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  location_id UUID NOT NULL REFERENCES locations_v2(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items_v2(id) ON DELETE CASCADE,

  -- Price overrides (null = use base price)
  price_personal_override DECIMAL(10,2),
  price_regular_override DECIMAL(10,2),

  -- Availability at this location
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false, -- Featured at this location

  -- Location-specific notes
  special_notes_es TEXT,
  special_notes_en TEXT,

  -- Uniqueness constraint
  UNIQUE(location_id, menu_item_id)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- UPSELL PAIRINGS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS upsell_pairings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  primary_item_id UUID NOT NULL REFERENCES menu_items_v2(id) ON DELETE CASCADE,
  paired_item_id UUID NOT NULL REFERENCES menu_items_v2(id) ON DELETE CASCADE,

  -- Pairing metadata
  pairing_type VARCHAR(50) NOT NULL, -- 'beverage', 'dessert', 'side', 'combo'
  pairing_strength INTEGER DEFAULT 5 CHECK (pairing_strength >= 1 AND pairing_strength <= 10),

  -- Discount for combo
  combo_discount_percent DECIMAL(5,2),
  combo_name_es VARCHAR(255),
  combo_name_en VARCHAR(255),

  -- AI recommendation text
  suggestion_es TEXT, -- "¡Perfecto con una Limonada de Maracuyá!"
  suggestion_en TEXT,

  is_active BOOLEAN DEFAULT true,

  UNIQUE(primary_item_id, paired_item_id)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- CHATBOT CONVERSATION LOGS (for learning)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL,
  location_id UUID REFERENCES locations_v2(id),

  -- Conversation data
  user_message TEXT NOT NULL,
  detected_intent VARCHAR(100),
  bot_response TEXT NOT NULL,
  suggested_items UUID[], -- References to menu_items_v2

  -- Analytics
  user_selected_item UUID REFERENCES menu_items_v2(id),
  led_to_order BOOLEAN DEFAULT false,
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),

  -- Context
  user_agent TEXT,
  ip_hash VARCHAR(64), -- Hashed for privacy

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE locations_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_menu_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE upsell_pairings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;

-- LOCATIONS: Public read, admin write
CREATE POLICY "locations_v2_public_read" ON locations_v2
  FOR SELECT USING (is_active = true);

CREATE POLICY "locations_v2_admin_all" ON locations_v2
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- CATEGORIES: Public read, admin write
CREATE POLICY "menu_categories_public_read" ON menu_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "menu_categories_admin_all" ON menu_categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- INGREDIENTS: Public read, admin write
CREATE POLICY "ingredients_public_read" ON ingredients
  FOR SELECT USING (is_active = true);

CREATE POLICY "ingredients_admin_all" ON ingredients
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- MENU ITEMS: Public read, admin write
CREATE POLICY "menu_items_v2_public_read" ON menu_items_v2
  FOR SELECT USING (is_active = true);

CREATE POLICY "menu_items_v2_admin_all" ON menu_items_v2
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- MENU ITEM INGREDIENTS: Public read (via join), admin write
CREATE POLICY "menu_item_ingredients_public_read" ON menu_item_ingredients
  FOR SELECT USING (true);

CREATE POLICY "menu_item_ingredients_admin_all" ON menu_item_ingredients
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- LOCATION OVERRIDES: Public read, admin write
CREATE POLICY "location_menu_overrides_public_read" ON location_menu_overrides
  FOR SELECT USING (true);

CREATE POLICY "location_menu_overrides_admin_all" ON location_menu_overrides
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- UPSELL PAIRINGS: Public read, admin write
CREATE POLICY "upsell_pairings_public_read" ON upsell_pairings
  FOR SELECT USING (is_active = true);

CREATE POLICY "upsell_pairings_admin_all" ON upsell_pairings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- CHATBOT CONVERSATIONS: Insert public, read/manage admin only
CREATE POLICY "chatbot_conversations_public_insert" ON chatbot_conversations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "chatbot_conversations_admin_read" ON chatbot_conversations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES FOR PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════════════

-- Locations
CREATE INDEX IF NOT EXISTS idx_locations_v2_code ON locations_v2(code);
CREATE INDEX IF NOT EXISTS idx_locations_v2_active ON locations_v2(is_active);
CREATE INDEX IF NOT EXISTS idx_locations_v2_delivery ON locations_v2(delivery_enabled) WHERE is_active = true;

-- Categories
CREATE INDEX IF NOT EXISTS idx_menu_categories_code ON menu_categories(code);
CREATE INDEX IF NOT EXISTS idx_menu_categories_order ON menu_categories(display_order);

-- Ingredients
CREATE INDEX IF NOT EXISTS idx_ingredients_code ON ingredients(code);
CREATE INDEX IF NOT EXISTS idx_ingredients_allergens ON ingredients USING GIN(allergens);
CREATE INDEX IF NOT EXISTS idx_ingredients_type ON ingredients(ingredient_type);

-- Menu Items
CREATE INDEX IF NOT EXISTS idx_menu_items_v2_code ON menu_items_v2(code);
CREATE INDEX IF NOT EXISTS idx_menu_items_v2_category ON menu_items_v2(category_code);
CREATE INDEX IF NOT EXISTS idx_menu_items_v2_best_seller ON menu_items_v2(is_best_seller) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_menu_items_v2_allergens ON menu_items_v2 USING GIN(allergen_summary);
CREATE INDEX IF NOT EXISTS idx_menu_items_v2_dietary ON menu_items_v2 USING GIN(dietary_tags);
CREATE INDEX IF NOT EXISTS idx_menu_items_v2_active ON menu_items_v2(is_active, display_order);

-- Menu Item Ingredients
CREATE INDEX IF NOT EXISTS idx_menu_item_ingredients_item ON menu_item_ingredients(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_ingredients_ingredient ON menu_item_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_ingredients_primary ON menu_item_ingredients(menu_item_id, is_primary);

-- Location Overrides
CREATE INDEX IF NOT EXISTS idx_location_overrides_location ON location_menu_overrides(location_id);
CREATE INDEX IF NOT EXISTS idx_location_overrides_item ON location_menu_overrides(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_location_overrides_featured ON location_menu_overrides(location_id, is_featured) WHERE is_available = true;

-- Upsell Pairings
CREATE INDEX IF NOT EXISTS idx_upsell_primary ON upsell_pairings(primary_item_id);
CREATE INDEX IF NOT EXISTS idx_upsell_type ON upsell_pairings(pairing_type);

-- Chatbot Conversations
CREATE INDEX IF NOT EXISTS idx_chatbot_session ON chatbot_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_intent ON chatbot_conversations(detected_intent);
CREATE INDEX IF NOT EXISTS idx_chatbot_created ON chatbot_conversations(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

-- Auto-update timestamps
CREATE TRIGGER locations_v2_updated_at
  BEFORE UPDATE ON locations_v2
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER menu_categories_updated_at
  BEFORE UPDATE ON menu_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER ingredients_updated_at
  BEFORE UPDATE ON ingredients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER menu_items_v2_updated_at
  BEFORE UPDATE ON menu_items_v2
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNCTION: Compute allergens for menu item from ingredients
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION compute_menu_item_allergens(item_id UUID)
RETURNS allergen_tag[] AS $$
DECLARE
  allergen_array allergen_tag[];
BEGIN
  SELECT ARRAY_AGG(DISTINCT unnest_allergen)
  INTO allergen_array
  FROM (
    SELECT unnest(i.allergens) as unnest_allergen
    FROM menu_item_ingredients mii
    JOIN ingredients i ON i.id = mii.ingredient_id
    WHERE mii.menu_item_id = item_id
  ) sub;

  RETURN COALESCE(allergen_array, '{}');
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNCTION: Get menu item with full details
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_menu_item_full(item_code VARCHAR, loc_code VARCHAR DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  code VARCHAR,
  name_es VARCHAR,
  name_en VARCHAR,
  description_es TEXT,
  description_en TEXT,
  category_code VARCHAR,
  price_personal DECIMAL,
  price_regular DECIMAL,
  allergens allergen_tag[],
  dietary_tags dietary_tag[],
  ingredients JSONB,
  is_best_seller BOOLEAN,
  is_available BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mi.id,
    mi.code,
    mi.name_es,
    mi.name_en,
    mi.description_es,
    mi.description_en,
    mi.category_code,
    COALESCE(lmo.price_personal_override, mi.price_personal) as price_personal,
    COALESCE(lmo.price_regular_override, mi.price_regular) as price_regular,
    mi.allergen_summary as allergens,
    mi.dietary_tags,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'name_es', ing.name_es,
        'name_en', ing.name_en,
        'is_primary', mii.is_primary,
        'allergens', ing.allergens
      ) ORDER BY mii.is_primary DESC, mii.display_order)
      FROM menu_item_ingredients mii
      JOIN ingredients ing ON ing.id = mii.ingredient_id
      WHERE mii.menu_item_id = mi.id
    ) as ingredients,
    mi.is_best_seller,
    COALESCE(lmo.is_available, mi.is_active) as is_available
  FROM menu_items_v2 mi
  LEFT JOIN locations_v2 loc ON loc.code = loc_code
  LEFT JOIN location_menu_overrides lmo ON lmo.menu_item_id = mi.id AND lmo.location_id = loc.id
  WHERE mi.code = item_code AND mi.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNCTION: Get upsell suggestions for an item
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_upsell_suggestions(item_code VARCHAR, loc_code VARCHAR DEFAULT NULL)
RETURNS TABLE (
  paired_item_code VARCHAR,
  paired_item_name_es VARCHAR,
  paired_item_name_en VARCHAR,
  pairing_type VARCHAR,
  suggestion_es TEXT,
  suggestion_en TEXT,
  price DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mi2.code as paired_item_code,
    mi2.name_es as paired_item_name_es,
    mi2.name_en as paired_item_name_en,
    up.pairing_type,
    up.suggestion_es,
    up.suggestion_en,
    COALESCE(lmo.price_regular_override, mi2.price_regular) as price
  FROM menu_items_v2 mi
  JOIN upsell_pairings up ON up.primary_item_id = mi.id
  JOIN menu_items_v2 mi2 ON mi2.id = up.paired_item_id
  LEFT JOIN locations_v2 loc ON loc.code = loc_code
  LEFT JOIN location_menu_overrides lmo ON lmo.menu_item_id = mi2.id AND lmo.location_id = loc.id
  WHERE mi.code = item_code
    AND up.is_active = true
    AND mi2.is_active = true
    AND COALESCE(lmo.is_available, true) = true
  ORDER BY up.pairing_strength DESC
  LIMIT 3;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNCTION: Find items by dietary requirement
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION find_items_by_dietary(
  dietary dietary_tag,
  loc_code VARCHAR DEFAULT NULL,
  max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  code VARCHAR,
  name_es VARCHAR,
  name_en VARCHAR,
  category_code VARCHAR,
  price DECIMAL,
  is_best_seller BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mi.code,
    mi.name_es,
    mi.name_en,
    mi.category_code,
    COALESCE(lmo.price_regular_override, mi.price_regular) as price,
    mi.is_best_seller
  FROM menu_items_v2 mi
  LEFT JOIN locations_v2 loc ON loc.code = loc_code
  LEFT JOIN location_menu_overrides lmo ON lmo.menu_item_id = mi.id AND lmo.location_id = loc.id
  WHERE dietary = ANY(mi.dietary_tags)
    AND mi.is_active = true
    AND COALESCE(lmo.is_available, true) = true
  ORDER BY mi.is_best_seller DESC, mi.display_order
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNCTION: Find items without specific allergen
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION find_items_without_allergen(
  avoid_allergen allergen_tag,
  category VARCHAR DEFAULT NULL,
  loc_code VARCHAR DEFAULT NULL,
  max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  code VARCHAR,
  name_es VARCHAR,
  name_en VARCHAR,
  category_code VARCHAR,
  price DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mi.code,
    mi.name_es,
    mi.name_en,
    mi.category_code,
    COALESCE(lmo.price_regular_override, mi.price_regular) as price
  FROM menu_items_v2 mi
  LEFT JOIN locations_v2 loc ON loc.code = loc_code
  LEFT JOIN location_menu_overrides lmo ON lmo.menu_item_id = mi.id AND lmo.location_id = loc.id
  WHERE NOT (avoid_allergen = ANY(mi.allergen_summary))
    AND mi.is_active = true
    AND COALESCE(lmo.is_available, true) = true
    AND (category IS NULL OR mi.category_code = category)
  ORDER BY mi.is_best_seller DESC, mi.display_order
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- DONE - Schema ready for seeding
-- ═══════════════════════════════════════════════════════════════════════════
