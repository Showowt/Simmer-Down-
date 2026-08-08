-- ============================================================
-- Native paid event tickets
-- Reuses the CERTIFIED PowerTranz pipeline untouched: a ticket purchase
-- is an orders row marked with event_id. When that order transitions to
-- 'confirmed' (the same point the loyalty trigger fires), a trigger issues
-- the ticket atomically — so the payment/3DS routes need no changes.
-- ============================================================

-- ── orders: mark ticket purchases ────────────────────────────
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS event_id        UUID REFERENCES public.events(id),
  ADD COLUMN IF NOT EXISTS ticket_quantity INTEGER;

-- ── events: ticketing config ─────────────────────────────────
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS tickets_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ticket_price    NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS tickets_sold    INTEGER NOT NULL DEFAULT 0;

-- ── event_tickets: one issued record per purchase (carries its QR) ──
CREATE TABLE IF NOT EXISTS public.event_tickets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID NOT NULL UNIQUE REFERENCES public.orders(id),
  event_id       UUID NOT NULL REFERENCES public.events(id),
  qr_token       TEXT NOT NULL UNIQUE,
  quantity       INTEGER NOT NULL CHECK (quantity >= 1),
  admitted_count INTEGER NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'valid'
                   CHECK (status IN ('valid', 'used', 'void')),
  buyer_name     TEXT,
  buyer_phone    TEXT,
  unit_price     NUMERIC(10,2),
  total_amount   NUMERIC(10,2),
  oversold       BOOLEAN NOT NULL DEFAULT false,
  issued_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  checked_in_at  TIMESTAMPTZ,
  checked_in_by  UUID
);

CREATE INDEX IF NOT EXISTS idx_event_tickets_event ON public.event_tickets (event_id);
CREATE INDEX IF NOT EXISTS idx_event_tickets_token ON public.event_tickets (qr_token);

ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;

-- Ticket lookups happen through service-role APIs (the token IS the capability).
-- Staff may read/update for door check-in. No anon/public access.
DROP POLICY IF EXISTS event_tickets_service ON public.event_tickets;
CREATE POLICY event_tickets_service ON public.event_tickets
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS event_tickets_staff_read ON public.event_tickets;
CREATE POLICY event_tickets_staff_read ON public.event_tickets
  FOR SELECT USING (public.is_staff(ARRAY['admin','manager','staff']));

REVOKE INSERT, UPDATE, DELETE ON public.event_tickets FROM anon, authenticated;

-- ── Issuance: atomic, idempotent, capacity-aware ─────────────
CREATE OR REPLACE FUNCTION public.issue_event_tickets(p_order_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  o        RECORD;
  ev       RECORD;
  v_token  text;
  v_qty    int;
  v_over   boolean := false;
BEGIN
  SELECT id, event_id, ticket_quantity, status, total_amount, customer_name, customer_phone
    INTO o FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND OR o.event_id IS NULL THEN
    RETURN NULL;                       -- not a ticket order
  END IF;
  IF o.status IN ('cancelled','refunded') THEN
    RETURN NULL;
  END IF;

  -- Idempotent: an order issues exactly one ticket record, ever.
  SELECT qr_token INTO v_token FROM public.event_tickets WHERE order_id = p_order_id;
  IF v_token IS NOT NULL THEN
    RETURN v_token;
  END IF;

  v_qty := GREATEST(1, COALESCE(o.ticket_quantity, 1));

  -- Lock the event row so the sold count increments atomically.
  SELECT id, has_capacity_limit, max_capacity, tickets_sold, ticket_price
    INTO ev FROM public.events WHERE id = o.event_id FOR UPDATE;

  IF ev.has_capacity_limit AND ev.max_capacity IS NOT NULL
     AND ev.tickets_sold + v_qty > ev.max_capacity THEN
    -- Customer already paid — honor the ticket, flag the rare oversell for staff.
    v_over := true;
  END IF;

  v_token := replace(gen_random_uuid()::text, '-', '')
           || replace(gen_random_uuid()::text, '-', '');

  BEGIN
    INSERT INTO public.event_tickets
      (order_id, event_id, qr_token, quantity, buyer_name, buyer_phone,
       unit_price, total_amount, oversold)
    VALUES
      (o.id, o.event_id, v_token, v_qty, o.customer_name, o.customer_phone,
       ev.ticket_price, o.total_amount, v_over);
  EXCEPTION WHEN unique_violation THEN
    -- Concurrent issue won the race; return the existing token.
    SELECT qr_token INTO v_token FROM public.event_tickets WHERE order_id = p_order_id;
    RETURN v_token;
  END;

  UPDATE public.events
    SET tickets_sold = tickets_sold + v_qty, updated_at = now()
    WHERE id = o.event_id;

  RETURN v_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_issue_tickets_on_confirm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.event_id IS NOT NULL THEN
    PERFORM public.issue_event_tickets(NEW.id);
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[tickets] issue failed for order %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_confirmed_issue_tickets ON public.orders;
CREATE TRIGGER on_order_confirmed_issue_tickets
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed' AND NEW.event_id IS NOT NULL)
  EXECUTE FUNCTION public.trg_issue_tickets_on_confirm();

-- Staff check-in: idempotent admit, prevents silent double-entry.
CREATE OR REPLACE FUNCTION public.check_in_ticket(p_token text, p_staff uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tk RECORD;
BEGIN
  SELECT * INTO tk FROM public.event_tickets WHERE qr_token = p_token FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;
  IF tk.status = 'void' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'void');
  END IF;
  IF tk.status = 'used' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_used',
      'admitted', tk.admitted_count, 'quantity', tk.quantity,
      'checked_in_at', tk.checked_in_at);
  END IF;

  UPDATE public.event_tickets
    SET status = 'used',
        admitted_count = tk.quantity,
        checked_in_at = now(),
        checked_in_by = p_staff
    WHERE id = tk.id;

  RETURN jsonb_build_object('ok', true, 'admitted', tk.quantity,
    'quantity', tk.quantity);
END;
$$;
