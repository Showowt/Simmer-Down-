-- SIMMER DOWN - COMPLETE SCHEMA MIGRATION
-- Version: 2.0.0
-- Date: 2026-02-14
-- Description: Complete database schema with all missing tables, RLS policies, indexes, and triggers

-- =====================
-- ENABLE EXTENSIONS
-- =====================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "moddatetime";

-- =====================
-- TABLE: EVENTS (Enhanced version)
-- =====================
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  location_name TEXT, -- Fallback for non-standard locations
  capacity INTEGER,
  registrations_count INTEGER DEFAULT 0,
  image_url TEXT,
  category TEXT DEFAULT 'General',
  price_amount DECIMAL(10,2),
  price_display TEXT, -- "$45" or "Free"
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT, -- For recurring events: "weekly-friday", "monthly-15"
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- TABLE: EVENT REGISTRATIONS
-- =====================
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  party_size INTEGER DEFAULT 1 CHECK (party_size > 0),
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'waitlist', 'attended')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- TABLE: SPECIALS / PROMOTIONS
-- =====================
CREATE TABLE IF NOT EXISTS specials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed', 'combo', 'bogo')),
  discount_value DECIMAL(10,2),
  discount_percentage INTEGER CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  original_price DECIMAL(10,2),
  special_price DECIMAL(10,2),
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  start_date DATE,
  end_date DATE,
  day_of_week INTEGER[], -- Array of integers: 0=Sunday, 6=Saturday
  start_time TIME,
  end_time TIME,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- TABLE: OPERATING HOURS
-- =====================
CREATE TABLE IF NOT EXISTS operating_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT false,
  is_24_hours BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(location_id, day_of_week)
);

-- =====================
-- TABLE: LOYALTY TIERS (Optional - for future expansion)
-- =====================
CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_name TEXT NOT NULL UNIQUE CHECK (tier_name IN ('bronze', 'silver', 'gold', 'platinum')),
  points_required INTEGER NOT NULL,
  discount_percentage INTEGER DEFAULT 0,
  perks JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- TABLE: CUSTOMERS (Dedicated customer tracking)
-- =====================
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE,
  name TEXT,
  email TEXT,
  loyalty_points INTEGER DEFAULT 0,
  loyalty_tier TEXT DEFAULT 'bronze' CHECK (loyalty_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  last_order_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- INDEXES FOR PERFORMANCE
-- =====================

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_events_active_featured ON events(is_active, is_featured) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_events_location_id ON events(location_id);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category) WHERE is_active = true;

-- Event registrations indexes
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(event_id, status);
CREATE INDEX IF NOT EXISTS idx_event_registrations_phone ON event_registrations(customer_phone);

