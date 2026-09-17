-- ============================================================
-- Dynamic table reservations — restaurant floor plan
-- Adds per-table booking to the existing reservations flow.
-- Venue #1: Simmer Garden (location_id 'simmer-garden') — zones M/J/T/BARRA
-- ============================================================

-- 1. Restaurant tables (DB as source of truth so staff can manage/block them)
create table if not exists public.restaurant_tables (
  id          uuid primary key default gen_random_uuid(),
  location_id text not null,
  zone        text not null,                       -- 'M' | 'J' | 'T' | 'BARRA'
  code        text not null,                       -- 'M1', 'J7', 'T4', 'B1'
  label       text not null,
  seats       int  not null default 4,
  pos_x       numeric not null default 50,         -- 0..100 %, left within the zone canvas
  pos_y       numeric not null default 50,         -- 0..100 %, top within the zone canvas
  shape       text not null default 'square',      -- 'square' | 'rect'
  is_blocked  boolean not null default false,      -- manual staff hold (maintenance / VIP / walk-in)
  is_active   boolean not null default true,
  sort_order  int  not null default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (location_id, code)
);

create index if not exists idx_restaurant_tables_location on public.restaurant_tables(location_id);

-- 2. Link reservations to a specific table (nullable — venues without a floor plan keep working)
alter table public.reservations add column if not exists table_id uuid references public.restaurant_tables(id) on delete set null;
alter table public.reservations add column if not exists zone text;

create index if not exists idx_reservations_table_date on public.reservations(table_id, date);
create index if not exists idx_reservations_location_date on public.reservations(location_id, date);

-- 3. updated_at trigger for restaurant_tables (reuse existing helper if present)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_restaurant_tables_updated_at on public.restaurant_tables;
create trigger trg_restaurant_tables_updated_at
  before update on public.restaurant_tables
  for each row execute function public.set_updated_at();

-- 4. RLS: tables are public-readable (floor plan is public), writes restricted to service role / admins
alter table public.restaurant_tables enable row level security;

drop policy if exists "restaurant_tables public read" on public.restaurant_tables;
create policy "restaurant_tables public read"
  on public.restaurant_tables for select
  using (true);

drop policy if exists "restaurant_tables admin write" on public.restaurant_tables;
create policy "restaurant_tables admin write"
  on public.restaurant_tables for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- 5. Seed Simmer Garden floor plan (idempotent)
insert into public.restaurant_tables (location_id, zone, code, label, seats, pos_x, pos_y, shape, sort_order) values
  ('simmer-garden','M','M1','M1',4,12,20,'square',0),
  ('simmer-garden','M','M2','M2',4,12,50,'square',1),
  ('simmer-garden','M','M3','M3',4,12,80,'square',2),
  ('simmer-garden','M','M4','M4',4,37,20,'square',3),
  ('simmer-garden','M','M5','M5',4,37,50,'square',4),
  ('simmer-garden','M','M6','M6',4,37,80,'square',5),
  ('simmer-garden','M','M7','M7',4,62,20,'square',6),
  ('simmer-garden','M','M8','M8',4,62,50,'square',7),
  ('simmer-garden','M','M9','M9',4,62,80,'square',8),
  ('simmer-garden','M','M10','M10',4,87,20,'square',9),
  ('simmer-garden','M','M11','M11',4,87,50,'square',10),
  ('simmer-garden','M','M12','M12',4,87,80,'square',11),
  ('simmer-garden','J','J1','J1',4,12,20,'square',12),
  ('simmer-garden','J','J2','J2',4,12,50,'square',13),
  ('simmer-garden','J','J3','J3',4,12,80,'square',14),
  ('simmer-garden','J','J4','J4',4,37,20,'square',15),
  ('simmer-garden','J','J5','J5',4,37,50,'square',16),
  ('simmer-garden','J','J6','J6',4,37,80,'square',17),
  ('simmer-garden','J','J7','J7',4,62,20,'square',18),
  ('simmer-garden','J','J8','J8',4,62,50,'square',19),
  ('simmer-garden','J','J9','J9',4,62,80,'square',20),
  ('simmer-garden','J','J10','J10',4,87,20,'square',21),
  ('simmer-garden','J','J11','J11',4,87,50,'square',22),
  ('simmer-garden','J','J12','J12',4,87,80,'square',23),
  ('simmer-garden','T','T1','T1',4,10,32,'square',24),
  ('simmer-garden','T','T2','T2',4,30,32,'square',25),
  ('simmer-garden','T','T3','T3',4,50,32,'square',26),
  ('simmer-garden','T','T4','T4',4,70,32,'square',27),
  ('simmer-garden','T','T5','T5',4,90,32,'square',28),
  ('simmer-garden','T','T6','T6',4,10,75,'square',29),
  ('simmer-garden','T','T7','T7',4,30,75,'square',30),
  ('simmer-garden','T','T8','T8',4,50,75,'square',31),
  ('simmer-garden','T','T9','T9',4,70,75,'square',32),
  ('simmer-garden','T','T10','T10',4,90,75,'square',33),
  ('simmer-garden','BARRA','B1','B1',2,12,20,'rect',34),
  ('simmer-garden','BARRA','B2','B2',2,12,50,'rect',35),
  ('simmer-garden','BARRA','B3','B3',2,12,80,'rect',36),
  ('simmer-garden','BARRA','B4','B4',2,37,20,'rect',37),
  ('simmer-garden','BARRA','B5','B5',2,37,50,'rect',38),
  ('simmer-garden','BARRA','B6','B6',2,37,80,'rect',39),
  ('simmer-garden','BARRA','B7','B7',2,62,20,'rect',40),
  ('simmer-garden','BARRA','B8','B8',2,62,50,'rect',41),
  ('simmer-garden','BARRA','B9','B9',2,62,80,'rect',42),
  ('simmer-garden','BARRA','B10','B10',2,87,20,'rect',43),
  ('simmer-garden','BARRA','B11','B11',2,87,50,'rect',44),
  ('simmer-garden','BARRA','B12','B12',2,87,80,'rect',45)
on conflict (location_id, code) do nothing;
