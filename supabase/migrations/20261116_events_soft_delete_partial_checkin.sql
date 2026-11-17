-- ============================================================
-- 1) Events: soft delete.
--
-- orders.event_id and event_tickets.event_id reference events with no ON
-- DELETE rule, so any event someone ever started a ticket checkout for could
-- not be deleted ("Error al eliminar el evento" — Dying Fetus had one
-- abandoned checkout). Hard-deleting would also orphan payment records, and a
-- 3DS payment still in flight could confirm an order whose event is gone.
--
-- Deleting is now an UPDATE done by DELETE /api/admin/events: it stamps
-- deleted_at, unpublishes, stops sales and frees the slug. Events with sold
-- tickets are refused there (the buyers hold valid QR codes).
-- ============================================================
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Anonymous visitors can never read a deleted event, even if it is re-published.
DROP POLICY IF EXISTS public_read_published_events ON public.events;
CREATE POLICY public_read_published_events ON public.events
  FOR SELECT USING (is_published = true AND deleted_at IS NULL);

-- ============================================================
-- 2) Door check-in v2: partial admission.
--
-- A 3-ticket QR used to admit all 3 on the first scan, so friends arriving
-- separately were turned away as "ya fue usado". p_count admits part of the
-- ticket; NULL keeps the old behaviour (admit everything still remaining).
-- status stays 'valid' until admitted_count reaches quantity.
-- checked_in_at / checked_in_by record the most recent admission.
-- ============================================================
DROP FUNCTION IF EXISTS public.check_in_ticket(text, uuid);

CREATE FUNCTION public.check_in_ticket(p_token text, p_staff uuid, p_count integer DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tk          RECORD;
  v_remaining integer;
  v_admit     integer;
  v_total     integer;
BEGIN
  SELECT * INTO tk FROM public.event_tickets WHERE qr_token = p_token FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;
  IF tk.status = 'void' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'void');
  END IF;

  v_remaining := tk.quantity - tk.admitted_count;
  IF tk.status = 'used' OR v_remaining <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_used',
      'admitted', tk.admitted_count, 'quantity', tk.quantity,
      'checked_in_at', tk.checked_in_at);
  END IF;

  IF p_count IS NOT NULL AND p_count < 1 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'bad_count');
  END IF;

  v_admit := LEAST(COALESCE(p_count, v_remaining), v_remaining);
  v_total := tk.admitted_count + v_admit;

  UPDATE public.event_tickets
     SET admitted_count = v_total,
         status         = CASE WHEN v_total >= tk.quantity THEN 'used' ELSE 'valid' END,
         checked_in_at  = now(),
         checked_in_by  = p_staff
   WHERE id = tk.id;

  RETURN jsonb_build_object('ok', true,
    'admitted', v_admit,
    'admitted_total', v_total,
    'quantity', tk.quantity,
    'remaining', tk.quantity - v_total);
END;
$$;

-- Same lockdown as 20261116_ticket_loyalty_rpc_lockdown: service role only.
REVOKE EXECUTE ON FUNCTION public.check_in_ticket(text, uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_in_ticket(text, uuid, integer) TO service_role;

NOTIFY pgrst, 'reload schema';
