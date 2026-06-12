# SIMMER DOWN — LAUNCH GATES
Every box must be checked with evidence before launch. BLOCKED items go to BLOCKED.md.

## A. INFRASTRUCTURE
- [x] A1: All routes return 200 or valid redirect (evidence: AUDIT_REPORT Phase 1)
- [x] A2: TypeScript compiles with zero errors (evidence: `npx tsc --noEmit` clean)
- [x] A3: Production build succeeds (evidence: `npm run build` passes)
- [x] A4: Vercel auto-deploys from main (evidence: pushes trigger deploys)
- [x] A5: Sitemap.xml uses canonical slugs only (evidence: AUDIT_REPORT Phase 7)
- [x] A6: robots.txt blocks admin/api/kitchen/checkout (evidence: AUDIT_REPORT Phase 7)
- [ ] A7: No runtime errors on any public page (evidence: Playwright + manual)
- [ ] A8: Vercel env vars have no trailing whitespace (evidence: human must verify in dashboard)

## B. CONTENT ACCURACY
- [x] B1: Zero "horno de lena" / "wood-fired" references (evidence: grep returns 0)
- [x] B2: Founding year is 2014 only (evidence: grep confirms)
- [ ] B3: Review claims (8,000+ / 4.9) verified by client OR removed
- [ ] B4: Santa Ana phone confirmed: 2445-5999 or 2455-4899
- [x] B5: No test data in customer-facing code (evidence: grep returns 0)

## C. ORDERING (WhatsApp — launch path)
- [x] C1: All 5 locations create orders with valid UUID location_ids
- [x] C2: Menu item fallback pricing works when DB items missing
- [x] C3: WhatsApp CTA opens central number with pre-filled order
- [x] C4: Rate limiting enforced (5/min, polite ES message)
- [x] C5: Quantity validation: min 1, max 99, rejects 0/negative
- [x] C6: Special characters in names don't crash order creation
- [ ] C7: Staff WhatsApp notification fires on order (needs Twilio creds)
- [ ] C8: Cart items persist across page navigation and refresh
- [x] C9: Alcohol items blocked from takeout/delivery (dineInOnly flag)

## D. FORMS
- [x] D1: Contact form submits and stores in DB (reason in message field)
- [x] D2: Reservation form submits and stores with correct data
- [x] D3: /privacy exists with real content (80KB+)
- [x] D4: /terms exists with real content (82KB+)
- [ ] D5: SimmerLovers signup creates a profile record
- [ ] D6: EN/ES toggle works on every page and persists

## E. PAYMENTS (card — blocked on MC)
- [x] E1: Visa 00 in browser (order #20260609-63897, RRN 616017072214)
- [x] E2: Amex 00 in browser (order #20260609-89976, RRN 616022078673)
- [ ] E3: Mastercard 00 in browser (card 5100270000000031 from Ramon)
- [x] E4: Idempotency guard works (rejects duplicate payment on same order)
- [x] E5: FAC field compliance verified in payment_attempts
- [ ] E6: Declined card shows failure screen, not "confirmado"
- [x] E7: Checkout form has no postal code field (removed per FAC)
- [x] E8: Phone digits-only in payment payload
- [ ] E9: Success page only renders on iso=00 + real auth code

## F. SECURITY
- [x] F1: No hardcoded secrets in source code
- [x] F2: Supabase RLS blocks anonymous reads on orders/payments/profiles
- [x] F3: Supabase RLS blocks anonymous writes on orders
- [x] F4: Admin routes redirect to login when unauthenticated
- [ ] F5: scan-secrets.sh hook restored or registration removed
- [ ] F6: FAC API password rotated with BAC post-certification

## G. VISUAL & UX
- [x] G1: Unified color palette (zero old brown theme colors in public code)
- [x] G2: OG images exist for all 7 share paths
- [x] G3: 404 page is branded, bilingual, has useful links
- [ ] G4: Lighthouse performance score >= 80
- [ ] G5: Lighthouse accessibility score >= 80
- [ ] G6: No horizontal scroll at 375px on any page
- [ ] G7: All buttons have hover + focus-visible states
