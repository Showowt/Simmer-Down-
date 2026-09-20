-- ============================================================
-- Reservation / room-booking integrity — DB-level double-booking guards
-- Date: 2026-09-20
--
-- WHAT THIS FIXES
-- The 2026-09-17 dynamic-table release added `reservations.table_id` and the
-- 2026-09-18 estadía release added `room_bookings`, but NOTHING at the database
-- level stops two concurrent requests from taking the same table in the same
-- dining turn, or the same room on overlapping nights. The API guards
-- (/api/reservations, /api/room-bookings) read-then-write: between the SELECT
-- and the INSERT there is a window where two customers both see "free" and both
-- get a confirmation. This migration closes that window in Postgres, which is
-- the only place it can actually be closed.
--
-- HOW IT MATCHES THE APP
--   * src/lib/tables.ts  DINING_WINDOW_MINUTES = 120 and timesConflict() treat
--     two reservations as colliding when |startA - startB| < 120 minutes. That
--     is exactly "the 120-minute ranges [start, start+120) overlap", so a
--     tsrange EXCLUDE with '[)' bounds reproduces the app rule precisely.
--   * ACTIVE_STATUSES in /api/tables + /api/reservations = pending | confirmed |
--     seated. A cancelled reservation releases its table, so it is excluded.
--   * src/lib/rooms.ts  rangesOverlap() = inA < outB && inB < outA, i.e. a
--     half-open daterange '[)': same-day check-out / check-in does NOT collide.
--   * ACTIVE_ROOM_STATUSES in src/lib/rooms.ts = pending | confirmed | checked_in.
--
-- REAL SCHEMA (verified against production on 2026-09-20, not assumed)
--   reservations.date  = date  NOT NULL
--   reservations.time  = TEXT  NOT NULL   <-- text, not `time`; values are 'HH:MM'
--   reservations.status= text  NOT NULL, default 'confirmed'
--                        (live values: confirmed 38, seated 3, cancelled 1)
--   room_bookings.check_in / check_out = date NOT NULL
--   room_bookings.status = text NOT NULL, default 'pending'
--
-- WHY IT CANNOT FAIL ON EXISTING DATA
--   Verified on production 2026-09-20: reservations holds 42 rows and EVERY ONE
--   has table_id IS NULL (the floor-plan release never booked a table), so zero
--   rows fall inside the partial predicate `table_id is not null` and the index
--   is built over an empty set. room_bookings holds 0 rows. All 42 reservation
--   times match 'HH:MM', so the time-format CHECK added below validates clean.
--   The DO blocks below re-verify this at run time and abort with a readable
--   message instead of a raw constraint error if that ever stops being true.
--
-- ERROR SURFACED TO THE APP
--   A collision raises SQLSTATE 23P01 (exclusion_violation).
--   /api/reservations already maps 23P01/23505 -> HTTP 409.
--   /api/room-bookings does NOT yet map it (it returns 500) — see the note in
--   the handover; that route is owned by another workstream.
--
-- Idempotent: safe to re-run.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 0. btree_gist — needed so a uuid column can sit in a GiST
--    EXCLUDE next to a range. (tsrange/daterange themselves use
--    the built-in range_ops opclass and need no extension.)
--    Prefer the `extensions` schema Supabase reserves for this;
--    fall back to the default schema if it is absent.
-- ────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_extension where extname = 'btree_gist') then
    if exists (select 1 from pg_namespace where nspname = 'extensions') then
      execute 'create extension btree_gist with schema extensions';
    else
      execute 'create extension btree_gist';
    end if;
  end if;
end;
$$;

-- ────────────────────────────────────────────────────────────
-- 0b. Make the gist uuid operator class RESOLVABLE for the DDL below.
--     `EXCLUDE USING gist (table_id WITH =)` needs the DEFAULT gist opclass for
--     uuid (gist_uuid_ops, shipped by btree_gist). Postgres only considers
--     opclasses whose schema is on the search_path — an opclass in a schema
--     outside the path is invisible and the ALTER TABLE dies with
--     "data type uuid has no default operator class for access method gist".
--     Supabase's CLUSTER default search_path is '"$user", public'; `extensions`
--     is added by a per-ROLE setting, so whether it is present depends on which
--     role applies this file (SQL editor / CLI = postgres, which has it; a
--     Management-API or custom connection may not). Rather than assume, look up
--     where btree_gist actually landed and put that schema on the path.
--     is_local => false so this survives a file applied statement by statement
--     as well as one wrapped in a single transaction.
-- ────────────────────────────────────────────────────────────
do $$
declare
  v_schema text;
begin
  select n.nspname into v_schema
    from pg_extension e
    join pg_namespace n on n.oid = e.extnamespace
   where e.extname = 'btree_gist';

  if v_schema is null then
    raise exception
      '[20260920] btree_gist is not installed, so the uuid columns below cannot sit in a GiST EXCLUDE. Install it first: create extension btree_gist;';
  end if;

  if not (v_schema = any (current_schemas(true)::text[])) then
    perform set_config(
      'search_path',
      current_setting('search_path') || ', ' || quote_ident(v_schema),
      false
    );
    raise notice '[20260920] btree_gist lives in %; appended it to search_path so gist_uuid_ops resolves.', v_schema;
  else
    raise notice '[20260920] btree_gist found in % (already on search_path).', v_schema;
  end if;
