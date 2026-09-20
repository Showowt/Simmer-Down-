# SIMMER DOWN — OPEN ITEMS
Corrected 2026-08-01 per Phil's status update. Previous versions of this file
contained stale items — the facts below are authoritative.

## SETTLED FACTS (do not resurface)
- **Mastercard IS certified.** FAC dev certification passed 2026-06-12 with card
  5100270000000031, and a real production ISO 00 was achieved (order 20260721-50858).
  A sandbox MC decline means wrong card, NOT failed certification.
- **All 5 location phone numbers are client-confirmed.** Santa Ana = +503 7680-4434.
  Site code + DB aligned to confirmed numbers on 2026-08-01 (old 2455-4899 /
  2445-5999 removed everywhere).
- **Delivery fee = $1.00 flat, all 5 locations, confirmed. IVA is included in
  menu prices** (never added on top). Fixed and verified 2026-07-29.

## OPEN — the only 3 items

### 1. Review claims (+8,000 reseñas / 4.9 estrellas)
- **Where:** /nosotros page + SEO meta.
- **Needs:** Client keep-or-remove decision. Same-day edit either way.
- **Owner:** Phil → client

### 2. Delivery-zone / geolocation limiting — NEW SCOPE (to be quoted)
- **Requested by:** Casmorst. Not a launch blocker.
- **Scope to quote:** per-location delivery zones (radius or polygon) enforced at
  checkout + /api/orders, optional per-zone fees, admin UI to manage zones.
- **Owner:** Phil quotes → client approves → build

### 3. Real Visa PAGO CONFIRMADO screenshot at $10.99
- **Goal:** capture the PAGO CONFIRMADO notification showing $10.99.
- **Recipe:** 1× Lasaña Bolognesa ($9.99) → delivery → total $10.99 → pay with
  the approved Visa (PAN held by Phil/Ramon, not in repo) → PAGO CONFIRMADO
  lands in the ops Telegram → screenshot.
- **Owner:** Phil (card entry required)

---

## OPEN — Sep-17 build: features BUILT but DORMANT until the client supplies data
Added 2026-09-20. The code is live and verified; every item below is blocked on
Martin / Grupo Kase, not on engineering. Nothing here is a bug.

### 4. Estadía (Lago de Coatepeque) — 0 of 3 rooms active
`/estadia` is live but `guest_rooms` holds 3 migration placeholders, all
`is_active=false`, so the page can never take a booking. The Coatepeque location
page correctly shows "Próximamente" instead of a CTA into an empty catalogue.
- **Needs:** real room list (ES + EN names), true capacity, nightly rate + whether
  it includes IVA, amenities in ES and EN, and 1-3 photos per room **as files**
  (a Drive/Instagram link is blocked by next/image + the CSP — only Supabase
  Storage and Unsplash load; the admin editor has an uploader).
- **Also needs policy answers the form cannot invent:** maximum stay, how far ahead
  bookings open, check-in/check-out times, deposit, cancellation terms. Without a
  max stay an anonymous request can park a multi-year hold on a room.
- **Also:** the guest selector offers up to 8 but no placeholder room holds more
  than 4 — confirm the real maximum party.
- **Owner:** Phil → Martin. Activation is then self-serve in /admin/habitaciones.

### 5. Table map — live at 2 of 5 venues
Santa Ana (4 areas / 25 tables) and Simmer Garden (4 / 46) are live. Lago de
Coatepeque, San Benito and Surf City each have ONE placeholder area and all their
tables (8 / 10 / 8) seeded inactive. The owner can now switch tables on per-table
or in bulk from /admin/mesas — but the seeded layout is invented, not real.
- **Needs:** for the 3 dark venues, the real areas (ES + EN names) and real tables
  per area (code, seats, rough position). For the 2 live venues, sign-off on the
  seeded layout and corrections to seat counts.
- **Needs:** EN descriptions for the 7 areas that have none.
- **Confirm:** Salas VIP (Santa Ana) `min_party = 4` is the only minimum in the
  system — is 4 right?
- **Policy decision:** Santa Ana tops out at 6 seats and Simmer Garden at 4, so a
  party of 7+ can never be assigned a single table online. Today the form takes the
  booking unassigned and the restaurant seats them on arrival. Confirm that is what
  they want.
- **Owner:** Phil → Martin.

### 6. SimmerLovers — two numbers only the client can decide
- **Welcome bonus is 2 points** in production (owner lowered it 2026-09-17). The
  signup copy now quotes the live value instead of the old hardcoded "50 puntos" —
  confirm 2 is deliberate, because it is what every new member is now promised.
- **Earn rate:** `loyalty_points_per_dollar` is now wired into the earning trigger
  (it previously changed nothing). It reads 1, multiplied by the tier multiplier
  (bronze 1.00 → platinum 2.00). Confirm the intended base rate.
- **The two discount rewards have `discount_percent` and `discount_amount` NULL** —
  a cashier has nothing to honour. Needs the real % / $ off.
- **Per-reward caps** (`max_total_redemptions`, `max_redemptions_per_customer`) are
  unlimited on all 8 rewards.
- **Owner:** Phil → Martin. All of it is self-serve in /admin/premios once decided.

### 7. Segment pages — real content
/cortes-premium, /hospitality and /merch are live, indexed and bilingual, but the
copy is ours, not the client's.
- **Cortes Premium:** which dishes belong on the page and at what shown price (they
  are orderable at $14-$20 today).
- **Hospitality:** what the lead form must ask and who receives the lead. Today the
  only capture is a WhatsApp deep link.
- **Merch:** real products with prices, or a decision that it stays "coming soon".
- **Per-segment phone number:** every segment CTA currently dials the main line.
- **Water activities + valet at Coatepeque:** advertised on the location page with
  no price, no hours and no way to book.
- **Owner:** Phil → Martin.
