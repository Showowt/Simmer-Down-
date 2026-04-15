-- ============================================
-- SIMMER DOWN: Powertranz payments + third-party delivery
-- Migration: 2026-04-15
-- Scope (re-targeted to production schema):
--   1. Extend existing `payments` table with Powertranz 3DS 2.0 fields.
--   2. Add 'powertranz' + third-party values to payment_method enum.
--   3. Add third-party delivery fields to `orders`
--      (external_order_id, external_payload). `order_source` already exists.
--   4. Create `payment_attempts` audit table + PAN-leak guard trigger.
--
-- Pre-existing schema (verified live):
--   - payments(id, order_id, amount, currency, payment_method, status,
--              stripe_*, card_last_four, card_brand, paid_at, failed_at,
--              refunded_at, failure_reason, receipt_url, metadata, ...)
--   - orders(id, order_number, customer_id, location_id, order_type,
--            status, placed_at, ..., total_amount, order_source, ...)
--   - order_items already normalized with modifiers JSONB
-- ============================================

-- ─────────────────────────────────────────────
-- 1. EXTEND payment_method ENUM
-- ─────────────────────────────────────────────
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'powertranz';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'uber_eats';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'doordash';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'pedidos_ya';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'hugo';

-- ─────────────────────────────────────────────
-- 2. EXTEND payments TABLE (Powertranz-specific)
-- ─────────────────────────────────────────────
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS powertranz_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS powertranz_order_identifier TEXT,
  ADD COLUMN IF NOT EXISTS authorization_code TEXT,
  ADD COLUMN IF NOT EXISTS spi_token TEXT,
  ADD COLUMN IF NOT EXISTS processor_response JSONB,
  ADD COLUMN IF NOT EXISTS error_code TEXT,
  ADD COLUMN IF NOT EXISTS initiated_at TIMESTAMPTZ;

-- Unique partial indexes (nullable-safe).
CREATE UNIQUE INDEX IF NOT EXISTS payments_powertranz_txn_idx
  ON payments(powertranz_transaction_id)
  WHERE powertranz_transaction_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS payments_spi_token_idx
  ON payments(spi_token)
  WHERE spi_token IS NOT NULL;

-- Fast lookup of the active payment per order.
CREATE INDEX IF NOT EXISTS payments_order_active_idx
  ON payments(order_id, status, created_at DESC);

COMMENT ON COLUMN payments.spi_token IS 'Powertranz SPI token. 5-minute TTL. Null out once finalized.';
COMMENT ON COLUMN payments.processor_response IS 'Sanitized Powertranz response. Card fields stripped before write.';
COMMENT ON COLUMN payments.powertranz_transaction_id IS 'Our UUID sent as Powertranz TransactionIdentifier.';

-- ─────────────────────────────────────────────
-- 3. EXTEND orders WITH THIRD-PARTY DELIVERY FIELDS
-- ─────────────────────────────────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS external_order_id TEXT,
  ADD COLUMN IF NOT EXISTS external_payload JSONB;

-- Dedupe guarantee: one local order per (provider, external_id).
-- order_source already exists as varchar; no need to recreate.
CREATE UNIQUE INDEX IF NOT EXISTS orders_source_external_idx
  ON orders(order_source, external_order_id)
  WHERE external_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_source
  ON orders(order_source);

-- ─────────────────────────────────────────────
-- 4. payment_attempts AUDIT TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  stage TEXT NOT NULL CHECK (stage IN (
    'sale','3ds_callback','payment','void','refund','status_poll'
  )),
  request_payload JSONB,       -- MUST be PAN/CVV-stripped
  response_payload JSONB,      -- MUST be PAN/CVV-stripped
  iso_response_code TEXT,
  response_message TEXT,
  spi_token TEXT,
  transaction_identifier TEXT,
  http_status INT,
  error_detail TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payment_attempts_order_idx
  ON payment_attempts(order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS payment_attempts_payment_idx
  ON payment_attempts(payment_id, created_at DESC);

CREATE INDEX IF NOT EXISTS payment_attempts_stage_idx
  ON payment_attempts(stage, created_at DESC);

ALTER TABLE payment_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payment_attempts_service_role ON payment_attempts;
CREATE POLICY payment_attempts_service_role
  ON payment_attempts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Staff read-only audit access.
DROP POLICY IF EXISTS payment_attempts_staff_read ON payment_attempts;
CREATE POLICY payment_attempts_staff_read
  ON payment_attempts FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM staff
            WHERE staff.auth_user_id = auth.uid()
              AND staff.is_active = true)
  );

COMMENT ON TABLE payment_attempts IS 'Audit log for every Powertranz interaction. PAN/CVV stripped via reject_pan_in_payload trigger.';

-- ─────────────────────────────────────────────
-- 5. PAN-LEAK GUARD (defense-in-depth)
-- Reject any payment_attempts row whose payloads contain a 13-19 digit run.
-- The app must strip card data before insert; this is the last line.
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION reject_pan_in_payload()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.request_payload IS NOT NULL
     AND NEW.request_payload::text ~ '[0-9]{13,19}' THEN
    RAISE EXCEPTION 'payment_attempts.request_payload contains a possible PAN (13-19 digit run). Strip card data before insert.'
      USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.response_payload IS NOT NULL
     AND NEW.response_payload::text ~ '[0-9]{13,19}' THEN
    RAISE EXCEPTION 'payment_attempts.response_payload contains a possible PAN (13-19 digit run).'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reject_pan ON payment_attempts;
CREATE TRIGGER trg_reject_pan
  BEFORE INSERT OR UPDATE ON payment_attempts
  FOR EACH ROW EXECUTE FUNCTION reject_pan_in_payload();

-- ─────────────────────────────────────────────
-- 6. updated_at TRIGGER on payment_attempts (optional; no-op if no col)
-- ─────────────────────────────────────────────
-- No updated_at column by design; inserts are append-only audit rows.

-- ============================================
-- Done.
-- ============================================
SELECT '20260415_powertranz_payments: applied successfully.' AS message;
