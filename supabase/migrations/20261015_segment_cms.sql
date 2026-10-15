-- ============================================================
-- Segment CMS — owner-editable content for the brand pages
-- (client PDF "ACTUALIZACIONES PAG WEB", Oct 2026)
--
--   segment_items   → products / services / gallery photos for
--                     Cortes Premium, El Maridaje Perfecto,
--                     Hospitality and Merch (3 categories)
--   location_media  → owner-editable cover / hero / gallery photos
--                     per restaurant location (Ubicaciones)
--   settings seeds  → careers (Trabaja con Nosotros) + historia_stats
--                     (Nuestra Historia numbers, now editable)
--
-- Same owner-editable pattern as venue_areas / guest_rooms:
-- public read of active rows, admin-role write, service-client CRUD.
-- ============================================================

-- ── segment_items ───────────────────────────────────────────
create table if not exists public.segment_items (
  id             uuid primary key default gen_random_uuid(),
  segment        text not null check (segment in ('cortes','maridaje','hospitality','merch')),
  -- merch: 'camisetas' | 'gorras-accesorios' | 'ediciones-limitadas'
  -- hospitality: 'servicio' | 'galeria'
  category       text,
  name_es        text not null,
  name_en        text not null default '',
  description_es text,
  description_en text,
  price          numeric(10,2) check (price is null or (price >= 0 and price <= 100000)),
  image_url      text,
  is_active      boolean not null default true,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_segment_items_segment on public.segment_items(segment, is_active, sort_order);

drop trigger if exists trg_segment_items_updated_at on public.segment_items;
create trigger trg_segment_items_updated_at before update on public.segment_items
  for each row execute function public.set_updated_at();

alter table public.segment_items enable row level security;
drop policy if exists "segment_items public read" on public.segment_items;
create policy "segment_items public read" on public.segment_items for select using (is_active);
drop policy if exists "segment_items admin write" on public.segment_items;
create policy "segment_items admin write" on public.segment_items for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role='admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role='admin'));

-- ── location_media ──────────────────────────────────────────
create table if not exists public.location_media (
  id          uuid primary key default gen_random_uuid(),
  location_id text not null,
  kind        text not null check (kind in ('cover','hero','gallery')),
  image_url   text not null,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_location_media_location on public.location_media(location_id, kind, is_active, sort_order);
-- one cover and one hero per location (gallery is unlimited)
create unique index if not exists uq_location_media_single
  on public.location_media(location_id, kind) where kind in ('cover','hero');

drop trigger if exists trg_location_media_updated_at on public.location_media;
create trigger trg_location_media_updated_at before update on public.location_media
  for each row execute function public.set_updated_at();

alter table public.location_media enable row level security;
drop policy if exists "location_media public read" on public.location_media;
create policy "location_media public read" on public.location_media for select using (is_active);
drop policy if exists "location_media admin write" on public.location_media;
create policy "location_media admin write" on public.location_media for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role='admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role='admin'));

-- ── settings seeds ──────────────────────────────────────────
-- Careers page (Trabaja con Nosotros): Google Forms link + intro + team photos.
insert into public.settings (key, value) values
  ('careers', jsonb_build_object(
    'form_url', null,
    'intro_es', 'En Simmer Down creemos en crecer juntos. Muchos de nuestros gerentes empezaron como meseros. Si compartes nuestra pasión por el fuego, el sabor y las buenas vibras, queremos conocerte.',
    'intro_en', 'At Simmer Down we believe in growing together. Many of our managers started as servers. If you share our passion for fire, flavor and good vibes, we want to meet you.',
    'photos', '[]'::jsonb
  ))
on conflict (key) do nothing;

-- Nuestra Historia stats — real public numbers (Google network audit Oct 2026:
-- 5,535 reviews / 4.6 average across the 6 listings), now owner-editable.
insert into public.settings (key, value) values
  ('historia_stats', jsonb_build_object(
    'years', 12,
    'locations', 5,
    'reviews', 5500,
    'stars', 4.6
  ))
on conflict (key) do nothing;

-- ── seed segment items (only on a virgin table) ─────────────
-- Mirrors today's static cards so the pages look identical but become editable.
-- Inactive examples show the owner how maridaje / merch entries work.
insert into public.segment_items (segment, category, name_es, name_en, description_es, description_en, price, is_active, sort_order)
select * from (values
  ('cortes', null, 'Coulotte y Tuétano', 'Coulotte & Marrow',
    'Nuestro molcajete de coulotte con tuétano asado, jugoso y lleno de sabor.',
    'Our coulotte molcajete with roasted marrow — juicy and full of flavor.', null::numeric, true, 1),
  ('cortes', null, 'Medallón de Lomito', 'Beef Medallion',
    'Medallón de lomito al maître, tierno y sellado a la parrilla.',
    'Maître-style beef medallion — tender and grill-seared.', null, true, 2),
  ('cortes', null, 'Selección del Chef', 'Chef''s Selection',
    'Cortes rotativos según disponibilidad. Pregunta por el corte del día.',
    'Rotating cuts by availability. Ask for the cut of the day.', null, true, 3),
  ('maridaje', null, 'Vino Tinto de la Casa', 'House Red Wine',
    'Ejemplo — edita o agrega tus vinos y bebidas en el panel de administración.',
    'Example — edit or add your wines and drinks in the admin panel.', null, false, 1),
  ('hospitality', 'servicio', 'Eventos Privados', 'Private Events',
    'Cumpleaños, empresas y celebraciones con reserva de zonas completas.',
    'Birthdays, corporate and celebrations with full-zone bookings.', null, true, 1),
  ('hospitality', 'servicio', 'Catering', 'Catering',
    'Llevamos la experiencia Simmer Down a tu lugar, con menú a tu medida.',
    'We bring the Simmer Down experience to your venue, with a custom menu.', null, true, 2),
  ('hospitality', 'servicio', 'Experiencias en el Lago', 'Lake Experiences',
    'En el Lago de Coatepeque: actividades acuáticas, valet parking y estadía.',
    'At Lago de Coatepeque: water activities, valet parking and lodging.', null, true, 3),
  ('merch', 'camisetas', 'Camiseta Good Vibes', 'Good Vibes Tee',
    'Ejemplo — agrega tus productos con foto y precio en el panel.',
    'Example — add your products with photo and price in the admin panel.', 14.99, false, 1),
  ('merch', 'gorras-accesorios', 'Gorra Simmer Down', 'Simmer Down Cap',
    'Ejemplo — agrega tus productos con foto y precio en el panel.',
    'Example — add your products with photo and price in the admin panel.', 12.99, false, 1),
  ('merch', 'ediciones-limitadas', 'Edición Limitada', 'Limited Drop',
    'Ejemplo — colaboraciones y ediciones por temporada.',
    'Example — collabs and seasonal special editions.', null, false, 1)
) as seed(segment, category, name_es, name_en, description_es, description_en, price, is_active, sort_order)
where not exists (select 1 from public.segment_items);
