-- ============================================================
-- Loyalty earn rate — settings.loyalty_points_per_dollar goes live
-- The owner has been able to set "Puntos por $1 gastado" from
-- /admin/premios since 20260917b, but nothing ever read that value:
-- award_order_loyalty_points() always computed
--   floor(total_amount × tier_multiplier)
-- so the control was decorative. This redefines ONLY the points
-- computation of that function — idempotency (uq_loyalty_earn_per_order),
-- customer matching and tier promotion are copied unchanged from
-- 20260804_loyalty_earning.sql.
-- New rate: floor(total_amount × points_per_dollar × tier_multiplier)
-- points_per_dollar falls back to 1 when the setting is missing, unreadable
-- or negative, so with the current setting (1) behaviour is byte-identical to
-- today. An explicit 0 IS honoured: that is the owner pausing accrual from
-- /admin/premios (the function then returns 'zero_points' and, as always,
-- never blocks the order).
-- ============================================================

insert into public.settings (key, value)
select 'loyalty_points_per_dollar', '1'::jsonb
where not exists (select 1 from public.settings where key = 'loyalty_points_per_dollar');

CREATE OR REPLACE FUNCTION public.award_order_loyalty_points(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  o RECORD;
  c public.customers%ROWTYPE;
  v_digits text;
  v_multiplier numeric;
  v_per_dollar numeric;
  v_points int;
  v_new_balance int;
  v_new_lifetime int;
  v_config_tier public.loyalty_tier;
  v_final_tier public.loyalty_tier;
BEGIN
  SELECT id, order_number, status, total_amount, customer_id, customer_phone
    INTO o FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('awarded', false, 'reason', 'order_not_found');
  END IF;
  IF o.status IN ('cancelled', 'refunded') THEN
    RETURN jsonb_build_object('awarded', false, 'reason', 'order_' || o.status);
  END IF;

  IF o.customer_id IS NOT NULL THEN
    SELECT * INTO c FROM public.customers WHERE id = o.customer_id FOR UPDATE;
  END IF;
  IF c.id IS NULL THEN
    v_digits := right(regexp_replace(coalesce(o.customer_phone, ''), '\D', '', 'g'), 8);
    IF length(v_digits) = 8 THEN
      SELECT * INTO c FROM public.customers
       WHERE right(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 8) = v_digits
       ORDER BY created_at ASC
       LIMIT 1
       FOR UPDATE;
    END IF;
  END IF;
  IF c.id IS NULL THEN
    RETURN jsonb_build_object('awarded', false, 'reason', 'no_customer_match');
  END IF;

  SELECT coalesce(points_multiplier, 1) INTO v_multiplier
    FROM public.loyalty_tier_config WHERE tier = c.loyalty_tier;
  -- Owner-set base rate (settings.loyalty_points_per_dollar). btrim() so a
  -- value stored as a JSON string ("1.5") parses like a JSON number (1.5).
  -- The regex guard is deliberate: a cast that raised here would be swallowed
  -- by trg_award_loyalty_on_confirm, silently costing a paying customer their
  -- points forever. A malformed value falls back to 1 instead.
  SELECT CASE
           WHEN btrim(value::text, '"') ~ '^[0-9]+(\.[0-9]+)?$'
             THEN btrim(value::text, '"')::numeric
           ELSE NULL
         END
    INTO v_per_dollar
    FROM public.settings WHERE key = 'loyalty_points_per_dollar';
  -- Missing / malformed / negative → documented default of 1. An explicit 0 is
  -- the owner switching accrual off, so it is left alone.
  IF v_per_dollar IS NULL OR v_per_dollar < 0 THEN
    v_per_dollar := 1;
  END IF;
  v_points := floor(coalesce(o.total_amount, 0) * v_per_dollar * coalesce(v_multiplier, 1))::int;
  IF v_points <= 0 THEN
    RETURN jsonb_build_object('awarded', false, 'reason', 'zero_points');
  END IF;

  v_new_balance  := coalesce(c.loyalty_points_balance, 0) + v_points;
  v_new_lifetime := coalesce(c.lifetime_points_earned, 0) + v_points;

  BEGIN
    INSERT INTO public.loyalty_transactions
      (customer_id, transaction_type, points, balance_after, order_id, description)
    VALUES
      (c.id, 'earned', v_points, v_new_balance, o.id,
       'Pedido #' || coalesce(o.order_number, left(o.id::text, 8)));
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('awarded', false, 'reason', 'already_awarded');
  END;

  SELECT tier INTO v_config_tier FROM public.loyalty_tier_config
   WHERE min_lifetime_points <= v_new_lifetime
   ORDER BY min_lifetime_points DESC
   LIMIT 1;
  -- Tiers never downgrade (enum order: bronze < silver < gold < platinum)
  v_final_tier := CASE
    WHEN v_config_tier IS NOT NULL AND v_config_tier > c.loyalty_tier THEN v_config_tier
    ELSE c.loyalty_tier
  END;

  UPDATE public.customers SET
    loyalty_points_balance = v_new_balance,
    lifetime_points_earned = v_new_lifetime,
    loyalty_tier = v_final_tier,
    updated_at = now()
  WHERE id = c.id;

  RETURN jsonb_build_object(
    'awarded', true, 'points', v_points,
    'balance', v_new_balance, 'tier', v_final_tier
  );
END;
$$;
