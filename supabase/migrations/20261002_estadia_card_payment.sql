-- ============================================================
-- 2026-10-02 — Estadía: online card payment (certified rail reuse)
--
-- Why: /estadia was reserve-request only ("confirmamos por WhatsApp") — it
-- never charged. Client (Grupo Kase / Martin) asked for the charge to happen
-- at booking. This wires stays through the SAME certified PowerTranz pipeline
-- as event tickets: a stay = an `orders` row marked with `room_booking_id`.
-- When that order reaches 'confirmed' (ISO 00, same point loyalty/tickets fire)
-- a trigger flips the linked room_booking to 'confirmed'. The payment/3DS
-- routes need ZERO changes, so nothing certified is touched.
--
-- Hold model: the guest's booking is created as `pending_payment` BEFORE the
-- card is charged, so the room is reserved during the 3DS window (a race loser
-- fails here, before any money moves). Abandoned holds are swept after 15 min
-- in the app layer (see /api/room-bookings/checkout and /api/rooms).
--
-- Safe on production: additive column + index; the exclusion constraint is only
-- WIDENED to also cover 'pending_payment' (no such rows exist yet, so it cannot
-- conflict with current data). Apply this BEFORE deploying the code.
-- ============================================================

-- 1. Mark lodging orders ───────────────────────────────────────
alter table public.orders
  add column if not exists room_booking_id uuid references public.room_bookings(id);

create index if not exists idx_orders_room_booking
  on public.orders(room_booking_id);

comment on column public.orders.room_booking_id is
  'Set when this order pays for an estadía (room_bookings row). The confirm trigger flips that booking to confirmed. Mutually exclusive with event_id in practice.';

-- 2. Let a 'pending_payment' hold reserve the room during 3DS ──
--    The exclusion constraint from 20260920 only covered
--    ('pending','confirmed','checked_in'). A card hold must also block, so we
--    widen the predicate. DROP + ADD because a partial-index predicate cannot
--    be altered in place.
do $$
declare
  v_conflicts int;
begin
  if not exists (select 1 from pg_extension where extname = 'btree_gist') then
    raise exception '[20261002] btree_gist missing — run 20260920 first.';
  end if;

  -- Re-check overlap under the NEW (wider) active set before re-adding. No
  -- 'pending_payment' rows exist yet, so this equals the 20260920 scope, but
  -- fail loud rather than add a constraint the data would violate.
  select count(*) into v_conflicts
    from public.room_bookings a
    join public.room_bookings b
      on b.id <> a.id
     and b.room_id = a.room_id
     and daterange(a.check_in, a.check_out, '[)') && daterange(b.check_in, b.check_out, '[)')
     and b.status in ('pending', 'confirmed', 'checked_in', 'pending_payment')
   where a.room_id is not null
     and a.status in ('pending', 'confirmed', 'checked_in', 'pending_payment');

  if v_conflicts > 0 then
    raise exception
      '[20261002] % overlapping active room-booking pair(s) — resolve before widening room_bookings_room_stay_excl.',
      v_conflicts;
  end if;

  alter table public.room_bookings
    drop constraint if exists room_bookings_room_stay_excl;

  alter table public.room_bookings
    add constraint room_bookings_room_stay_excl
    exclude using gist (
      room_id with =,
      (daterange(check_in, check_out, '[)')) with &&
    )
    where (
      room_id is not null
      and status in ('pending', 'confirmed', 'checked_in', 'pending_payment')
    );

  raise notice '[20261002] room_bookings_room_stay_excl widened to include pending_payment.';
end;
$$;

comment on constraint room_bookings_room_stay_excl on public.room_bookings is
  'One room cannot hold two active bookings whose [check_in, check_out) ranges overlap. Active = pending|confirmed|checked_in|pending_payment. Mirrors rangesOverlap()/ACTIVE_ROOM_STATUSES in src/lib/rooms.ts. Violations raise 23P01.';

-- 3. Confirm the stay when its order is paid ───────────────────
--    Mirrors trg_issue_tickets_on_confirm: idempotent, never blocks the order
--    status change. pending_payment -> confirmed keeps the same held slot, so
--    the exclusion constraint cannot fire on this flip.
create or replace function public.trg_confirm_booking_on_confirm()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.room_booking_id is not null then
    update public.room_bookings
       set status = 'confirmed', updated_at = now()
     where id = new.room_booking_id
       and status not in ('confirmed', 'checked_in', 'cancelled', 'refunded');
  end if;
  return new;
exception when others then
  raise warning '[estadia] confirm booking failed for order %: %', new.id, sqlerrm;
  return new;
end;
$$;

drop trigger if exists on_order_confirmed_confirm_booking on public.orders;
create trigger on_order_confirmed_confirm_booking
  after insert or update of status on public.orders
  for each row
  when (new.status = 'confirmed' and new.room_booking_id is not null)
  execute function public.trg_confirm_booking_on_confirm();

-- ============================================================
-- VERIFICATION (paste into the Supabase SQL editor after running):
--   select pg_get_constraintdef(oid) from pg_constraint
--     where conname = 'room_bookings_room_stay_excl';          -- includes pending_payment
--   select tgname from pg_trigger
--     where tgname = 'on_order_confirmed_confirm_booking';     -- 1 row
--   select column_name from information_schema.columns
--     where table_name='orders' and column_name='room_booking_id';  -- 1 row
-- ============================================================
