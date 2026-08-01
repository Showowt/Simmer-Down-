# SIMMER DOWN — BLOCKED ITEMS
Items that cannot be completed without human action or third-party response.
Last swept: 2026-08-01 — everything Claude-actionable is done; only the items below remain.

## OPEN — needs Phil / client / FAC

### BLK-001: Mastercard 3DS certification (gate E3)
- **Status:** MC sandbox card 5100270000000031 completes 3DS (3D0) but DECLINES at capture with ISO 12 "Invalid transaction" — E3 cert never passed on FAC's side. Visa (E1) and Amex (E2) approve with ISO 00; client (Marlon, Grupo Kase) ran an approved Visa test 2026-07-29.
- **Action:** Ramon/Giancarlo (PowerTranz) must resolve the MC test card on their side, then re-run the browser test.
- **Owner:** Phil → Ramon/PowerTranz

### BLK-004: Santa Ana phone confirmation (gate B4)
- **Status:** Site now uses **2455-4899 consistently everywhere** (contact, reservations, privacy, terms, footer, SEO meta). The old 2445-5999 no longer appears in code.
- **Action:** Client (Grupo KASE) confirms 2455-4899 is correct — or supplies the right number.
- **Owner:** Phil → client

### BLK-005: Review claims verification (gate B3)
- **Status:** "+8,000 resenas" and "4.9 estrellas" on about page + meta.
- **Action:** Client to confirm these numbers are accurate, or we remove them.
- **Owner:** Phil → client

### BLK-013: Delivery radius / zone validation (product gap)
- **Status:** Checkout accepts a delivery address ANYWHERE — no radius or zone check. Delivery is live at all 5 locations with $1.00 flat fee.
- **Action:** Business decision needed: per-location delivery zones (and per-zone fees?). Then build validation into checkout + /api/orders.
- **Owner:** Phil → client decision, then build

## POST-CERTIFICATION / OPTIONAL

### BLK-007: FAC API password rotation (gate F6)
- **Action:** Request new password from BAC after MC certification completes, update FAC_POWERTRANZ_PASSWORD in Vercel (enter WITHOUT trailing newline), redeploy.
- **Owner:** Phil → BAC/PowerTranz

### BLK-008: Google Search Console
- **Action:** Configure verification tag with Phil's Google account, submit sitemap.
- **Owner:** Phil

### BLK-003: Twilio WhatsApp staff notifications (optional)
- **Status:** DOWNGRADED from critical — Telegram is the live, verified staff-notification channel (PAGO CONFIRMADO verified in prod 2026-07-29). Twilio WhatsApp to Marvin (+503 7680-4434) is coded and degrades gracefully; it activates the moment TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_WHATSAPP_FROM are set in Vercel.
- **Owner:** Phil (only if WhatsApp channel is wanted in addition to Telegram)

## RESOLVED 2026-08-01 (verified, moved out of blocked)

- **BLK-002** "Something went wrong" runtime error → fixed by fallback-first store merge; 13-route headless sweep shows zero console errors; live card E2E 2026-07-29.
- **BLK-006** Vercel env trailing newlines → all 12 affected production vars re-entered clean via CLI, verified byte-identical, redeployed, smoke-tested (Supabase + payments APIs respond correctly).
- **BLK-009** scan-secrets.sh hook → present at ~/.claude/hooks/scan-secrets.sh, executable, registered.
- **BLK-010** Lighthouse → home 91 perf / 95 a11y, carta 91 / 95 (best-practices 100, SEO 100/92). Both gates >= 80.
- **BLK-011** SimmerLovers signup → tested, found broken (D016), fixed with DB trigger, retested end-to-end: customers row with 50-point welcome bonus created. QA artifacts deleted.
- **BLK-012** EN/ES toggle → tested, found split-brain (D017), unified on useUIStore; verified across pages with persistence.
