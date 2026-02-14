-- SIMMER DOWN - SCHEMA ROLLBACK
-- Version: 2.0.0
-- Date: 2026-02-14
-- Description: Rollback script to undo complete-schema.sql changes

-- WARNING: This will delete all data in the new tables
-- Make sure to backup your data before running this

-- =====================
-- DROP TRIGGERS
-- =====================
DROP TRIGGER IF EXISTS orders_update_customer_stats ON orders;
DROP TRIGGER IF EXISTS event_registrations_count_trigger ON event_registrations;
DROP TRIGGER IF EXISTS loyalty_tiers_updated_at ON loyalty_tiers;
DROP TRIGGER IF EXISTS customers_updated_at ON customers;
DROP TRIGGER IF EXISTS operating_hours_updated_at ON operating_hours;
DROP TRIGGER IF EXISTS specials_updated_at ON specials;
DROP TRIGGER IF EXISTS event_registrations_updated_at ON event_registrations;
DROP TRIGGER IF EXISTS events_updated_at ON events;

-- =====================
-- DROP FUNCTIONS
-- =====================
DROP FUNCTION IF EXISTS update_customer_stats() CASCADE;
DROP FUNCTION IF EXISTS update_event_registrations_count() CASCADE;

-- =====================
-- DROP POLICIES
-- =====================

-- Events policies
DROP POLICY IF EXISTS "Admins can delete events" ON events;
DROP POLICY IF EXISTS "Admins can update events" ON events;
DROP POLICY IF EXISTS "Admins can insert events" ON events;
DROP POLICY IF EXISTS "Events are viewable by everyone" ON events;

-- Event registrations policies
DROP POLICY IF EXISTS "Admins can delete registrations" ON event_registrations;
DROP POLICY IF EXISTS "Admins can manage registrations" ON event_registrations;
DROP POLICY IF EXISTS "Users can view own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Anyone can register for events" ON event_registrations;

-- Specials policies
DROP POLICY IF EXISTS "Admins can delete specials" ON specials;
DROP POLICY IF EXISTS "Admins can update specials" ON specials;
DROP POLICY IF EXISTS "Admins can insert specials" ON specials;
DROP POLICY IF EXISTS "Specials are viewable by everyone" ON specials;

-- Operating hours policies
DROP POLICY IF EXISTS "Admins can manage operating hours" ON operating_hours;
DROP POLICY IF EXISTS "Operating hours are viewable by everyone" ON operating_hours;

-- Customers policies
DROP POLICY IF EXISTS "Staff can update customer records" ON customers;
DROP POLICY IF EXISTS "Anyone can insert customer record" ON customers;
DROP POLICY IF EXISTS "Customers can view own record" ON customers;

-- Loyalty tiers policies
DROP POLICY IF EXISTS "Admins can manage loyalty tiers" ON loyalty_tiers;
DROP POLICY IF EXISTS "Loyalty tiers are viewable by everyone" ON loyalty_tiers;

-- =====================
-- DROP INDEXES
-- =====================

-- Events indexes
DROP INDEX IF EXISTS idx_events_event_date;
DROP INDEX IF EXISTS idx_events_active_featured;
DROP INDEX IF EXISTS idx_events_location_id;
DROP INDEX IF EXISTS idx_events_category;

-- Event registrations indexes
DROP INDEX IF EXISTS idx_event_registrations_event_id;
DROP INDEX IF EXISTS idx_event_registrations_status;
DROP INDEX IF EXISTS idx_event_registrations_phone;

-- Specials indexes
DROP INDEX IF EXISTS idx_specials_active_dates;
DROP INDEX IF EXISTS idx_specials_menu_item;
DROP INDEX IF EXISTS idx_specials_featured;

-- Operating hours indexes
DROP INDEX IF EXISTS idx_operating_hours_location;

-- Customers indexes
DROP INDEX IF EXISTS idx_customers_phone;
DROP INDEX IF EXISTS idx_customers_email;
DROP INDEX IF EXISTS idx_customers_loyalty_tier;

-- Existing tables - indexes added in migration
DROP INDEX IF EXISTS idx_orders_customer_phone;
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_location_id;
DROP INDEX IF EXISTS idx_orders_created_at;
DROP INDEX IF EXISTS idx_menu_items_category;
DROP INDEX IF EXISTS idx_contact_submissions_status;

-- =====================
-- DROP TABLES
-- =====================
DROP TABLE IF EXISTS loyalty_tiers CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS operating_hours CASCADE;
DROP TABLE IF EXISTS specials CASCADE;
DROP TABLE IF EXISTS event_registrations CASCADE;
DROP TABLE IF EXISTS events CASCADE;

-- =====================
-- VERIFICATION QUERIES
-- =====================
-- Run these to verify the rollback worked:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('events', 'event_registrations', 'specials', 'operating_hours', 'customers', 'loyalty_tiers');
-- Expected result: 0 rows (tables should not exist)

-- Check that original tables still exist:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('profiles', 'menu_items', 'locations', 'orders', 'contact_submissions');
-- Expected result: 5 rows (all original tables should exist)
