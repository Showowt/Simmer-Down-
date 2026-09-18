-- ============================================================
-- Venue salón CMS — experience-first reservation areas
-- Owner-editable named areas (floor / view / VIP / photo) grouping tables.
-- Applies to all reservation venues. Adds reservation occasion capture.
-- ============================================================

create table if not exists public.venue_areas (
  id             uuid primary key default gen_random_uuid(),
  location_id    text not null,
  code           text not null,                 -- stable per-venue code (matches restaurant_tables.zone)
  name_es        text not null,
  name_en        text not null,
  description_es text,
  description_en text,
  floor          text,                          -- e.g. 'Planta Baja' / 'Planta Alta'
  view           text,                          -- e.g. 'Iglesia' / 'Parque' / 'Lago'
  is_vip         boolean not null default false,
  image_url      text,
  min_party      int,
  is_active      boolean not null default true,
  sort_order     int not null default 0,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  unique (location_id, code)
);
create index if not exists idx_venue_areas_location on public.venue_areas(location_id);

alter table public.restaurant_tables add column if not exists area_id uuid references public.venue_areas(id) on delete set null;
alter table public.reservations add column if not exists occasion text;

drop trigger if exists trg_venue_areas_updated_at on public.venue_areas;
create trigger trg_venue_areas_updated_at before update on public.venue_areas
  for each row execute function public.set_updated_at();

alter table public.venue_areas enable row level security;
drop policy if exists "venue_areas public read" on public.venue_areas;
create policy "venue_areas public read" on public.venue_areas for select using (true);
drop policy if exists "venue_areas admin write" on public.venue_areas;
create policy "venue_areas admin write" on public.venue_areas for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role='admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role='admin'));

-- 1. Backfill Simmer Garden: turn existing zones (M/J/T/BARRA) into named areas
insert into public.venue_areas (location_id, code, name_es, name_en, floor, sort_order, is_active)
select distinct t.location_id, t.zone,
  case t.zone when 'M' then 'Salón M' when 'J' then 'Salón J' when 'T' then 'Terraza' when 'BARRA' then 'Barra' else t.zone end,
  case t.zone when 'M' then 'Hall M' when 'J' then 'Hall J' when 'T' then 'Terrace' when 'BARRA' then 'Bar' else t.zone end,
  'Planta Baja',
  case t.zone when 'M' then 1 when 'J' then 2 when 'T' then 3 when 'BARRA' then 4 else 9 end,
  true
from public.restaurant_tables t
where t.location_id = 'simmer-garden'
on conflict (location_id, code) do nothing;

-- 2. Santa Ana areas (per client: planta baja, planta alta vista iglesia/parque, salas VIP)
insert into public.venue_areas (location_id, code, name_es, name_en, description_es, description_en, floor, view, is_vip, min_party, is_active, sort_order) values
  ('santa-ana','PB','Planta Baja','Ground Floor','Ambiente principal a nivel de calle.','Main dining at street level.','Planta Baja',null,false,null,true,1),
  ('santa-ana','IGLESIA','Planta Alta · Vista Iglesia','Upper Floor · Church View','Mesas en planta alta con vista a la Catedral.','Upstairs tables overlooking the Cathedral.','Planta Alta','Iglesia',false,null,true,2),
  ('santa-ana','PARQUE','Planta Alta · Vista Parque','Upper Floor · Park View','Mesas en planta alta con vista al parque.','Upstairs tables overlooking the park.','Planta Alta','Parque',false,null,true,3),
  ('santa-ana','VIP','Salas VIP','VIP Lounges','Espacios privados para grupos y ocasiones especiales.','Private spaces for groups and special occasions.','Planta Alta',null,true,4,true,4)
on conflict (location_id, code) do nothing;

-- 3. Starter areas for the remaining venues (hidden until the owner configures them)
insert into public.venue_areas (location_id, code, name_es, name_en, floor, is_active, sort_order) values
  ('lago-coatepeque','PB','Planta Baja','Ground Floor','Planta Baja',false,1),
  ('san-benito','PB','Planta Baja','Ground Floor','Planta Baja',false,1),
  ('surf-city','PB','Planta Baja','Ground Floor','Planta Baja',false,1)
on conflict (location_id, code) do nothing;

