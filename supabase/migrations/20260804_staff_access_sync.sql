-- ============================================================
-- Staff onboarding guardrail
-- The admin panel needs THREE things aligned or it silently locks
-- staff out: staff.user_id (RLS policy checks it), staff.auth_user_id
-- (requireStaff checks it), and profiles.role='admin' (layout +
-- middleware gate). Humans forget; this trigger makes one insert enough.
-- ============================================================

CREATE OR REPLACE FUNCTION public.sync_staff_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.user_id := coalesce(NEW.user_id, NEW.auth_user_id);
  NEW.auth_user_id := coalesce(NEW.auth_user_id, NEW.user_id);
  IF NEW.is_active AND NEW.auth_user_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, role)
    VALUES (NEW.auth_user_id, 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_staff_sync_access ON public.staff;
CREATE TRIGGER on_staff_sync_access
  BEFORE INSERT OR UPDATE ON public.staff
  FOR EACH ROW EXECUTE FUNCTION public.sync_staff_access();