end;
$$;

-- ════════════════════════════════════════════════════════════
-- 1. reservations — one table, one 120-minute dining turn
-- ════════════════════════════════════════════════════════════

-- 1a. Guarantee `time` is parseable before we build an expression on it.
--     reservations.time is TEXT. The only public writer is /api/reservations,
--     whose Zod schema (src/lib/validation.ts) enforces /^\d{2}:\d{2}$/. This
--     CHECK makes that contract a database fact, which in turn guarantees the
--     EXCLUDE expression below can never raise a cast error (22P02) on insert.
--     HH:MM and HH:MM:SS are both accepted; all 42 live rows are HH:MM.
do $$
declare
  v_bad int;
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.reservations'::regclass
      and conname  = 'reservations_time_format_chk'
  ) then
    raise notice '[20260920] reservations_time_format_chk already present — skipped.';
  else
    select count(*) into v_bad
      from public.reservations
     where "time" !~ '^[0-9]{1,2}:[0-9]{2}(:[0-9]{2})?$';

    if v_bad > 0 then
      raise exception
        '[20260920] % reservation row(s) have a time that is not HH:MM / HH:MM:SS. Clean them before adding reservations_time_format_chk.',
        v_bad;
    end if;

    alter table public.reservations
      add constraint reservations_time_format_chk
      check ("time" ~ '^[0-9]{1,2}:[0-9]{2}(:[0-9]{2})?$');

    raise notice '[20260920] reservations_time_format_chk added (% rows validated).',
      (select count(*) from public.reservations);
  end if;
end;
$$;

-- 1b. The exclusion constraint itself.
--     Every function in the index expression is IMMUTABLE by definition —
--     date::timestamp (date_timestamp), split_part, int4in, make_interval and
--     the tsrange constructor — so no "functions in index expression must be
--     marked IMMUTABLE" error, and NO fallback to a partial UNIQUE index is
--     needed. A text::time cast would NOT have worked here (time_in is only
--     STABLE), which is why the timestamp is assembled arithmetically.
--     "date" and "time" are quoted because both are bare type names to the
--     parser; quoting forces them to resolve as column references.
--     One deliberate difference from the app: because the range is built from a
--     real timestamp, a 23:00 booking also blocks 00:30 the NEXT day, which
--     timesConflict() (same-date only) does not. That is the correct answer for
--     a dining turn, it is unreachable at Simmer Down's service hours, and if it
--     ever fires the customer gets the normal 409 "pick another table", not a
--     silent double-booking.
do $$
declare
  v_scope int;
  v_conflicts int;
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.reservations'::regclass
      and conname  = 'reservations_table_slot_excl'
  ) then
    raise notice '[20260920] reservations_table_slot_excl already present — skipped.';
    return;
  end if;

  -- Rows that will actually be indexed. Expected: 0 (all 42 live rows have
  -- table_id null). Recorded so a human can see the blast radius in the log.
  select count(*) into v_scope
    from public.reservations
   where table_id is not null
     and status in ('pending', 'confirmed', 'seated');

  -- Pre-flight: would existing data already violate the rule? Fail with a
  -- readable message rather than an opaque constraint error.
  select count(*) into v_conflicts
    from public.reservations a
    join public.reservations b
      on b.id <> a.id
     and b.table_id = a.table_id
     and tsrange(
           a."date"::timestamp + make_interval(hours => split_part(a."time", ':', 1)::int,
                                               mins  => split_part(a."time", ':', 2)::int),
           a."date"::timestamp + make_interval(hours => split_part(a."time", ':', 1)::int,
                                               mins  => split_part(a."time", ':', 2)::int)
             + interval '120 minutes',
           '[)'
         )
         &&
         tsrange(
           b."date"::timestamp + make_interval(hours => split_part(b."time", ':', 1)::int,
                                               mins  => split_part(b."time", ':', 2)::int),
           b."date"::timestamp + make_interval(hours => split_part(b."time", ':', 1)::int,
                                               mins  => split_part(b."time", ':', 2)::int)
             + interval '120 minutes',
           '[)'
         )
     and b.status in ('pending', 'confirmed', 'seated')
   where a.table_id is not null
     and a.status in ('pending', 'confirmed', 'seated');

  if v_conflicts > 0 then
    raise exception
      '[20260920] % existing reservation pair(s) already double-book a table inside the 120-minute turn. Resolve them (cancel one side) before adding reservations_table_slot_excl.',
      v_conflicts;
  end if;

  alter table public.reservations
    add constraint reservations_table_slot_excl
    exclude using gist (
      table_id with =,
      (
        tsrange(
          "date"::timestamp + make_interval(hours => split_part("time", ':', 1)::int,
                                            mins  => split_part("time", ':', 2)::int),
          "date"::timestamp + make_interval(hours => split_part("time", ':', 1)::int,
                                            mins  => split_part("time", ':', 2)::int)
            + interval '120 minutes',
          '[)'
        )
      ) with &&
    )
    where (
      table_id is not null
      and status in ('pending', 'confirmed', 'seated')
    );

  raise notice '[20260920] reservations_table_slot_excl added (% row(s) in scope).', v_scope;
