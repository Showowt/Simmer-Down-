-- ============================================================
-- Reservations RLS — lock to staff
-- Was: admin_read_all USING (auth.role() = 'authenticated') — ANY signed-in
-- customer could read every reservation's PII (name/phone/email). Restrict
-- reads to staff, and add a staff UPDATE so the admin log can confirm/cancel.
-- Inserts stay service-role (the /api/reservations route); service_role_all
-- keeps full access.
-- ============================================================

DROP POLICY IF EXISTS admin_read_all ON public.reservations;

DROP POLICY IF EXISTS staff_read_reservations ON public.reservations;
CREATE POLICY staff_read_reservations ON public.reservations
  FOR SELECT USING (public.is_staff(ARRAY['admin', 'manager', 'staff']));

DROP POLICY IF EXISTS staff_update_reservations ON public.reservations;
CREATE POLICY staff_update_reservations ON public.reservations
  FOR UPDATE USING (public.is_staff(ARRAY['admin', 'manager']));