-- 4. Seed tables for the new areas (zone = area code)
insert into public.restaurant_tables (location_id, zone, code, label, seats, pos_x, pos_y, shape, is_active, sort_order) values
  ('santa-ana','PB','PB1','PB1',4,10,25,'square',true,0),
  ('santa-ana','PB','PB2','PB2',4,30,25,'square',true,1),
  ('santa-ana','PB','PB3','PB3',4,50,25,'square',true,2),
  ('santa-ana','PB','PB4','PB4',4,70,25,'square',true,3),
  ('santa-ana','PB','PB5','PB5',4,90,25,'square',true,4),
  ('santa-ana','PB','PB6','PB6',4,10,75,'square',true,5),
  ('santa-ana','PB','PB7','PB7',4,30,75,'square',true,6),
  ('santa-ana','PB','PB8','PB8',4,50,75,'square',true,7),
  ('santa-ana','PB','PB9','PB9',4,70,75,'square',true,8),
  ('santa-ana','PB','PB10','PB10',4,90,75,'square',true,9),
  ('santa-ana','IGLESIA','IG1','IG1',4,17,25,'square',true,10),
  ('santa-ana','IGLESIA','IG2','IG2',4,50,25,'square',true,11),
  ('santa-ana','IGLESIA','IG3','IG3',4,83,25,'square',true,12),
  ('santa-ana','IGLESIA','IG4','IG4',4,17,75,'square',true,13),
  ('santa-ana','IGLESIA','IG5','IG5',4,50,75,'square',true,14),
  ('santa-ana','IGLESIA','IG6','IG6',4,83,75,'square',true,15),
  ('santa-ana','PARQUE','PQ1','PQ1',4,17,25,'square',true,16),
  ('santa-ana','PARQUE','PQ2','PQ2',4,50,25,'square',true,17),
  ('santa-ana','PARQUE','PQ3','PQ3',4,83,25,'square',true,18),
  ('santa-ana','PARQUE','PQ4','PQ4',4,17,75,'square',true,19),
  ('santa-ana','PARQUE','PQ5','PQ5',4,50,75,'square',true,20),
  ('santa-ana','PARQUE','PQ6','PQ6',4,83,75,'square',true,21),
  ('santa-ana','VIP','V1','V1',6,17,50,'rect',true,22),
  ('santa-ana','VIP','V2','V2',6,50,50,'rect',true,23),
  ('santa-ana','VIP','V3','V3',6,83,50,'rect',true,24),
  ('lago-coatepeque','PB','PB1','PB1',4,13,25,'square',false,25),
  ('lago-coatepeque','PB','PB2','PB2',4,38,25,'square',false,26),
  ('lago-coatepeque','PB','PB3','PB3',4,63,25,'square',false,27),
  ('lago-coatepeque','PB','PB4','PB4',4,88,25,'square',false,28),
  ('lago-coatepeque','PB','PB5','PB5',4,13,75,'square',false,29),
  ('lago-coatepeque','PB','PB6','PB6',4,38,75,'square',false,30),
  ('lago-coatepeque','PB','PB7','PB7',4,63,75,'square',false,31),
  ('lago-coatepeque','PB','PB8','PB8',4,88,75,'square',false,32),
  ('san-benito','PB','PB1','PB1',4,10,25,'square',false,33),
  ('san-benito','PB','PB2','PB2',4,30,25,'square',false,34),
  ('san-benito','PB','PB3','PB3',4,50,25,'square',false,35),
  ('san-benito','PB','PB4','PB4',4,70,25,'square',false,36),
  ('san-benito','PB','PB5','PB5',4,90,25,'square',false,37),
  ('san-benito','PB','PB6','PB6',4,10,75,'square',false,38),
  ('san-benito','PB','PB7','PB7',4,30,75,'square',false,39),
  ('san-benito','PB','PB8','PB8',4,50,75,'square',false,40),
  ('san-benito','PB','PB9','PB9',4,70,75,'square',false,41),
  ('san-benito','PB','PB10','PB10',4,90,75,'square',false,42),
  ('surf-city','PB','PB1','PB1',4,13,25,'square',false,43),
  ('surf-city','PB','PB2','PB2',4,38,25,'square',false,44),
  ('surf-city','PB','PB3','PB3',4,63,25,'square',false,45),
  ('surf-city','PB','PB4','PB4',4,88,25,'square',false,46),
  ('surf-city','PB','PB5','PB5',4,13,75,'square',false,47),
  ('surf-city','PB','PB6','PB6',4,38,75,'square',false,48),
  ('surf-city','PB','PB7','PB7',4,63,75,'square',false,49),
  ('surf-city','PB','PB8','PB8',4,88,75,'square',false,50)
on conflict (location_id, code) do nothing;

-- 5. Link every table to its area by (location_id, zone = area.code)
update public.restaurant_tables t
set area_id = a.id
from public.venue_areas a
where a.location_id = t.location_id and a.code = t.zone and t.area_id is null;
