# SIMMER DOWN — DEFECT LEDGER
Tracks every defect found, severity, status, and fix commit.

| ID | Severity | Page/Area | Description | Status | Fix Commit |
|----|----------|-----------|-------------|--------|------------|
| D001 | P0 | /checkout | "Something went wrong" error on Continue to Payment | FIXED | fallback-first store merge; live card E2E verified 2026-07-29 |
| D002 | P0 | /carta | Items added to cart not showing (cart count not updating) | FIXED | same store fix as D001; live E2E verified 2026-07-29 |
| D003 | P1 | /checkout | Stale error messages carry over between payment attempts | FIXED | e75b622 |
| D004 | P1 | /reservations | Bottom nav overlaps calendar on mobile | FIXED | 53903fb |
| D005 | P1 | sitewide | Old brown theme colors (#3D3936 etc.) in public pages | FIXED | 53903fb |
| D006 | P1 | /api/contact | Contact form insert fails (missing reason column) | FIXED | bdc0207 |
| D007 | P1 | /api/orders | "Ubicacion no valida" — slug IDs rejected by UUID column | FIXED | 30399a4 |
| D008 | P1 | /api/orders | "takeout" rejected by Zod (only had delivery/pickup) | FIXED | 0ef26e6 |
| D009 | P1 | /api/payments | CurrencyCode "840\n" — trailing newline broke gateway | FIXED | aed8dcd |
| D010 | P1 | /api/payments | BillingAddress PostalCode/State sent when FAC said omit | FIXED | f6a61fe |
| D011 | P2 | /carta | Duplicate photos on beverages (same image on all coffees) | FIXED | 37d6e96 |
| D012 | P2 | /reservations | Input icons overlapping placeholder text | FIXED | bbee916 |
| D013 | P2 | footer | Links used EN slugs causing unnecessary 308 redirects | FIXED | 4dcfc5b |
| D014 | P2 | sitewide | Broken Tailwind bracket classes (text-[white/40]) | FIXED | 53903fb |
| D015 | P3 | /api/orders | Quantity 99999 accepted (no max) | FIXED | bdc0207 |
| D016 | P0 | /auth/signup | Signup's client-side customers INSERT blocked by RLS (no session until email confirm), error silently swallowed, UI falsely claimed "50 puntos agregados" — customers table had ZERO rows ever | FIXED 2026-08-01 | migration 20260801_customer_signup_trigger.sql (on_auth_user_created SECURITY DEFINER trigger) + client insert removed; E2E verified row created, QA artifacts deleted |
| D017 | P1 | sitewide | Two parallel language systems: header toggle wrote useUIStore ('simmerdown-ui-v2') but Footer/Events/auth/WhatsAppButton read separate useI18n context ('simmerdown-lang') — toggle never translated those components | FIXED 2026-08-01 | i18n context rewritten as adapter over useUIStore (single source of truth); E2E verified header+content+footer switch together and persist |
| D018 | P2 | /events | Horizontal overflow at 375px (381px scroll width) — framer-motion whileInView initial x:30 pushed collage past viewport before scroll-into-view | FIXED 2026-08-01 | overflow-hidden on private-events section; headless sweep confirms 13/13 routes clean |