-- Specials indexes
CREATE INDEX IF NOT EXISTS idx_specials_active_dates ON specials(start_date, end_date, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_specials_menu_item ON specials(menu_item_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_specials_featured ON specials(is_featured, is_active) WHERE is_active = true AND is_featured = true;

-- Operating hours indexes
CREATE INDEX IF NOT EXISTS idx_operating_hours_location ON operating_hours(location_id, day_of_week);

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_loyalty_tier ON customers(loyalty_tier);

-- Existing tables - add missing indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_location_id ON orders(location_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category) WHERE available = true;
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status, created_at);

-- =====================
-- ROW LEVEL SECURITY POLICIES
-- =====================

-- EVENTS POLICIES
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Events are viewable by everyone" ON events;
CREATE POLICY "Events are viewable by everyone"
  ON events FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage events" ON events;
CREATE POLICY "Admins can insert events"
  ON events FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Admins can update events"
  ON events FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- EVENT REGISTRATIONS POLICIES
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can register for events"
  ON event_registrations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own registrations"
  ON event_registrations FOR SELECT
  USING (
    customer_phone IN (SELECT phone FROM profiles WHERE id = auth.uid())
    OR customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Admins can manage registrations"
  ON event_registrations FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Admins can delete registrations"
  ON event_registrations FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- SPECIALS POLICIES
ALTER TABLE specials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Specials are viewable by everyone"
  ON specials FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert specials"
  ON specials FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Admins can update specials"
  ON specials FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Admins can delete specials"
  ON specials FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- OPERATING HOURS POLICIES
ALTER TABLE operating_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Operating hours are viewable by everyone"
  ON operating_hours FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage operating hours"
  ON operating_hours FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- CUSTOMERS POLICIES
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own record"
  ON customers FOR SELECT
  USING (
    phone IN (SELECT phone FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Anyone can insert customer record"
  ON customers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Staff can update customer records"
  ON customers FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- LOYALTY TIERS POLICIES
ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Loyalty tiers are viewable by everyone"
  ON loyalty_tiers FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage loyalty tiers"
  ON loyalty_tiers FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================
-- TRIGGERS: updated_at timestamps
-- =====================

-- Events
CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Event registrations
CREATE TRIGGER event_registrations_updated_at
  BEFORE UPDATE ON event_registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Specials
CREATE TRIGGER specials_updated_at
  BEFORE UPDATE ON specials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Operating hours
CREATE TRIGGER operating_hours_updated_at
  BEFORE UPDATE ON operating_hours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Customers
CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Loyalty tiers
CREATE TRIGGER loyalty_tiers_updated_at
  BEFORE UPDATE ON loyalty_tiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================
-- TRIGGERS: Business Logic
-- =====================

-- Update event registrations count when registration is added/removed
CREATE OR REPLACE FUNCTION update_event_registrations_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'confirmed') THEN
    UPDATE events
    SET registrations_count = registrations_count + NEW.party_size
    WHERE id = NEW.event_id;
  ELSIF (TG_OP = 'DELETE' AND OLD.status = 'confirmed') THEN
    UPDATE events
    SET registrations_count = GREATEST(0, registrations_count - OLD.party_size)
    WHERE id = OLD.event_id;
  ELSIF (TG_OP = 'UPDATE' AND OLD.status = 'confirmed' AND NEW.status != 'confirmed') THEN
    UPDATE events
    SET registrations_count = GREATEST(0, registrations_count - OLD.party_size)
    WHERE id = NEW.event_id;
  ELSIF (TG_OP = 'UPDATE' AND OLD.status != 'confirmed' AND NEW.status = 'confirmed') THEN
    UPDATE events
    SET registrations_count = registrations_count + NEW.party_size
    WHERE id = NEW.event_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_registrations_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON event_registrations
  FOR EACH ROW EXECUTE FUNCTION update_event_registrations_count();

-- Update customer stats when order is completed
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status = 'delivered' THEN
    INSERT INTO customers (phone, name, email, total_orders, total_spent, last_order_at)
    VALUES (
      NEW.customer_phone,
      NEW.customer_name,
      NEW.customer_email,
      1,
      NEW.total,
      NEW.delivered_at
    )
    ON CONFLICT (phone) DO UPDATE SET
      name = COALESCE(EXCLUDED.name, customers.name),
      email = COALESCE(EXCLUDED.email, customers.email),
      total_orders = customers.total_orders + 1,
      total_spent = customers.total_spent + NEW.total,
      last_order_at = NEW.delivered_at,
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_update_customer_stats
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_customer_stats();

-- =====================
-- REALTIME SUBSCRIPTIONS
-- =====================
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE event_registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE specials;

-- =====================
-- SAMPLE DATA: LOYALTY TIERS
-- =====================
INSERT INTO loyalty_tiers (tier_name, points_required, discount_percentage, perks) VALUES
  ('bronze', 0, 0, '{"benefits": ["Early event notifications"]}'),
  ('silver', 500, 5, '{"benefits": ["5% discount", "Birthday special", "Priority reservations"]}'),
  ('gold', 2000, 10, '{"benefits": ["10% discount", "Free delivery", "Exclusive events", "Birthday special"]}'),
  ('platinum', 5000, 15, '{"benefits": ["15% discount", "Free delivery", "VIP events", "Personal concierge", "Monthly surprise"]}')
ON CONFLICT (tier_name) DO NOTHING;

-- =====================
-- SAMPLE DATA: OPERATING HOURS (for existing locations)
-- =====================
-- This will need to be customized per location
-- Example for Santa Ana location
DO $$
DECLARE
  santa_ana_id UUID;
BEGIN
  SELECT id INTO santa_ana_id FROM locations WHERE name = 'Santa Ana' LIMIT 1;

  IF santa_ana_id IS NOT NULL THEN
    INSERT INTO operating_hours (location_id, day_of_week, open_time, close_time, is_closed) VALUES
      (santa_ana_id, 0, '11:00', '21:00', false), -- Sunday
      (santa_ana_id, 1, '11:00', '21:00', false), -- Monday
      (santa_ana_id, 2, '11:00', '21:00', false), -- Tuesday
      (santa_ana_id, 3, '11:00', '21:00', false), -- Wednesday
      (santa_ana_id, 4, '11:00', '21:00', false), -- Thursday
      (santa_ana_id, 5, '11:00', '22:00', false), -- Friday
      (santa_ana_id, 6, '11:00', '22:00', false)  -- Saturday
    ON CONFLICT (location_id, day_of_week) DO NOTHING;
  END IF;
END $$;

-- =====================
-- ROLLBACK SCRIPT (Save separately as rollback.sql)
-- =====================
-- DROP TRIGGER IF EXISTS orders_update_customer_stats ON orders;
-- DROP TRIGGER IF EXISTS event_registrations_count_trigger ON event_registrations;
-- DROP TRIGGER IF EXISTS loyalty_tiers_updated_at ON loyalty_tiers;
-- DROP TRIGGER IF EXISTS customers_updated_at ON customers;
-- DROP TRIGGER IF EXISTS operating_hours_updated_at ON operating_hours;
-- DROP TRIGGER IF EXISTS specials_updated_at ON specials;
-- DROP TRIGGER IF EXISTS event_registrations_updated_at ON event_registrations;
-- DROP TRIGGER IF EXISTS events_updated_at ON events;
--
-- DROP FUNCTION IF EXISTS update_customer_stats();
-- DROP FUNCTION IF EXISTS update_event_registrations_count();
--
-- DROP TABLE IF EXISTS loyalty_tiers CASCADE;
-- DROP TABLE IF EXISTS customers CASCADE;
-- DROP TABLE IF EXISTS operating_hours CASCADE;
-- DROP TABLE IF EXISTS specials CASCADE;
-- DROP TABLE IF EXISTS event_registrations CASCADE;
-- DROP TABLE IF EXISTS events CASCADE;

-- =====================
-- VERIFICATION QUERIES
-- =====================
-- Run these to verify the migration worked:
-- SELECT COUNT(*) FROM events;
-- SELECT COUNT(*) FROM event_registrations;
-- SELECT COUNT(*) FROM specials;
-- SELECT COUNT(*) FROM operating_hours;
-- SELECT COUNT(*) FROM customers;
-- SELECT COUNT(*) FROM loyalty_tiers;
--
-- -- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('events', 'event_registrations', 'specials', 'operating_hours', 'customers', 'loyalty_tiers');
--
-- -- Check indexes
-- SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('events', 'event_registrations', 'specials', 'operating_hours', 'customers');
