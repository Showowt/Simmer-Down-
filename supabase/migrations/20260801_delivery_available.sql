-- ============================================
-- SIMMER DOWN: delivery-limited menu
-- Migration: 2026-08-01 (applied to prod via Management API same day)
--
-- Client request (Grupo Kase): delivery uses a shorter menu than
-- pickup/dine-in. Adds a per-item override flag consumed by the public
-- carta filter and enforced server-side in /api/orders/create.
--
-- NOTE: menu_item_overrides itself predates the migrations directory
-- (created directly in prod). Semantics of delivery_available:
--   NULL  -> item IS deliverable (default, inherits static catalog)
--   false -> item hidden from the domicilio menu and rejected on
--            delivery orders
--   true  -> explicitly deliverable (same effect as NULL)
-- ============================================

ALTER TABLE menu_item_overrides
  ADD COLUMN IF NOT EXISTS delivery_available BOOLEAN;

COMMENT ON COLUMN menu_item_overrides.delivery_available IS
  'NULL/true = orderable a domicilio; false = excluded from the delivery menu';
