-- ============================================================
-- Ticket service fee ("cargo por servicio"), shown apart from the price.
--
-- Simmer Manía artists are paid the full door price (taquilla); Simmer Down
-- adds a percentage on top (13% today): $5.00 + $0.65 = $5.65. Until now
-- staff typed the sum ($5.65) as the ticket price, so buyers saw a number
-- that didn't match the poster ("COVER $5.00"). Now:
--
--   events.ticket_fee_percent        % added on top of every ticket's price
--   orders.ticket_lines[*].unit_fee  the fee per ticket, fixed at checkout
--   event_tickets.unit_fee           snapshot for receipts and the artist's
--                                    report. unit_price stays the ticket's
--                                    own price (taquilla); total_amount is
--                                    what the buyer paid.
--
-- Events with no fee (0, the default) behave exactly as before.
-- ============================================================

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS ticket_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'events_ticket_fee_percent_check') THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_ticket_fee_percent_check
      CHECK (ticket_fee_percent >= 0 AND ticket_fee_percent <= 100);
  END IF;
END $$;

ALTER TABLE public.event_tickets
  ADD COLUMN IF NOT EXISTS unit_fee NUMERIC(10,2);

-- Same function as 20261118_event_ticket_types, plus the per-ticket fee.
CREATE OR REPLACE FUNCTION public.issue_event_tickets(p_order_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  o          RECORD;
  ev         RECORD;
  v_lines    jsonb;
  v_line     jsonb;
  v_legacy   boolean := false;
  v_first    text;
  v_token    text;
  v_qty      integer;
  v_total    integer := 0;
  v_unit     numeric;
  v_fee      numeric;
  v_amount   numeric;
  v_tier_id  text;
  v_tier     jsonb;
  v_cap      integer;
  v_sold     jsonb;
  v_tier_now integer;
  v_over_ev  boolean;
  v_over     boolean;
  v_no       integer := 0;
BEGIN
  SELECT id, event_id, ticket_quantity, ticket_lines, status, total_amount,
         customer_name, customer_phone
    INTO o FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND OR o.event_id IS NULL THEN
    RETURN NULL;                       -- not a ticket order
  END IF;
  IF o.status IN ('cancelled','refunded') THEN
    RETURN NULL;
  END IF;

  -- Lock the event row first: issuance and the sold counters are serialised
  -- per event, so concurrent confirmations can't double-count.
  SELECT id, has_capacity_limit, max_capacity, tickets_sold, ticket_price,
         ticket_tiers, ticket_tier_sold
    INTO ev FROM public.events WHERE id = o.event_id FOR UPDATE;

  -- Idempotent: an order issues its tickets exactly once.
  SELECT qr_token INTO v_first FROM public.event_tickets
   WHERE order_id = p_order_id ORDER BY line_no LIMIT 1;
  IF v_first IS NOT NULL THEN
    RETURN v_first;
  END IF;

  IF jsonb_typeof(o.ticket_lines) = 'array' AND jsonb_array_length(o.ticket_lines) > 0 THEN
    v_lines := o.ticket_lines;
  ELSE
    -- Orders created before ticket types existed: one ticket at the event price.
    v_legacy := true;
    v_lines := jsonb_build_array(jsonb_build_object(
      'tier_id', NULL, 'name', NULL,
      'unit_price', ev.ticket_price,
      'quantity', GREATEST(1, COALESCE(o.ticket_quantity, 1))));
  END IF;

  SELECT COALESCE(sum(GREATEST(1, COALESCE((l.value->>'quantity')::integer, 1))), 0)
    INTO v_total FROM jsonb_array_elements(v_lines) AS l(value);

  -- The customer already paid: tickets are always honoured, an oversell is
  -- flagged for staff (event-wide cupo or the type's own cupo).
  v_over_ev := COALESCE(ev.has_capacity_limit, false) AND ev.max_capacity IS NOT NULL
               AND ev.tickets_sold + v_total > ev.max_capacity;
  v_sold := CASE WHEN jsonb_typeof(ev.ticket_tier_sold) = 'object'
                 THEN ev.ticket_tier_sold ELSE '{}'::jsonb END;

  BEGIN
    FOR v_line IN SELECT l.value FROM jsonb_array_elements(v_lines) AS l(value) LOOP
      v_qty     := GREATEST(1, COALESCE((v_line->>'quantity')::integer, 1));
      v_unit    := NULLIF(v_line->>'unit_price', '')::numeric;
      v_fee     := COALESCE(NULLIF(v_line->>'unit_fee', '')::numeric, 0);
      v_amount  := CASE WHEN v_legacy THEN o.total_amount
                        ELSE round((COALESCE(v_unit, 0) + v_fee) * v_qty, 2) END;
      v_tier_id := NULLIF(v_line->>'tier_id', '');
      v_over    := v_over_ev;

      IF v_tier_id IS NOT NULL THEN
        v_tier := NULL;
        SELECT t.value INTO v_tier
          FROM jsonb_array_elements(COALESCE(ev.ticket_tiers, '[]'::jsonb)) AS t(value)
         WHERE t.value->>'id' = v_tier_id
         LIMIT 1;
        v_tier_now := COALESCE((v_sold->>v_tier_id)::integer, 0);
        v_cap := NULLIF(v_tier->>'capacity', '')::integer;
        IF v_cap IS NOT NULL AND v_tier_now + v_qty > v_cap THEN
          v_over := true;
        END IF;
        v_sold := jsonb_set(v_sold, ARRAY[v_tier_id], to_jsonb(v_tier_now + v_qty), true);
      END IF;

      v_token := replace(gen_random_uuid()::text, '-', '')
               || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.event_tickets
        (order_id, event_id, qr_token, quantity, buyer_name, buyer_phone,
         unit_price, unit_fee, total_amount, oversold, tier_id, tier_name, line_no)
      VALUES
        (o.id, o.event_id, v_token, v_qty, o.customer_name, o.customer_phone,
         v_unit, CASE WHEN v_legacy THEN NULL ELSE v_fee END, v_amount, v_over, v_tier_id,
         NULLIF(left(btrim(COALESCE(v_line->>'name', '')), 60), ''), v_no);
      IF v_first IS NULL THEN
        v_first := v_token;
      END IF;
      v_no := v_no + 1;
    END LOOP;
  EXCEPTION WHEN unique_violation THEN
    -- A concurrent issue for this order won the race; return its first ticket.
    SELECT qr_token INTO v_first FROM public.event_tickets
     WHERE order_id = p_order_id ORDER BY line_no LIMIT 1;
    RETURN v_first;
  END;

  UPDATE public.events
     SET tickets_sold     = tickets_sold + v_total,
         ticket_tier_sold = v_sold,
         updated_at       = now()
   WHERE id = o.event_id;

  RETURN v_first;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.issue_event_tickets(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.issue_event_tickets(uuid) TO service_role;

NOTIFY pgrst, 'reload schema';
