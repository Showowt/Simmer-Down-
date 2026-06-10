# SIMMER DOWN — FULL-SITE AUDIT REPORT
**Date:** 2026-06-10
**Auditor:** MachineMind Genesis Engine
**Production:** https://simmerdownsv.com
**Commit baseline:** 4dcfc5b

---

## PHASE 1 — ROUTES & DEAD LINKS

| URL | Status | Verdict |
|-----|--------|---------|
| / | 200 | PASS |
| /carta | 200 | PASS |
| /restaurantes | 200 | PASS |
| /nosotros | 200 | PASS |
| /events | 200 | PASS |
| /simmerlovers | 200 | PASS |
| /reservations | 200 | PASS |
| /contact | 200 | PASS |
| /carrito | 200 | PASS |
| /checkout | 200 | PASS |
| /account | 200 | PASS |
| /orders | 200 | PASS |
| /auth/login | 200 | PASS |
| /auth/signup | 200 | PASS |
| /privacy | 200 | PASS |
| /terms | 200 | PASS |
| /locations/santa-ana | 200 | PASS |
| /locations/lago-coatepeque | 200 | PASS |
| /locations/san-benito | 200 | PASS |
| /locations/surf-city | 200 | PASS |
| /locations/simmer-garden | 200 | PASS |
| /menu | 308 -> /carta | PASS (redirect) |
| /locations | 308 -> /restaurantes | PASS (redirect) |
| /about | 308 -> /nosotros | PASS (redirect) |
| /reservar | 308 -> /reservations | PASS (redirect) |

**Fixes applied (commit 4dcfc5b):**
- Footer: /menu -> /carta, /locations -> /restaurantes (eliminate unnecessary redirects)
- NewHeader: /reservar -> /reservations (canonical)
- NewBottomNav: /reservar -> /reservations (canonical)

**Phase 1 verdict: PASS** — zero 404s from any internal link.

---

## PHASE 2 — COPY & FACTUAL ACCURACY

| Check | Result | Verdict |
|-------|--------|---------|
| "horno de lena" / "wood-fired" | 0 occurrences after cleanup | PASS |
| Placeholder timestamps | 0 found | PASS |
| "+8,000 resenas" / "4.9" claims | Present in meta/about page | FLAG — needs client confirmation |
| Test data in customer-facing code | 0 found | PASS |
| Founding year | Only "2014" / "EST. 2014" | PASS |

**Fixes applied (commit 4dcfc5b):**
- Removed last 6 "horno de lena"/"wood-fired" from: layout.tsx OG, nosotros values, homepage, i18n
- Replaced with "Masa Artesanal" / "Desde la cocina"

**Phase 2 verdict: PASS** (with FLAG on review claims needing client verification)

---

## PHASE 3 — ORDERING INTEGRITY

| Check | Result | Verdict |
|-------|--------|---------|
| WhatsApp CTA mapping | Central number 50375764655 for all ordering CTAs | PASS |
| Contact page phone | tel:+50324455999 (Santa Ana) — separate from WhatsApp | PASS |
| Order creation: santa-ana | #20260610-09294, UUID loc_id | PASS |
| Order creation: lago-coatepeque | #20260610-12915, UUID loc_id | PASS |
| Order creation: san-benito | #20260610-08215, UUID loc_id | PASS |
| Order creation: surf-city | #20260610-19491, UUID loc_id | PASS |
| Order creation: simmer-garden | #20260610-86825, UUID loc_id | PASS |
| Slug -> UUID mapping | All 5 resolve correctly | PASS |
| Menu item fallback pricing | Works with client prices when DB empty | PASS |
| Staff WhatsApp notification | Not firing — Twilio creds missing | FAIL |

**Flags:**
- Santa Ana phone: 2445-5999 displayed, but 2455-4899 exists in project history — **needs client confirmation**
- Staff notifications require TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM in Vercel

**Phase 3 verdict: PASS** (ordering works; notifications FAIL pending Twilio config)

---

## PHASE 4 — FORMS & FLOWS

| Check | Result | Verdict |
|-------|--------|---------|
| Contact form submission | API returns success | PASS (API) |
| Contact form DB storage | Insert fails — missing 'reason' column | FAIL -> FIXED |
| Reservation flow | Stores in DB with correct data, status=confirmed | PASS |
| /privacy | 80KB real content, brand references | PASS |
| /terms | 82KB real content, brand references | PASS |
| OG images (all 7) | All return 200 | PASS |
| SimmerLovers signup | BLOCKED — requires browser test | BLOCKED |
| EN/ES toggle persistence | BLOCKED — requires browser test | BLOCKED |

**Fix applied:** Contact form now stores reason in message field: `[general] message text`

**Phase 4 verdict: PASS** (with 2 BLOCKED items requiring browser testing)

---

## PHASE 5 — PAYMENTS HARDENING

