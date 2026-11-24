-- ============================================================
-- Event segments (client request, 2026-11-22):
-- "poder poner como un segmento: Simmermanía - Frontline - Otros,
--  para colocar los eventos que estamos subiendo para que compren"
--
-- events.segment  which programme an event belongs to. Fixed list,
--                 labels live in src/lib/event-segments.ts:
--                   simmermania  Simmermanía (house concert programme)
--                   frontline    Frontline
--                   otros        everything else (default, so every
--                                existing event stays valid)
--
-- Used by the admin events list (filter + badge), the event editor
-- and the public /ticketmania listing (segment chips). Anon RLS is
-- untouched: published rows stay public-read, deleted rows hidden.
-- ============================================================

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS segment TEXT NOT NULL DEFAULT 'otros';

ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_segment_check;
ALTER TABLE public.events
  ADD CONSTRAINT events_segment_check
  CHECK (segment IN ('simmermania', 'frontline', 'otros'));

COMMENT ON COLUMN public.events.segment IS
  'Programme the event belongs to: simmermania | frontline | otros. Labels in src/lib/event-segments.ts.';
