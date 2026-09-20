-- ============================================================
-- 2026-09-20c — Estadía: record what the guest was quoted, and
--               let the owner write English amenities.
--
-- Why: room_bookings stored no rate and no total, so the "$89/noche"
-- shown on /estadia was never persisted anywhere — staff confirmed
-- stays with no amount on the row and no amount in the Telegram.
-- guest_rooms had no English amenities column while the public card
-- renders amenities for EN visitors.
--
-- Safe to run on production: additive only, no data rewritten.
-- Apply this BEFORE deploying the code that writes these columns.
-- ============================================================

-- Rate read from guest_rooms at request time (server-authoritative,
-- never sent by the client) and the resulting stay total.
alter table public.room_bookings
  add column if not exists price_per_night numeric;

alter table public.room_bookings
  add column if not exists total_amount numeric;

comment on column public.room_bookings.price_per_night is
  'Nightly rate read from guest_rooms.price_per_night when the request was made. Never client-supplied.';
comment on column public.room_bookings.total_amount is
  'price_per_night * nights at request time. Quote only — staff collect at check-in.';

-- English amenities, mirroring the existing Spanish `amenities` array.
-- Empty array = fall back to the Spanish list on the public page.
alter table public.guest_rooms
  add column if not exists amenities_en text[] not null default '{}';

comment on column public.guest_rooms.amenities_en is
  'English amenities. Empty = the public EN page falls back to `amenities` (ES).';
