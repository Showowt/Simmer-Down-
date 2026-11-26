-- ============================================================
-- Digital gift cards (Phil + client, 2026-11-26): bought on the site with
-- the certified card checkout, delivered instantly as a private page with a
-- QR, redeemed by staff at the 5 restaurants, every movement on a ledger.
-- Decisions: redeem in restaurants now (online checkout later), expire 12
-- months after purchase, $10/$15/$25/$50 + custom $5–$200, delivery = page
-- + WhatsApp share (no email).
--
-- Money rules enforced HERE, not in app code:
--   * a card exists only after the bank approved: issue_gift_card() runs
--     from the orders status → 'confirmed' trigger (same path as tickets),
--     idempotent per order, and refuses if the charged total ≠ card value;
--   * codes: 12 chars from a 32-symbol alphabet (no 0/1/I/O) drawn from
--     pgcrypto random bytes = 60 bits; UNIQUE; retried on collision;
--   * redeem_gift_card() locks the card row (FOR UPDATE): two staff scanning
--     the same card at once can never spend more than the balance;
--   * balance CHECK 0 ≤ balance ≤ initial_amount; every change writes a
--     gift_card_transactions row (issue / redeem / void) with balance_after,
--     location and staff;
--   * all three tables are service-role only (RLS on, no policies) and the
--     functions are EXECUTE service_role only — every read/write goes
--     through server routes that check staff identity.
-- A gift-card order earns no SimmerLovers points (it is prepaid money, not
-- consumption) — the loyalty trigger now skips it.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.gift_card_purchases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount          NUMERIC(10,2) NOT NULL CHECK (amount >= 5 AND amount <= 200),
  recipient_name  TEXT NOT NULL CHECK (char_length(recipient_name) BETWEEN 1 AND 80),
  sender_name     TEXT NOT NULL CHECK (char_length(sender_name) BETWEEN 1 AND 80),
  message         TEXT CHECK (message IS NULL OR char_length(message) <= 200),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS gift_card_purchase_id UUID
  REFERENCES public.gift_card_purchases(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS orders_gift_card_purchase_uidx
  ON public.orders (gift_card_purchase_id) WHERE gift_card_purchase_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.gift_cards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL UNIQUE CHECK (code ~ '^[2-9A-HJ-NP-Z]{12}$'),
  view_token      TEXT NOT NULL UNIQUE CHECK (view_token ~ '^[0-9a-f]{64}$'),
  order_id        UUID UNIQUE REFERENCES public.orders(id) ON DELETE RESTRICT,
  purchase_id     UUID UNIQUE REFERENCES public.gift_card_purchases(id) ON DELETE RESTRICT,
  initial_amount  NUMERIC(10,2) NOT NULL CHECK (initial_amount > 0),
  balance         NUMERIC(10,2) NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'void')),
  recipient_name  TEXT,
  sender_name     TEXT,
  message         TEXT,
  buyer_name      TEXT,
  buyer_phone     TEXT,
  expires_at      TIMESTAMPTZ NOT NULL,
  voided_at       TIMESTAMPTZ,
  void_reason     TEXT CHECK (void_reason IS NULL OR char_length(void_reason) <= 200),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT gift_cards_balance_range CHECK (balance >= 0 AND balance <= initial_amount)
);
CREATE INDEX IF NOT EXISTS gift_cards_buyer_phone_idx ON public.gift_cards (buyer_phone);
CREATE INDEX IF NOT EXISTS gift_cards_created_idx ON public.gift_cards (created_at DESC);

CREATE TABLE IF NOT EXISTS public.gift_card_transactions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id   UUID NOT NULL REFERENCES public.gift_cards(id) ON DELETE RESTRICT,
  kind           TEXT NOT NULL CHECK (kind IN ('issue', 'redeem', 'void')),
  amount         NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  balance_after  NUMERIC(10,2) NOT NULL CHECK (balance_after >= 0),
  location_id    UUID REFERENCES public.locations(id),
  staff_id       UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  note           TEXT CHECK (note IS NULL OR char_length(note) <= 200),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gift_card_tx_card_idx
  ON public.gift_card_transactions (gift_card_id, created_at);

