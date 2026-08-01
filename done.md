# SIMMER DOWN — LAUNCH GATES
Every box must be checked with evidence before launch. BLOCKED items go to BLOCKED.md.

## A. INFRASTRUCTURE
- [x] A1: All routes return 200 or valid redirect (evidence: AUDIT_REPORT Phase 1)
- [x] A2: TypeScript compiles with zero errors (evidence: `npx tsc --noEmit` clean)
- [x] A3: Production build succeeds (evidence: `npm run build` passes)
- [x] A4: Vercel auto-deploys from main (evidence: pushes trigger deploys)
- [x] A5: Sitemap.xml uses canonical slugs only (evidence: AUDIT_REPORT Phase 7)
- [x] A6: robots.txt blocks admin/api/kitchen/checkout (evidence: AUDIT_REPORT Phase 7)
- [x] A7: No runtime errors on any public page (evidence: 2026-08-01 headless sweep of 13 routes, zero console errors; live E2E card order 2026-07-29)
- [x] A8: Vercel env vars have no trailing whitespace (evidence: 2026-08-01 — 12 prod vars re-entered clean via CLI, verified byte-identical via env pull, redeployed + smoke-tested)

## B. CONTENT ACCURACY
- [x] B1: Zero "horno de lena" / "wood-fired" references (evidence: grep returns 0)
- [x] B2: Founding year is 2014 only (evidence: grep confirms)
- [ ] B3: Review claims (8,000+ / 4.9) verified by client OR removed
- [x] B4: All 5 location phones client-confirmed. Santa Ana = +503 7680-4434 (evidence: Phil status correction 2026-08-01; site code + DB + SEO structured data aligned same day, zero traces of 2455/2445 remain)
- [x] B5: No test data in customer-facing code (evidence: grep returns 0)

## C. ORDERING (WhatsApp — launch path)
- [x] C1: All 5 locations create orders with valid UUID location_ids
- [x] C2: Menu item fallback pricing works when DB items missing
- [x] C3: WhatsApp CTA opens central number with pre-filled order
- [x] C4: Rate limiting enforced (5/min, polite ES message)
- [x] C5: Quantity validation: min 1, max 99, rejects 0/negative
- [x] C6: Special characters in names don't crash order creation
- [x] C7: Staff notification fires on order (evidence: Telegram is the live channel, verified in prod 2026-07-29 PAGO CONFIRMADO; Twilio WhatsApp is optional add-on, degrades gracefully without creds)
- [x] C8: Cart items persist across page navigation and refresh (evidence: Zustand persist + merge guard; live E2E checkout 2026-07-29)
- [x] C9: Alcohol items blocked from takeout/delivery (dineInOnly flag)

## D. FORMS
- [x] D1: Contact form submits and stores in DB (reason in message field)
- [x] D2: Reservation form submits and stores with correct data
- [x] D3: /privacy exists with real content (80KB+)
- [x] D4: /terms exists with real content (82KB+)
- [x] D5: SimmerLovers signup creates a customer record (evidence: 2026-08-01 E2E — was BROKEN (RLS blocked client insert pre-confirmation, D016); fixed with on_auth_user_created DB trigger; retest created customers row with 50pts, QA artifacts deleted)
- [x] D6: EN/ES toggle works on every page and persists (evidence: 2026-08-01 E2E — was split-brain (D017, two language stores); unified i18n context over useUIStore; toggle now switches header+content+footer, persists across nav & reload, html lang updates)

## E. PAYMENTS (card — blocked on MC)
- [x] E1: Visa 00 in browser (order #20260609-63897, RRN 616017072214)
- [x] E2: Amex 00 in browser (order #20260609-89976, RRN 616022078673)
- [x] E3: Mastercard certified (evidence: FAC dev cert passed 2026-06-12 with card 5100270000000031; real production ISO 00 order 20260721-50858. Sandbox MC declines = wrong card, NOT failed cert)
- [x] E4: Idempotency guard works (rejects duplicate payment on same order)
- [x] E5: FAC field compliance verified in payment_attempts
- [x] E6: Declined card shows failure screen (evidence: code-verified server-gated status + live MC ISO 12 decline 2026-07-29 showed 'Pago No Procesado')
- [x] E7: Checkout form has no postal code field (removed per FAC)
- [x] E8: Phone digits-only in payment payload
- [x] E9: Success page only renders on iso=00 (evidence: callback gates on Approved && ISO 00; 3DS modal accepts same-origin postMessage only + polls server /api/payments/status; DB writes server-gated)

## F. SECURITY
- [x] F1: No hardcoded secrets in source code
- [x] F2: Supabase RLS blocks anonymous reads on orders/payments/profiles
- [x] F3: Supabase RLS blocks anonymous writes on orders
- [x] F4: Admin routes redirect to login when unauthenticated
- [x] F5: scan-secrets.sh hook restored (evidence: ~/.claude/hooks/scan-secrets.sh exists, executable, registered)
- [x] F6: Closed per 2026-08-01 status correction — certification complete; not tracked as an open launch item

## G. VISUAL & UX
- [x] G1: Unified color palette (zero old brown theme colors in public code)
- [x] G2: OG images exist for all 7 share paths
- [x] G3: 404 page is branded, bilingual, has useful links
- [x] G4: Lighthouse performance >= 80 (evidence: 2026-08-01 — home 91, carta 91)
- [x] G5: Lighthouse accessibility >= 80 (evidence: 2026-08-01 — home 95, carta 95; best-practices 100, SEO 100/92)
- [x] G6: No horizontal scroll at 375px on any page (evidence: 2026-08-01 headless sweep of 13 routes — /events overflow (D018) fixed with overflow-hidden, all pages 375/375)
- [x] G7: Buttons have hover + focus-visible states (evidence: global :focus-visible rule in globals.css + hover: classes across components)
