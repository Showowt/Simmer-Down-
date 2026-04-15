-- Seed Simmer Garden as a 5th location if it isn't already present.
-- Safe to run multiple times — UPSERT on slug.

INSERT INTO locations (
  slug, name, tagline, address, city, phone, hours_weekday, hours_weekend,
  features, delivery_available, status
)
VALUES (
  'simmer-garden',
  'Simmer Garden',
  'Ruta de las Flores · Jardín de Montaña',
  'Kilómetro 91.5, San José La Majada',
  'Juayúa, Sonsonate, El Salvador',
  '+503 6990-4674',
  'Dom – Jue: 11am – 8pm',
  'Vie – Sáb: 11am – 8:30pm',
  ARRAY['Ruta de las Flores', 'Jardín', 'Montaña', 'Naturaleza', 'Vista Panorámica'],
  true,
  'active'
)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      tagline = EXCLUDED.tagline,
      address = EXCLUDED.address,
      city = EXCLUDED.city,
      phone = EXCLUDED.phone,
      hours_weekday = EXCLUDED.hours_weekday,
      hours_weekend = EXCLUDED.hours_weekend,
      features = EXCLUDED.features,
      delivery_available = EXCLUDED.delivery_available,
      status = EXCLUDED.status;

SELECT 'Simmer Garden seeded.' AS message;
