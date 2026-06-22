-- Events table for Simmer Down location-specific events
-- Columns aligned with:
--   src/app/api/events/route.ts (GET queries)
--   src/app/api/telegram/webhook/route.ts (/evento insert)
--   EventsSection component (display)

CREATE TABLE IF NOT EXISTS events (
  id              UUID          DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Core identity
  title           VARCHAR(200)  NOT NULL,
  title_es        VARCHAR(200),
  slug            VARCHAR(120)  NOT NULL UNIQUE,
  description     TEXT,
  description_es  TEXT,

  -- Location: UUID ref (no hard FK — custom_venue used when no DB location match)
  location_id     UUID,
  custom_venue    TEXT,

  -- Scheduling (TIMESTAMPTZ, El Salvador ops use UTC-6 offsets on insert)
  starts_at       TIMESTAMPTZ   NOT NULL,
  ends_at         TIMESTAMPTZ,

  -- Media
  image_url       TEXT,
  thumbnail_url   TEXT,

  -- Classification
  is_featured     BOOLEAN       NOT NULL DEFAULT false,
  is_published    BOOLEAN       NOT NULL DEFAULT false,
  tags            TEXT[]        NOT NULL DEFAULT '{}',

  -- Extras — retained from original, useful even if not queried yet
  ticket_url      TEXT,
  price           VARCHAR(50),

  -- Audit
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ─── Row-Level Security ───────────────────────────────────────────────────────

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Public can read published events
CREATE POLICY "Public can read published events" ON events
  FOR SELECT USING (is_published = true);

-- Service role has full access (used by Telegram webhook and admin APIs)
CREATE POLICY "Service role full access" ON events
  FOR ALL USING (auth.role() = 'service_role');

-- ─── Indexes ─────────────────────────────────────────────────────────────────

-- Primary query pattern: upcoming published events ordered by date
CREATE INDEX idx_events_starts_at    ON events (starts_at ASC);

-- Filter by location UUID
CREATE INDEX idx_events_location_id  ON events (location_id);

-- Filter published-only (partial index keeps it tight)
CREATE INDEX idx_events_published    ON events (is_published) WHERE is_published = true;

-- ─── updated_at auto-trigger ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();
