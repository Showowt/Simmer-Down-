-- SIMMER DOWN - ADMIN SCHEMA ADDITIONS
-- Run this in your Supabase SQL Editor

-- =====================
-- EVENTS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date VARCHAR(100) NOT NULL, -- Can be "Feb 15, 2025" or "Cada Viernes"
  time VARCHAR(100) NOT NULL,
  location VARCHAR(255),
  image_url TEXT,
  category VARCHAR(50) DEFAULT 'General',
  price VARCHAR(50), -- "$45" or NULL for free
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are viewable by everyone"
  ON events FOR SELECT USING (true);

CREATE POLICY "Admins can manage events"
  ON events FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- Realtime for events
ALTER PUBLICATION supabase_realtime ADD TABLE events;

-- Trigger for updated_at
CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================
-- UPDATE contact_submissions policies for admin management
-- =====================
CREATE POLICY "Staff can update contact submissions"
  ON contact_submissions FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Staff can delete contact submissions"
  ON contact_submissions FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- =====================
-- STORAGE BUCKET FOR IMAGES
-- Run these commands to set up image storage
-- =====================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);

-- CREATE POLICY "Anyone can view images"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'images');

-- CREATE POLICY "Admins can upload images"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'images' AND
--     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
--   );

-- CREATE POLICY "Admins can update images"
--   ON storage.objects FOR UPDATE
--   USING (
--     bucket_id = 'images' AND
--     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
--   );

-- CREATE POLICY "Admins can delete images"
--   ON storage.objects FOR DELETE
--   USING (
--     bucket_id = 'images' AND
--     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
--   );

-- =====================
-- SAMPLE EVENTS DATA
-- =====================
INSERT INTO events (title, description, date, time, location, image_url, category, price, featured, active) VALUES
  ('Jazz & Pizza Night', 'Disfruta de jazz en vivo mientras saboreas nuestras pizzas signature. Artistas locales, cócteles artesanales y vibras increíbles.', 'Cada Viernes', '7:00 PM - 11:00 PM', 'San Benito', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800', 'Música', NULL, true, true),
  ('Taller de Pizza Artesanal', 'Aprende el arte de hacer pizza de nuestro chef principal. Experiencia práctica con masa, salsa y técnicas de horno.', 'Feb 15, 2025', '2:00 PM - 5:00 PM', 'Santa Ana', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', 'Taller', '$45', false, true),
  ('Maridaje Vino & Pizza', 'Una noche curada de vinos italianos perfectamente maridados con nuestras pizzas artesanales. Cupos limitados.', 'Feb 22, 2025', '6:30 PM - 9:30 PM', 'Coatepeque', 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800', 'Degustación', '$65', false, true),
  ('Pizza Party para Niños', '¡Deja que los pequeños creen sus propias mini pizzas! Incluye elaboración de pizza, juegos y premios. Edades 5-12.', 'Cada Sábado', '11:00 AM - 1:00 PM', 'Todas las Ubicaciones', 'https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=800', 'Familia', '$25', false, true)
ON CONFLICT DO NOTHING;
