-- ============================================================
-- Calendario de Adviento (client request, 2026-11-25):
-- "en 12 días del mes de diciembre haremos dinámicas en la página
--  web, que cuando ingresen ... al picarlo aparezca el premio ...
--  y poderle cargar nosotros las imágenes con el premio"
--
-- advent_days      the 12 drawers. Drawer N opens at 00:00 El Salvador
--                  time on unlock_date (dates from the client's
--                  "¡Nuestras fechas!" slide). image_path points into the
--                  PRIVATE `advent` bucket; the site only ever hands out a
--                  signed URL for drawers whose date has arrived, so a
--                  prize can't be seen early (the public `images` bucket
--                  is listable by anyone — not usable for this).
-- advent_settings  single row: is_live shows the gift button + menu chip.
-- advent_opens     one row per (drawer, device) the first time a visitor
--                  opens it — the client's reach number per day.
--
-- All three tables are service-role only (RLS on, no policies): every
-- read/write goes through /api/advent* and /api/admin/advent*.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.advent_days (
  day          SMALLINT PRIMARY KEY CHECK (day BETWEEN 1 AND 12),
  unlock_date  DATE NOT NULL UNIQUE,
  title        TEXT CHECK (title IS NULL OR char_length(title) <= 120),
  description  TEXT CHECK (description IS NULL OR char_length(description) <= 600),
  image_path   TEXT CHECK (image_path IS NULL OR char_length(image_path) <= 300),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.advent_settings (
  id          BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
  is_live     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.advent_opens (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  day         SMALLINT NOT NULL REFERENCES public.advent_days(day) ON DELETE CASCADE,
  device_id   TEXT NOT NULL CHECK (char_length(device_id) BETWEEN 8 AND 64),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (day, device_id)
);

ALTER TABLE public.advent_days     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advent_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advent_opens    ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.advent_days, public.advent_settings, public.advent_opens
  FROM anon, authenticated;

DROP TRIGGER IF EXISTS advent_days_updated_at ON public.advent_days;
CREATE TRIGGER advent_days_updated_at BEFORE UPDATE ON public.advent_days
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS advent_settings_updated_at ON public.advent_settings;
CREATE TRIGGER advent_settings_updated_at BEFORE UPDATE ON public.advent_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS advent_opens_updated_at ON public.advent_opens;
CREATE TRIGGER advent_opens_updated_at BEFORE UPDATE ON public.advent_opens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Opens per drawer for the admin page.
CREATE OR REPLACE FUNCTION public.advent_open_counts()
RETURNS TABLE (day SMALLINT, opens BIGINT)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT o.day, count(*)::BIGINT FROM public.advent_opens o GROUP BY o.day;
$$;
REVOKE ALL ON FUNCTION public.advent_open_counts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.advent_open_counts() TO service_role;

-- The 12 dates from the client's December 2026 slide.
INSERT INTO public.advent_days (day, unlock_date) VALUES
  (1,  '2026-12-02'),
  (2,  '2026-12-06'),
  (3,  '2026-12-09'),
  (4,  '2026-12-12'),
  (5,  '2026-12-14'),
  (6,  '2026-12-16'),
  (7,  '2026-12-17'),
  (8,  '2026-12-21'),
  (9,  '2026-12-23'),
  (10, '2026-12-25'),
  (11, '2026-12-28'),
  (12, '2026-12-30')
ON CONFLICT (day) DO NOTHING;

INSERT INTO public.advent_settings (id, is_live) VALUES (true, false)
ON CONFLICT (id) DO NOTHING;

-- Private bucket: no storage.objects policies, so anon/authenticated can't
-- list or read it; the server signs URLs per drawer once it is open.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('advent', 'advent', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.advent_days IS
  'Calendario de Adviento drawers 1-12. Opens 00:00 America/El_Salvador on unlock_date. image_path = object in private bucket advent.';
COMMENT ON TABLE public.advent_settings IS
  'Single row. is_live shows the advent gift button + menu chip on the public site.';
COMMENT ON TABLE public.advent_opens IS
  'First open of a drawer per device (localStorage id). Reach metric for the client.';

NOTIFY pgrst, 'reload schema';
