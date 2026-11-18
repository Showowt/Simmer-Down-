-- ============================================================
-- Ticket types: one event, several prices
-- (e.g. Los Iracundos — Preferencial $45 + VIP Dinner $75)
--
-- Until now an on-site sale had ONE price (events.ticket_price) and
-- events.ticket_tiers was display-only (shows sold on another platform).
-- Now ticket_tiers also drives on-site sales:
--
--   events.ticket_tiers      the event's ticket types. Each element is
--                            {id, name, name_en, description, description_en,
--                             price, capacity, active}, normalised by the
--                            trigger below on every write.
--   events.ticket_tier_sold  seats sold per type, {type id: seats}. Written
--                            only by issue_event_tickets — the editor never
--                            sends it, so an open admin tab can't overwrite it.
--   orders.ticket_lines      what the buyer chose, priced by the server at
--                            checkout: [{tier_id, name, unit_price, quantity}].
--   event_tickets            one QR per ticket type in an order (line_no),
--                            carrying tier_id + tier_name for the door.
--
-- Single-price events keep working unchanged: no types = ticket_price.
-- The certified PowerTranz routes are untouched (they charge
-- orders.total_amount, which the checkout route computes server-side).
-- ============================================================

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS ticket_tier_sold JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS ticket_lines JSONB;

ALTER TABLE public.event_tickets
  ADD COLUMN IF NOT EXISTS tier_id   TEXT,
  ADD COLUMN IF NOT EXISTS tier_name TEXT,
  ADD COLUMN IF NOT EXISTS line_no   INTEGER NOT NULL DEFAULT 0;

-- An order can now own several ticket rows (one per type). The new unique
-- key keeps issuance idempotent and still indexes lookups by order_id.
ALTER TABLE public.event_tickets DROP CONSTRAINT IF EXISTS event_tickets_order_id_key;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_tickets_order_line_key') THEN
    ALTER TABLE public.event_tickets
      ADD CONSTRAINT event_tickets_order_line_key UNIQUE (order_id, line_no);
  END IF;
END $$;

-- ── Ticket types: validate + normalise every write ───────────
CREATE OR REPLACE FUNCTION public.normalize_event_ticket_tiers()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_in     jsonb := COALESCE(NEW.ticket_tiers, '[]'::jsonb);
  v_old    jsonb := '[]'::jsonb;
  v_out    jsonb := '[]'::jsonb;
  v_t      jsonb;
  v_prev   jsonb;
  v_id     text;
  v_name   text;
  v_price  numeric;
  v_cap    integer;
  v_active boolean;
  v_ids    text[] := ARRAY[]::text[];
  v_names  text[] := ARRAY[]::text[];
  v_min    numeric;