end;
$$;

comment on constraint reservations_table_slot_excl on public.reservations is
  'One table can hold only one active reservation per 120-minute dining turn. Mirrors DINING_WINDOW_MINUTES / timesConflict() in src/lib/tables.ts. Violations raise 23P01, mapped to HTTP 409 by /api/reservations.';

-- ════════════════════════════════════════════════════════════
-- 2. room_bookings — one room, no overlapping stays
-- ════════════════════════════════════════════════════════════
-- check_in / check_out are real `date` columns, so a plain daterange with '[)'
-- bounds is already immutable — no helper expression needed. '[)' means a stay
-- ending on the 14th and a stay starting on the 14th do NOT collide, which is
-- exactly rangesOverlap() in src/lib/rooms.ts.
do $$
declare
  v_scope int;
  v_conflicts int;
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.room_bookings'::regclass
      and conname  = 'room_bookings_room_stay_excl'
  ) then
    raise notice '[20260920] room_bookings_room_stay_excl already present — skipped.';
    return;
  end if;

  -- Expected: 0 — room_bookings held 0 rows on 2026-09-20.
  select count(*) into v_scope
    from public.room_bookings
   where room_id is not null
     and status in ('pending', 'confirmed', 'checked_in');

  select count(*) into v_conflicts
    from public.room_bookings a
    join public.room_bookings b
      on b.id <> a.id
     and b.room_id = a.room_id
     and daterange(a.check_in, a.check_out, '[)') && daterange(b.check_in, b.check_out, '[)')
     and b.status in ('pending', 'confirmed', 'checked_in')
   where a.room_id is not null
     and a.status in ('pending', 'confirmed', 'checked_in');

  if v_conflicts > 0 then
    raise exception
      '[20260920] % existing room-booking pair(s) already overlap on the same room. Resolve them before adding room_bookings_room_stay_excl.',
      v_conflicts;
  end if;

  alter table public.room_bookings
    add constraint room_bookings_room_stay_excl
    exclude using gist (
      room_id with =,
      (daterange(check_in, check_out, '[)')) with &&
    )
    where (
      room_id is not null
      and status in ('pending', 'confirmed', 'checked_in')
    );

  raise notice '[20260920] room_bookings_room_stay_excl added (% row(s) in scope).', v_scope;
end;
$$;

comment on constraint room_bookings_room_stay_excl on public.room_bookings is
  'One room cannot hold two active bookings whose [check_in, check_out) ranges overlap. Mirrors rangesOverlap() / ACTIVE_ROOM_STATUSES in src/lib/rooms.ts. Violations raise 23P01.';

-- ============================================================
-- VERIFICATION — paste into the Supabase SQL editor after running.
-- Expected: three rows, all three constraints present.
-- ============================================================
-- select c.conrelid::regclass as table_name,
--        c.conname,
--        c.contype,                      -- 'x' = exclusion, 'c' = check
--        pg_get_constraintdef(c.oid)     as definition
--   from pg_constraint c
--  where c.conname in (
--          'reservations_time_format_chk',
--          'reservations_table_slot_excl',
--          'room_bookings_room_stay_excl'
--        )
--  order by table_name, c.conname;
--
-- -- btree_gist must be installed:
-- select extname, extnamespace::regnamespace as schema
--   from pg_extension where extname = 'btree_gist';
--
-- -- Blast radius (both should still be 0 until tables/rooms start being booked):
-- select count(*) as reservations_holding_a_table
--   from public.reservations
--  where table_id is not null and status in ('pending','confirmed','seated');
-- select count(*) as active_room_bookings
--   from public.room_bookings
--  where room_id is not null and status in ('pending','confirmed','checked_in');
--
-- -- Live proof the guard bites (run inside a transaction, then ROLLBACK so
-- -- NOTHING is written to production and no Telegram fires):
-- -- begin;
-- --   insert into public.reservations (location_id, date, time, guest_count,
-- --                                    customer_name, customer_phone, status, table_id)
-- --   select 'santa-ana', current_date + 30, '19:00', 2, 'DB guard test', '0000', 'confirmed', t.id
-- --     from public.restaurant_tables t
-- --    where t.location_id = 'santa-ana' and t.is_active limit 1;
-- --   -- the second one must fail with SQLSTATE 23P01 (19:30 is inside the 120-min turn):
-- --   insert into public.reservations (location_id, date, time, guest_count,
-- --                                    customer_name, customer_phone, status, table_id)
-- --   select 'santa-ana', current_date + 30, '19:30', 2, 'DB guard test 2', '0000', 'confirmed', t.id
-- --     from public.restaurant_tables t
-- --    where t.location_id = 'santa-ana' and t.is_active limit 1;
-- -- rollback;
-- ============================================================
