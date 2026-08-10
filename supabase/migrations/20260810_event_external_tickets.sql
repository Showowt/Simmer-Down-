-- ============================================================
-- Option B: external ticketing + multiple price tiers per event
-- ============================================================
-- For shows sold on another platform (Smart Ticket, etc.) or with several
-- price categories the single ticket_price field can't express. Display-only
-- on the event page + a "Comprar boletos" button to the external URL; no
-- payment is processed on-site for these.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS external_tickets_url TEXT,
  ADD COLUMN IF NOT EXISTS ticket_tiers JSONB NOT NULL DEFAULT '[]'::jsonb;
