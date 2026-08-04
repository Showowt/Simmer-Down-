-- ============================================================
-- Loyalty earning loop — points awarded on order confirmation
-- Orders never earned points before this: SimmerLovers members
-- got the 50 welcome points and then nothing ever accrued.
-- One choke point: a trigger on orders' transition to 'confirmed'
-- (payment callback sets it for card orders, staff set it for
-- WhatsApp orders) so every app path awards identically.
-- Rate: $1 = 1 point × the member's current tier multiplier
-- (loyalty_tier_config). Customer resolution: orders.customer_id
-- when present, else phone match on the last 8 digits (SV format).
-- ============================================================

-- Hard guard: an order can earn exactly once, ever.
CREATE UNIQUE INDEX IF NOT EXISTS uq_loyalty_earn_per_order
  ON public.loyalty_transactions (order_id)
  WHERE transaction_type = 'earned' AND order_id IS NOT NULL;

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
  v_points := floor(coalesce(o.total_amount, 0) * coalesce(v_multiplier, 1))::int;
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

CREATE OR REPLACE FUNCTION public.trg_award_loyalty_on_confirm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.award_order_loyalty_points(NEW.id);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Loyalty must never block an order status change
  RAISE WARNING '[loyalty] award failed for order %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_confirmed_award_loyalty ON public.orders;
CREATE TRIGGER on_order_confirmed_award_loyalty
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed')
  EXECUTE FUNCTION public.trg_award_loyalty_on_confirm();

-- Guardrail: loyalty balances are written ONLY by SECURITY DEFINER functions
-- and the service role. The old client-side redeem updated its own balance
-- via customer_update_self RLS — a self-granting-points hole. No client code
-- updates customers directly anymore (redeem goes through /api/loyalty/redeem).
REVOKE UPDATE ON public.customers FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.loyalty_transactions FROM anon, authenticated;