ALTER TABLE public.gift_card_purchases    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_cards             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_card_transactions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.gift_card_purchases, public.gift_cards, public.gift_card_transactions
  FROM anon, authenticated;

DROP TRIGGER IF EXISTS gift_card_purchases_updated_at ON public.gift_card_purchases;
CREATE TRIGGER gift_card_purchases_updated_at BEFORE UPDATE ON public.gift_card_purchases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS gift_cards_updated_at ON public.gift_cards;
CREATE TRIGGER gift_cards_updated_at BEFORE UPDATE ON public.gift_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS gift_card_transactions_updated_at ON public.gift_card_transactions;
CREATE TRIGGER gift_card_transactions_updated_at BEFORE UPDATE ON public.gift_card_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Code generator: 12 symbols, alphabet of exactly 32 (byte % 32 is unbiased) ──
CREATE OR REPLACE FUNCTION public.gift_card_new_code()
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
SET search_path = public, extensions
AS $$
DECLARE
  alphabet CONSTANT TEXT := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  b   BYTEA := gen_random_bytes(12);
  out TEXT := '';
  i   INT;
BEGIN
  FOR i IN 0..11 LOOP
    out := out || substr(alphabet, (get_byte(b, i) % 32) + 1, 1);
  END LOOP;
  RETURN out;
END;
$$;

-- ── Issue: only for a confirmed (bank-approved) gift-card order, once ──
CREATE OR REPLACE FUNCTION public.issue_gift_card(p_order_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  o        RECORD;
  p        RECORD;
  v_code   TEXT;
  v_token  TEXT;
  v_id     UUID;
  v_tries  INT := 0;
BEGIN
  SELECT id, order_number, status, gift_card_purchase_id, total_amount, customer_name, customer_phone
    INTO o FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND OR o.gift_card_purchase_id IS NULL THEN
    RETURN NULL;
  END IF;
  IF o.status::TEXT <> 'confirmed' THEN
    RETURN NULL;
  END IF;

  SELECT view_token INTO v_token FROM public.gift_cards WHERE order_id = p_order_id;
  IF v_token IS NOT NULL THEN
    RETURN v_token;                         -- idempotent: one card per order, ever
  END IF;

  SELECT * INTO p FROM public.gift_card_purchases WHERE id = o.gift_card_purchase_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  IF round(o.total_amount, 2) <> round(p.amount, 2) THEN
    RAISE WARNING '[gift_cards] order % charged % but card value is % — not issued',
      o.id, o.total_amount, p.amount;
    RETURN NULL;
  END IF;

  LOOP
    v_code  := public.gift_card_new_code();
    v_token := encode(gen_random_bytes(32), 'hex');
    BEGIN
      INSERT INTO public.gift_cards
        (code, view_token, order_id, purchase_id, initial_amount, balance,
         recipient_name, sender_name, message, buyer_name, buyer_phone, expires_at)
      VALUES
        (v_code, v_token, o.id, p.id, p.amount, p.amount,
         p.recipient_name, p.sender_name, p.message, o.customer_name, o.customer_phone,
         now() + INTERVAL '12 months')
      RETURNING id INTO v_id;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      -- A concurrent issue for this order won → return its card.
      SELECT view_token INTO v_token FROM public.gift_cards WHERE order_id = p_order_id;
      IF v_token IS NOT NULL THEN
        RETURN v_token;
      END IF;
      -- Otherwise a code/token collision: draw again.
      v_tries := v_tries + 1;
      IF v_tries >= 5 THEN
        RAISE;
      END IF;
    END;
  END LOOP;

  INSERT INTO public.gift_card_transactions (gift_card_id, kind, amount, balance_after, note)
  VALUES (v_id, 'issue', p.amount, p.amount,
          'Compra en línea #' || coalesce(o.order_number, left(o.id::TEXT, 8)));

  RETURN v_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_issue_gift_card_on_confirm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.issue_gift_card(NEW.id);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block the payment's status change; the order stays visible to staff.
  RAISE WARNING '[gift_cards] issue failed for order %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_confirmed_issue_gift_card ON public.orders;
CREATE TRIGGER on_order_confirmed_issue_gift_card
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed' AND NEW.gift_card_purchase_id IS NOT NULL)
  EXECUTE FUNCTION public.trg_issue_gift_card_on_confirm();

-- Gift-card purchases earn no loyalty points (prepaid money, not a meal).
DROP TRIGGER IF EXISTS on_order_confirmed_award_loyalty ON public.orders;
CREATE TRIGGER on_order_confirmed_award_loyalty
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed' AND NEW.gift_card_purchase_id IS NULL)
  EXECUTE FUNCTION public.trg_award_loyalty_on_confirm();

-- ── Redeem: atomic, row-locked, never below zero ──
CREATE OR REPLACE FUNCTION public.redeem_gift_card(
  p_code TEXT, p_amount NUMERIC, p_staff UUID, p_location UUID, p_note TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  g      RECORD;
  v_new  NUMERIC(10,2);
  v_tx   UUID;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount <> round(p_amount, 2) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'bad_amount');
  END IF;

  SELECT * INTO g FROM public.gift_cards WHERE code = p_code FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;
  IF g.status = 'void' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'void');
  END IF;
  IF g.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'expired', 'expires_at', g.expires_at);
  END IF;
  IF g.balance < p_amount THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient', 'balance', g.balance);
  END IF;

  v_new := g.balance - p_amount;
  UPDATE public.gift_cards SET balance = v_new WHERE id = g.id;
  INSERT INTO public.gift_card_transactions
    (gift_card_id, kind, amount, balance_after, location_id, staff_id, note)
  VALUES (g.id, 'redeem', p_amount, v_new, p_location, p_staff, nullif(left(btrim(coalesce(p_note, '')), 200), ''))
  RETURNING id INTO v_tx;

  RETURN jsonb_build_object('ok', true, 'amount', p_amount, 'balance', v_new, 'transaction_id', v_tx);
