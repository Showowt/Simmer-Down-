-- ============================================
-- SIMMER DOWN: Admin Dashboard Tables
-- Migration: 2026-02-14
-- ============================================

-- SPECIALS / PROMOTIONS TABLE
CREATE TABLE IF NOT EXISTS specials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed', 'bundle')),
  discount_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  original_price NUMERIC(10,2),
  special_price NUMERIC(10,2),
  menu_items TEXT[], -- Array of menu item IDs
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  days_of_week INTEGER[], -- Array of 0-6 (Sun-Sat), NULL = all days
  active BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN NOT NULL DEFAULT false,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for specials
ALTER TABLE specials ENABLE ROW LEVEL SECURITY;

-- Public can read active specials
CREATE POLICY "Public can view active specials"
  ON specials FOR SELECT
  USING (active = true);

-- Authenticated users can manage specials
CREATE POLICY "Authenticated users can manage specials"
  ON specials FOR ALL
  USING (auth.role() = 'authenticated');

-- SETTINGS TABLE (singleton)
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Simmer Down',
  tagline TEXT,
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  min_order_amount NUMERIC(10,2) NOT NULL DEFAULT 10.00,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 3.00,
  free_delivery_threshold NUMERIC(10,2),
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'USD',
  timezone TEXT NOT NULL DEFAULT 'America/El_Salvador',
  social_facebook TEXT,
  social_instagram TEXT,
  social_twitter TEXT,
  social_whatsapp TEXT,
  notifications_email BOOLEAN NOT NULL DEFAULT true,
  notifications_sms BOOLEAN NOT NULL DEFAULT false,
  notifications_push BOOLEAN NOT NULL DEFAULT true,
  online_ordering_enabled BOOLEAN NOT NULL DEFAULT true,
  delivery_enabled BOOLEAN NOT NULL DEFAULT true,
  pickup_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for settings
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Public can read settings (for display purposes)
CREATE POLICY "Public can view settings"
  ON settings FOR SELECT
  USING (true);

-- Authenticated users can manage settings
CREATE POLICY "Authenticated users can manage settings"
  ON settings FOR ALL
  USING (auth.role() = 'authenticated');

-- Add updated_at trigger for specials
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_specials_updated_at
  BEFORE UPDATE ON specials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings row if none exists
INSERT INTO settings (name, tagline)
SELECT 'Simmer Down', 'Artisan Pizza'
WHERE NOT EXISTS (SELECT 1 FROM settings LIMIT 1);

-- INDEXES for better query performance
CREATE INDEX IF NOT EXISTS idx_specials_active ON specials(active);
CREATE INDEX IF NOT EXISTS idx_specials_featured ON specials(featured);
CREATE INDEX IF NOT EXISTS idx_specials_dates ON specials(start_date, end_date);

-- Add missing columns to existing tables if they don't exist
DO $$
BEGIN
  -- Add tags column to menu_items if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'tags'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN tags TEXT[];
  END IF;

  -- Add availability_note to menu_items if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'availability_note'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN availability_note TEXT;
  END IF;

  -- Add price_grand to menu_items if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'price_grand'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN price_grand NUMERIC(10,2);
  END IF;
END $$;

-- COMMENT on tables for documentation
COMMENT ON TABLE specials IS 'Promotions and special offers for the restaurant';
COMMENT ON TABLE settings IS 'Global restaurant settings and configuration';