BEGIN
  IF TG_OP = 'UPDATE' AND jsonb_typeof(OLD.ticket_tiers) = 'array' THEN
    v_old := OLD.ticket_tiers;
  END IF;
  IF jsonb_typeof(v_in) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Los tipos de boleto no tienen un formato válido.';
  END IF;

  FOR v_t IN SELECT e.value FROM jsonb_array_elements(v_in) AS e(value) LOOP
    CONTINUE WHEN jsonb_typeof(v_t) IS DISTINCT FROM 'object';
    v_name := left(btrim(COALESCE(v_t->>'name', '')), 60);
    CONTINUE WHEN v_name = '';             -- blank rows are dropped

    IF lower(v_name) = ANY (v_names) THEN
      RAISE EXCEPTION 'Hay dos tipos de boleto llamados «%». Usa un nombre distinto para cada uno.', v_name;
    END IF;
    v_names := v_names || lower(v_name);

    -- Keep the id the editor sent. An editor opened before ticket types
    -- existed sends only {name, price}: match it to the stored type by name,
    -- so the id (which the sold count is keyed by) and the fields that old
    -- editor doesn't know about (description, cupo, active) survive the save.
    v_id := NULLIF(btrim(COALESCE(v_t->>'id', '')), '');
    IF v_id IS NULL THEN
      v_prev := NULL;
      SELECT o.value INTO v_prev
        FROM jsonb_array_elements(v_old) AS o(value)
       WHERE lower(btrim(COALESCE(o.value->>'name', ''))) = lower(v_name)
         AND NOT (COALESCE(o.value->>'id', '') = ANY (v_ids))
       LIMIT 1;
      IF v_prev IS NOT NULL THEN
        v_id := NULLIF(v_prev->>'id', '');
        v_t := v_prev || v_t;              -- what the old editor sent wins
      END IF;
    END IF;
    IF v_id IS NULL THEN
      v_id := 't' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 11);
    END IF;
    IF v_id !~ '^[A-Za-z0-9_-]{1,40}$' THEN
      RAISE EXCEPTION 'Tipo de boleto con identificador inválido. Recarga la página e intenta de nuevo.';
    END IF;
    IF v_id = ANY (v_ids) THEN
      RAISE EXCEPTION 'Tipo de boleto repetido. Recarga la página e intenta de nuevo.';
    END IF;
    v_ids := v_ids || v_id;

    BEGIN
      v_price := round(COALESCE(NULLIF(v_t->>'price', ''), '0')::numeric, 2);
    EXCEPTION WHEN others THEN
      RAISE EXCEPTION 'El precio de «%» no es un número válido.', v_name;
    END;
    IF v_price < 0 OR v_price > 10000 THEN
      RAISE EXCEPTION 'El precio de «%» debe estar entre $0 y $10,000.', v_name;
    END IF;

    v_cap := NULL;
    IF NULLIF(v_t->>'capacity', '') IS NOT NULL THEN
      BEGIN
        v_cap := (v_t->>'capacity')::numeric::integer;
      EXCEPTION WHEN others THEN
        RAISE EXCEPTION 'El cupo de «%» debe ser un número entero.', v_name;
      END;
      IF v_cap < 0 OR v_cap > 100000 THEN
        RAISE EXCEPTION 'El cupo de «%» no es válido.', v_name;
      END IF;
    END IF;

    v_active := CASE WHEN jsonb_typeof(v_t->'active') = 'boolean' THEN (v_t->'active')::boolean ELSE true END;

    v_out := v_out || jsonb_build_array(jsonb_build_object(
      'id',             v_id,
      'name',           v_name,
      'name_en',        NULLIF(left(btrim(COALESCE(v_t->>'name_en', '')), 60), ''),
      'description',    NULLIF(left(btrim(COALESCE(v_t->>'description', '')), 160), ''),
      'description_en', NULLIF(left(btrim(COALESCE(v_t->>'description_en', '')), 160), ''),
      'price',          v_price,
      'capacity',       v_cap,
      'active',         v_active
    ));
  END LOOP;

  IF jsonb_array_length(v_out) > 12 THEN
    RAISE EXCEPTION 'Máximo 12 tipos de boleto por evento.';
  END IF;

  NEW.ticket_tiers := v_out;

  -- The one price everything else shows ("desde $X", Google, La Llamita):
  -- the cheapest type on sale.
  IF NEW.tickets_enabled AND jsonb_array_length(v_out) > 0 THEN
    SELECT min((t.value->>'price')::numeric) INTO v_min
      FROM jsonb_array_elements(v_out) AS t(value)
     WHERE (t.value->>'price')::numeric > 0 AND (t.value->>'active')::boolean;
    IF v_min IS NULL THEN
      SELECT min((t.value->>'price')::numeric) INTO v_min
        FROM jsonb_array_elements(v_out) AS t(value)
       WHERE (t.value->>'price')::numeric > 0;
    END IF;
    IF v_min IS NOT NULL THEN
      NEW.ticket_price := v_min;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS events_normalize_ticket_tiers ON public.events;
CREATE TRIGGER events_normalize_ticket_tiers
  BEFORE INSERT OR UPDATE OF ticket_tiers, tickets_enabled ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.normalize_event_ticket_tiers();

-- ── Issuance: one QR per ticket type, idempotent, capacity-aware ──
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
      v_amount  := CASE WHEN v_legacy THEN o.total_amount
                        ELSE round(COALESCE(v_unit, 0) * v_qty, 2) END;
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
         unit_price, total_amount, oversold, tier_id, tier_name, line_no)
      VALUES
        (o.id, o.event_id, v_token, v_qty, o.customer_name, o.customer_phone,
         v_unit, v_amount, v_over, v_tier_id,
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

-- Same lockdown as 20261116_ticket_loyalty_rpc_lockdown: the confirm trigger
-- (SECURITY DEFINER, owned by postgres) is the only caller.
REVOKE EXECUTE ON FUNCTION public.issue_event_tickets(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.issue_event_tickets(uuid) TO service_role;

NOTIFY pgrst, 'reload schema';