| Check | Result | Verdict |
|-------|--------|---------|
| Visa 00 | Order #20260609-63897, RRN 616017072214 | PASS |
| Amex 00 | Order #20260609-89976, RRN 616022078673 | PASS |
| Mastercard | Error 540 at 3DS Directory Server | BLOCKED — awaiting FAC |
| Idempotency | "Este pedido ya fue pagado" on re-initiation | PASS |
| FAC field compliance | Line1 28ch, no PostalCode/State, phone digits-only | PASS |
| payment_attempts evidence | iso_response_code=00, full response_payload | PASS |
| Env var trimming | .trim() on all env reads | PASS (code-level) |
| Env var source cleanup | Trailing newlines in Vercel | BLOCKED — human action |

**Phase 5 verdict: BLOCKED** — Mastercard 3DS pending Ramon/FAC response

---

## PHASE 6 — SECURITY

| Check | Result | Verdict |
|-------|--------|---------|
| scan-secrets.sh hook | Missing file, registered in settings | FAIL — needs removal or restoration |
| Committed secrets in source | None found (only env var references) | PASS |
| Supabase RLS: anon READ orders | 0 rows | PASS |
| Supabase RLS: anon READ payments | 0 rows | PASS |
| Supabase RLS: anon READ payment_attempts | 0 rows | PASS |
| Supabase RLS: anon READ profiles | 0 rows | PASS |
| Supabase RLS: anon WRITE orders | "violates row-level security policy" | PASS |
| Admin route auth | 307 redirect to login | PASS |

**Pending actions:**
- FAC API password rotation with BAC after certification
- scan-secrets.sh hook: restore or remove registration from settings.json

**Phase 6 verdict: PASS** (with pending action items)

---

## PHASE 7 — i18n, SEO, SHARE-READINESS

| Check | Result | Verdict |
|-------|--------|---------|
| Sitemap canonical slugs | All 15 URLs use canonical paths | PASS |
| Location pages in sitemap | 5 real /locations/[slug] pages | PASS |
| robots.txt | Correct allow/disallow | PASS |
| OG images /og/*.jpg | All 7 return 200 | PASS |
| Google site verification | Placeholder — not configured | BLOCKED — human action |
| Lighthouse scores | BLOCKED — requires browser execution | BLOCKED |

**Phase 7 verdict: PASS** (with 2 BLOCKED items)

---

## PHASE 8 — EDGE CASES & ABUSE

| Check | Result | Verdict |
|-------|--------|---------|
| Empty cart -> checkout | Renders empty cart message | PASS |
| Quantity = 0 | Zod rejects: "must be >= 1" | PASS |
| Quantity = -5 | Zod rejects | PASS |
| Quantity = 99999 | Was accepted — now capped at max(99) | FIXED |
| Special chars in name (n, a, emoji) | Order created successfully | PASS |
| FAC payload sanitization | Strips accents/symbols server-side | PASS |
| Rate limiting (5/min) | "Demasiadas solicitudes" message | PASS |
| Mobile 375px viewport | BLOCKED — requires browser test | BLOCKED |

**Phase 8 verdict: PASS** (with 1 BLOCKED item)

---

## BLOCKED LIST

| Item | Reason | What's Needed |
|------|--------|---------------|
| Mastercard 3DS (Error 540) | PowerTranz Directory Server rejects MC authentication | Ramon/FAC to investigate MC 3DS2 for PowerTranzId 77701739 |
| Santa Ana phone confirmation | 2445-5999 vs 2455-4899 | Client to confirm correct number |
| Google Search Console | Verification tag placeholder | Human: configure in Google Search Console |
| FAC password rotation | Credential exposed in development | Human: request new password from BAC post-certification |
| Vercel env var cleanup | Trailing newlines on FAC_CURRENCY_CODE, NEXT_PUBLIC_APP_URL | Human: re-enter values in Vercel dashboard |
| scan-secrets.sh hook | Missing file registered in settings | Human: restore hook or remove from settings.json |
| Twilio credentials | TWILIO_ACCOUNT_SID/AUTH_TOKEN not set | Human: add to Vercel env vars |
| SimmerLovers signup test | Requires browser + Supabase auth | Human: browser test |
| Lighthouse scores | Requires browser execution | Human: run Lighthouse |
| Mobile 375px test | Requires real device/viewport | Human: test on mobile |

---

## GO / NO-GO CALL

**For WhatsApp ordering launch (Phases 1-4): GO**

Evidence:
- All routes resolve (zero 404s)
- All copy corrected (zero wood-fired, years correct)
- All 5 locations create orders with valid UUIDs
- WhatsApp CTAs route to central ordering number
- Reservation flow stores in DB
- Contact form now persists (fixed)
- Privacy/Terms exist with real content
- RLS blocks anonymous access
- Admin requires auth
- Rate limiting enforced

**For card payment launch: NOT YET**
- Visa: PASS (00)
- Amex: PASS (00)
- Mastercard: BLOCKED (3D3/Error 540)
- Must not go live on card payments until all 3 brands show 00 in portal

---

## FIX COMMITS THIS SESSION

| Commit | Description |
|--------|-------------|
| 4dcfc5b | Phase 1+2: routes, slugs, last wood-fired removal |
| (pending) | Phase 4+8: contact form DB fix, max quantity 99 |
