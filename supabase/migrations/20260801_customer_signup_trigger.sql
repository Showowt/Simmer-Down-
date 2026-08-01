-- ============================================================
-- Customer signup trigger — D016 fix
-- Signup's client-side INSERT into customers was blocked by RLS
-- (no session until email confirmation) and silently swallowed,
-- so no signup ever created a loyalty record (customers was empty).
-- Server-side trigger creates the row regardless of session state.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fn text := btrim(COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
BEGIN
  INSERT INTO public.customers (
    auth_user_id, email, phone, first_name, last_name,
    loyalty_tier, loyalty_points_balance, lifetime_points_earned
  ) VALUES (
    NEW.id,
    NEW.email,
    NULLIF(btrim(COALESCE(NEW.raw_user_meta_data->>'phone', '')), ''),
    NULLIF(split_part(fn, ' ', 1), ''),
    NULLIF(btrim(substr(fn, length(split_part(fn, ' ', 1)) + 1)), ''),
    'bronze', 50, 50
  )
  ON CONFLICT (auth_user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- A customers failure must never abort auth signup
  RAISE WARNING '[handle_new_auth_user] customers insert failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
