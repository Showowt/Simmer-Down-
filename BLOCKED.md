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