END;
$$;

-- ── Void: the remaining balance becomes unusable; recorded on the ledger ──
CREATE OR REPLACE FUNCTION public.void_gift_card(p_id UUID, p_staff UUID, p_reason TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  g RECORD;
BEGIN
  IF p_reason IS NULL OR char_length(btrim(p_reason)) < 3 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'reason_required');
  END IF;
  SELECT * INTO g FROM public.gift_cards WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;
  IF g.status = 'void' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_void');
  END IF;

  UPDATE public.gift_cards
     SET status = 'void', balance = 0, voided_at = now(), void_reason = left(btrim(p_reason), 200)
   WHERE id = g.id;
  INSERT INTO public.gift_card_transactions (gift_card_id, kind, amount, balance_after, staff_id, note)
  VALUES (g.id, 'void', g.balance, 0, p_staff, left(btrim(p_reason), 200));

  RETURN jsonb_build_object('ok', true, 'voided_balance', g.balance);
END;
$$;

REVOKE ALL ON FUNCTION public.gift_card_new_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.issue_gift_card(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_issue_gift_card_on_confirm() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.redeem_gift_card(TEXT, NUMERIC, UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.void_gift_card(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.issue_gift_card(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.redeem_gift_card(TEXT, NUMERIC, UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.void_gift_card(UUID, UUID, TEXT) TO service_role;

COMMENT ON TABLE public.gift_cards IS
  'Digital gift cards. Issued only by issue_gift_card() on a confirmed order; balance changes only via redeem_gift_card()/void_gift_card(). Service-role only.';
COMMENT ON TABLE public.gift_card_transactions IS
  'Gift card ledger: issue / redeem / void with balance_after, location, staff.';

NOTIFY pgrst, 'reload schema';
