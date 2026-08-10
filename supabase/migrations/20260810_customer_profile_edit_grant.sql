-- ============================================================
-- Customer profile self-edit — column-scoped UPDATE grant
-- ============================================================
-- Context: 20260804_loyalty_earning.sql did `REVOKE UPDATE ON customers
-- FROM anon, authenticated` to close a self-granting-points hole. That also
-- blocked customers from editing their OWN name/phone on /account (the
-- customer_update_self RLS policy existed but had no table privilege behind it).
--
-- Fix: grant UPDATE on ONLY the profile columns (never loyalty_points_balance,
-- lifetime_points_earned, loyalty_tier, total_*). Combined with the existing
-- customer_update_self policy (auth_user_id = auth.uid()), a signed-in customer
-- can edit only their own profile fields and can never touch points/tier.

GRANT UPDATE (first_name, last_name, phone) ON public.customers TO authenticated;
