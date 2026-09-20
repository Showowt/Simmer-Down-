-- ============================================================
-- Public read = launched rows only (venue_areas, restaurant_tables, guest_rooms)
-- Date: 2026-09-20
--
-- WHAT THIS FIXES
-- The 2026-09-17/18/19 releases shipped three tables whose anon SELECT policy is
-- `using (true)`. Anyone holding the publishable anon key — which is in the
-- browser bundle of simmerdownsv.com — can therefore read rows the client has
-- NOT launched. Verified against production on 2026-09-20 with the anon key:
--   venue_areas       -> 3 inactive areas leak (lago-coatepeque, san-benito,
--                        surf-city), i.e. unannounced venue plans.
--   restaurant_tables -> 26 inactive tables leak at those same three venues.
--   guest_rooms       -> all 3 inactive rooms leak WITH their draft nightly
--                        rates ($89 / $69 / $139), which the owner has not
--                        published and may still change.
-- Draft pricing and unlaunched locations are the client's to announce, not the
-- anon key's to hand out.
--
-- WHY THIS IS SAFE FOR THE LIVE SITE
-- Every read of these three tables goes through a Next.js route handler that
-- uses createServiceClient() (verified 2026-09-20 in src/app/api/tables/route.ts,
-- src/app/api/rooms/route.ts, src/app/api/reservations/route.ts,
-- src/app/api/room-bookings/route.ts and every src/app/api/admin/* route).
-- The service role carries BYPASSRLS, so none of those reads change behaviour.
-- No client component queries these tables with the anon key, and all four
-- public routes already filter `.eq("is_active", true)` themselves — this
-- migration only makes the database enforce what the API already does.
--
-- STAFF ACCESS IS NOT REVOKED
-- src/app/admin/reservations/page.tsx reads restaurant_tables with the signed-in
-- browser client (not the service role) to label a reservation's table. The
-- existing "* admin write" FOR ALL policies only cover profiles.role = 'admin',
-- so a 'manager' / 'staff' session would have lost sight of deactivated rows.
-- An explicit staff SELECT policy (public.is_staff — the same helper used by
-- 20260810_reservations_staff_rls.sql and 20260808_event_tickets.sql) keeps the
-- full, unfiltered view for anyone on the staff roster.
--
-- DELIBERATELY NOT TOUCHED
--   loyalty_rewards  — /simmerlovers reads it with the anon key; tightening it
--                      would blank the rewards page.
--   reservations     — already staff-only (20260810_reservations_staff_rls.sql).
--   room_bookings    — already admin-only (20260918_room_reservations.sql).
--   Every "* admin write" policy is left exactly as it is.
--
-- Idempotent: drop-then-create by name, safe to re-run.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. venue_areas — hide unlaunched areas from the anon key
-- ────────────────────────────────────────────────────────────
drop policy if exists "venue_areas public read" on public.venue_areas;
create policy "venue_areas public read" on public.venue_areas
  for select using (is_active = true);

drop policy if exists "venue_areas staff read" on public.venue_areas;
create policy "venue_areas staff read" on public.venue_areas
  for select using (public.is_staff(array['admin', 'manager', 'staff']));

-- ────────────────────────────────────────────────────────────
-- 2. restaurant_tables — hide unlaunched / retired tables
-- ────────────────────────────────────────────────────────────
drop policy if exists "restaurant_tables public read" on public.restaurant_tables;
create policy "restaurant_tables public read" on public.restaurant_tables
  for select using (is_active = true);

drop policy if exists "restaurant_tables staff read" on public.restaurant_tables;
create policy "restaurant_tables staff read" on public.restaurant_tables
  for select using (public.is_staff(array['admin', 'manager', 'staff']));

-- ────────────────────────────────────────────────────────────
-- 3. guest_rooms — hide unpublished rooms AND their draft rates
-- ────────────────────────────────────────────────────────────
drop policy if exists "guest_rooms public read" on public.guest_rooms;
create policy "guest_rooms public read" on public.guest_rooms
  for select using (is_active = true);

drop policy if exists "guest_rooms staff read" on public.guest_rooms;
create policy "guest_rooms staff read" on public.guest_rooms
  for select using (public.is_staff(array['admin', 'manager', 'staff']));

-- ────────────────────────────────────────────────────────────
-- 4. Prove the leak is actually closed, at apply time.
--    RLS policies are OR'd: rewriting the three "public read" policies only
--    helps if NO OTHER permissive SELECT/ALL policy on these tables still says
--    `using (true)`. This repo has form here — 20260423_security_hardening.sql
--    had to drop three differently-named legacy policies off one table, and
--    this database carries an rls_auto_enable() helper that can mint policies
--    outside any migration. So assert it instead of assuming it: fail the
--    migration with the offending policy names rather than report a security
--    fix that silently did nothing.
--    Scoped to policies the anon/authenticated key can actually use: the
--    "* admin write" FOR ALL policies are not flagged (their USING is an
--    `exists (...)` on profiles, not `true`), and a `TO service_role ... using
--    (true)` policy is not a leak either — service_role already has BYPASSRLS.
-- ────────────────────────────────────────────────────────────
do $$
declare
  v_leaks text;
begin
  select string_agg(format('%s."%s"', tablename, policyname), ', ' order by tablename, policyname)
    into v_leaks
    from pg_policies
   where schemaname = 'public'
     and tablename in ('venue_areas', 'restaurant_tables', 'guest_rooms')
     and permissive = 'PERMISSIVE'
     and cmd in ('SELECT', 'ALL')
     and roles && array['public', 'anon', 'authenticated']::name[]
     and coalesce(qual, 'true') = 'true';

  if v_leaks is not null then
    raise exception
      '[20260920b] Still wide open — these permissive policies expose every row to any role: %. Drop or tighten them, then re-run; until then the anon key can read unlaunched venues and draft nightly rates.',
      v_leaks;
  end if;

  raise notice '[20260920b] verified: no blanket SELECT policy remains on venue_areas / restaurant_tables / guest_rooms.';
end;
$$;

-- ============================================================
-- VERIFICATION — paste into the Supabase SQL editor after running.
-- ============================================================
-- -- 1. Policy shape: the three "public read" rows must now read
-- --    `(is_active = true)`, and each table must have a "staff read" row.
-- select tablename, policyname, cmd, qual
--   from pg_policies
--  where schemaname = 'public'
--    and tablename in ('venue_areas', 'restaurant_tables', 'guest_rooms')
--  order by tablename, policyname;
--
-- -- 2. What the anon key can still see, simulated in-database.
-- --    Expected: 0 inactive rows on all three, and the live counts unchanged
-- --    (santa-ana + simmer-garden areas/tables, 0 active guest_rooms today).
-- begin;
--   set local role anon;
--   select 'venue_areas'       as t, count(*) filter (where not is_active) as inactive_visible, count(*) as total_visible from public.venue_areas
--   union all
--   select 'restaurant_tables',      count(*) filter (where not is_active),        count(*)        from public.restaurant_tables
--   union all
--   select 'guest_rooms',            count(*) filter (where not is_active),        count(*)        from public.guest_rooms;
--   -- must return no rows: no draft nightly rate is reachable anonymously
--   select code, price_per_night from public.guest_rooms where not is_active;
-- rollback;
--
-- -- 3. Live site smoke test (GET only — never POST to these endpoints):
-- --    curl -s 'https://simmerdownsv.com/api/tables?location_id=santa-ana&date=2026-09-25&time=19:00' | head -c 400
-- --    curl -s 'https://simmerdownsv.com/api/rooms?location_id=lago-coatepeque'                        | head -c 400
-- --    /api/tables must still return santa-ana's 4 areas / 25 tables.
-- ============================================================
