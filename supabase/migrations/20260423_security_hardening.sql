-- ═══════════════════════════════════════════════════════════════
-- Migration: Security Hardening
-- Date: 2026-04-23
-- Fixes: RLS on specials/settings/payments, tighter orders INSERT
-- ═══════════════════════════════════════════════════════════════

-- ─── SPECIALS TABLE: restrict write to admin/manager ───

-- Drop the overly permissive policy that allows ANY authenticated user to write
DROP POLICY IF EXISTS "Authenticated users can manage specials" ON specials;
DROP POLICY IF EXISTS "authenticated_all" ON specials;

-- Public can read active specials
CREATE POLICY "public_read_specials" ON specials
  FOR SELECT USING (true);

-- Only admin/manager can create, update, delete specials
CREATE POLICY "admin_manage_specials" ON specials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- ─── SETTINGS TABLE: restrict write to admin ───

-- Drop permissive policies
DROP POLICY IF EXISTS "Public can view settings" ON settings;
DROP POLICY IF EXISTS "Authenticated users can manage settings" ON settings;
DROP POLICY IF EXISTS "authenticated_all" ON settings;

-- Everyone can read settings (needed for frontend config)
CREATE POLICY "public_read_settings" ON settings
  FOR SELECT USING (true);

-- Only admin can modify settings
CREATE POLICY "admin_manage_settings" ON settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ─── PAYMENTS TABLE: ensure RLS is enabled ───

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Service role has full access (for API routes)
DROP POLICY IF EXISTS "service_role_payments" ON payments;
CREATE POLICY "service_role_payments" ON payments
  FOR ALL USING (auth.role() = 'service_role');

-- Staff can read payments (for admin dashboard)
DROP POLICY IF EXISTS "staff_read_payments" ON payments;
CREATE POLICY "staff_read_payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- ─── ORDERS TABLE: tighten INSERT policy ───

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
DROP POLICY IF EXISTS "anon_insert" ON orders;

-- New orders must be pending with a positive total and a location
CREATE POLICY "orders_insert_validated" ON orders
  FOR INSERT WITH CHECK (
    status = 'pending'
    AND total_amount > 0
    AND location_id IS NOT NULL
  );

-- Service role can do anything (for API routes, webhooks)
DROP POLICY IF EXISTS "service_role_orders" ON orders;
CREATE POLICY "service_role_orders" ON orders
  FOR ALL USING (auth.role() = 'service_role');

-- Keep existing read/update policies intact
-- (customers can read their own orders, staff can read all)
