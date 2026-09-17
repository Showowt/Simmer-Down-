-- ============================================================
-- Estadía — room reservations for Lago de Coatepeque
-- Date-range booking (check-in/check-out nights), reserve-request model.
-- ============================================================

create table if not exists public.guest_rooms (
  id              uuid primary key default gen_random_uuid(),
  location_id     text not null default 'lago-coatepeque',
  code            text not null,
  name            text not null,
  name_es         text not null,
  description     text,
  description_es  text,
  capacity        int  not null default 2,
  price_per_night numeric,
  image_url       text,
  amenities       text[] not null default '{}',
  is_active       boolean not null default true,
  sort_order      int  not null default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (location_id, code)
);

create index if not exists idx_guest_rooms_location on public.guest_rooms(location_id);

create table if not exists public.room_bookings (
  id              uuid primary key default gen_random_uuid(),
  room_id         uuid references public.guest_rooms(id) on delete set null,
  location_id     text not null default 'lago-coatepeque',
  check_in        date not null,
  check_out       date not null,
  nights          int,
  guest_count     int  not null default 1,
  customer_name   text not null,
  customer_phone  text not null,
  customer_email  text,
  special_requests text,
  status          text not null default 'pending',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  constraint room_bookings_dates_chk check (check_out > check_in)
);

create index if not exists idx_room_bookings_room_dates on public.room_bookings(room_id, check_in, check_out);
create index if not exists idx_room_bookings_location on public.room_bookings(location_id, check_in);

drop trigger if exists trg_guest_rooms_updated_at on public.guest_rooms;
create trigger trg_guest_rooms_updated_at before update on public.guest_rooms
  for each row execute function public.set_updated_at();
drop trigger if exists trg_room_bookings_updated_at on public.room_bookings;
create trigger trg_room_bookings_updated_at before update on public.room_bookings
  for each row execute function public.set_updated_at();

alter table public.guest_rooms enable row level security;
drop policy if exists "guest_rooms public read" on public.guest_rooms;
create policy "guest_rooms public read" on public.guest_rooms for select using (true);
drop policy if exists "guest_rooms admin write" on public.guest_rooms;
create policy "guest_rooms admin write" on public.guest_rooms for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role='admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role='admin'));

alter table public.room_bookings enable row level security;
drop policy if exists "room_bookings admin all" on public.room_bookings;
create policy "room_bookings admin all" on public.room_bookings for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role='admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role='admin'));

insert into public.guest_rooms (location_id, code, name, name_es, description, description_es, capacity, price_per_night, amenities, is_active, sort_order) values
  ('lago-coatepeque','H1','Lake View Room','Habitación Vista al Lago','Double room with a private balcony over the lake.','Habitación doble con balcón privado sobre el lago.',2,89,'{"WiFi","A/C","Vista al lago","Baño privado"}',false,1),
  ('lago-coatepeque','H2','Garden Room','Habitación Jardín','Cozy room opening onto the garden.','Habitación acogedora con salida al jardín.',2,69,'{"WiFi","A/C","Jardín","Baño privado"}',false,2),
  ('lago-coatepeque','H3','Family Suite','Suite Familiar','Spacious suite for up to 4 guests.','Suite amplia para hasta 4 huéspedes.',4,139,'{"WiFi","A/C","Vista al lago","Sala","Baño privado"}',false,3)
on conflict (location_id, code) do nothing;
