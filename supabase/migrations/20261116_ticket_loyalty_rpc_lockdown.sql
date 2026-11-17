-- ============================================================
-- Lock down the SECURITY DEFINER functions behind tickets + loyalty.
--
-- Postgres grants EXECUTE to PUBLIC by default and Supabase adds explicit
-- anon/authenticated grants, so all three were callable from the browser via
-- POST /rest/v1/rpc/<fn> with the public anon key:
--   issue_event_tickets(order_id)        issued a ticket for an UNPAID pending
--                                        order and returned its QR token (the
--                                        order id comes back from the public
--                                        /api/events/tickets/create) = free
--                                        tickets. Verified on prod Nov 16 in a
--                                        rolled-back probe.
--   award_order_loyalty_points(order_id) awarded points for unpaid pending
--                                        orders = free SimmerLovers points.
--   check_in_ticket(token, staff)        let anyone holding a QR mark it used.
--
-- Legitimate callers keep working: the two order triggers are SECURITY
-- DEFINER owned by postgres (they call these functions as postgres), and the
-- door check-in API calls check_in_ticket with the service-role client.
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.issue_event_tickets(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.award_order_loyalty_points(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_in_ticket(text, uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.issue_event_tickets(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.award_order_loyalty_points(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_in_ticket(text, uuid) TO service_role;

NOTIFY pgrst, 'reload schema';
