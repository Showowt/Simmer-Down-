-- 2026-07-29 — Client-confirmed fixes (Martin / Grupo Kase)
--
-- 1) Flat $1.00 delivery fee at all locations. The server charges
--    locations.delivery_fee (/api/orders/create), so this is the amount
--    actually charged to the card. Keep in sync with DELIVERY_FEE in
--    src/lib/data.ts (display value).
UPDATE locations SET delivery_fee = 1.00;

-- 2) Storage RLS for the 'images' bucket used by the admin CMS uploader
--    (src/components/admin/ImageUpload.tsx — events, menu, fotos folders).
--    The bucket existed but had NO policies, so every authenticated staff
--    upload failed with an RLS violation ("Failed to upload image").
--    Mirrors the existing 'menu-images' policy convention.
CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Public read access for images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');
