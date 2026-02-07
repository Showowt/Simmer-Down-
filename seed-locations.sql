-- SIMMER DOWN - SEED LOCATIONS DATA
-- Run this in your Supabase SQL Editor
-- https://supabase.com/dashboard/project/qusvynxzslpmjoqfabyq/sql/new

INSERT INTO locations (
  name,
  slug,
  address_line1,
  city,
  region,
  country,
  phone,
  operating_hours,
  is_active,
  is_accepting_orders,
  delivery_enabled,
  delivery_fee,
  delivery_radius_km,
  estimated_prep_time_minutes
) VALUES
  (
    'Santa Ana',
    'santa-ana',
    '1ra Calle Pte y Callejuela Sur Catedral',
    'Santa Ana',
    'Santa Ana',
    'El Salvador',
    '+503 2445-5999',
    '{"monday": {"open": "11:00", "close": "21:00"}, "tuesday": {"open": "11:00", "close": "21:00"}, "wednesday": {"open": "11:00", "close": "21:00"}, "thursday": {"open": "11:00", "close": "21:00"}, "friday": {"open": "11:00", "close": "22:00"}, "saturday": {"open": "11:00", "close": "22:00"}, "sunday": {"open": "11:00", "close": "21:00"}}'::jsonb,
    true,
    true,
    true,
    3.99,
    10,
    30
  ),
  (
    'Lago de Coatepeque',
    'coatepeque',
    'Calle Principal al Lago #119',
    'Coatepeque',
    'Santa Ana',
    'El Salvador',
    '+503 6831-6907',
    '{"monday": {"open": "11:00", "close": "20:00"}, "tuesday": {"open": "11:00", "close": "20:00"}, "wednesday": {"open": "11:00", "close": "20:00"}, "thursday": {"open": "11:00", "close": "20:00"}, "friday": {"open": "11:00", "close": "21:00"}, "saturday": {"open": "11:00", "close": "21:00"}, "sunday": {"open": "11:00", "close": "20:00"}}'::jsonb,
    true,
    true,
    true,
    4.99,
    8,
    35
  ),
  (
    'San Benito',
    'san-benito',
    'Boulevard del Hipódromo, Colonia San Benito',
    'San Salvador',
    'San Salvador',
    'El Salvador',
    '+503 7487-7792',
    '{"monday": {"open": "11:00", "close": "23:00"}, "tuesday": {"open": "11:00", "close": "23:00"}, "wednesday": {"open": "11:00", "close": "23:00"}, "thursday": {"open": "11:00", "close": "23:00"}, "friday": {"open": "11:00", "close": "00:00"}, "saturday": {"open": "11:00", "close": "00:00"}, "sunday": {"open": "11:00", "close": "23:00"}}'::jsonb,
    true,
    true,
    true,
    2.99,
    15,
    25
  ),
  (
    'Simmer Garden Juayua',
    'juayua',
    'Kilómetro 91.5, San José La Majada',
    'Juayúa',
    'Sonsonate',
    'El Salvador',
    '+503 6990-4674',
    '{"friday": {"open": "11:00", "close": "20:00"}, "saturday": {"open": "11:00", "close": "20:00"}, "sunday": {"open": "11:00", "close": "20:00"}}'::jsonb,
    true,
    true,
    false,
    0,
    0,
    40
  ),
  (
    'Surf City',
    'surf-city',
    'Hotel Casa Santa Emilia, Conchalio 2',
    'La Libertad',
    'La Libertad',
    'El Salvador',
    '+503 7576-4655',
    '{"monday": {"open": "12:00", "close": "20:00"}, "tuesday": {"open": "12:00", "close": "20:00"}, "wednesday": {"open": "12:00", "close": "20:00"}, "thursday": {"open": "12:00", "close": "20:00"}, "friday": {"open": "12:00", "close": "22:00"}, "saturday": {"open": "12:00", "close": "22:00"}, "sunday": {"open": "12:00", "close": "20:00"}}'::jsonb,
    true,
    true,
    true,
    5.99,
    5,
    30
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  address_line1 = EXCLUDED.address_line1,
  city = EXCLUDED.city,
  phone = EXCLUDED.phone,
  operating_hours = EXCLUDED.operating_hours,
  is_active = EXCLUDED.is_active,
  is_accepting_orders = EXCLUDED.is_accepting_orders,
  delivery_enabled = EXCLUDED.delivery_enabled,
  delivery_fee = EXCLUDED.delivery_fee;

-- Verify insertion
SELECT id, name, slug, city, is_accepting_orders, delivery_enabled, delivery_fee
FROM locations
ORDER BY name;
