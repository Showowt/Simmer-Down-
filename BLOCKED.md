# SIMMER DOWN — BLOCKED ITEMS
Items that cannot be completed without human action or third-party response.

## CRITICAL BLOCKERS (must resolve before launch)

### BLK-001: Mastercard 3DS certification
- **Gate:** E3
- **Status:** Ramon provided correct test card (5100270000000031) on Jun 10
- **Action:** Run MC test in browser → complete 3DS → confirm 00 in DB
- **Owner:** Phil (browser test) + Ramon (confirm in portal)
- **Note:** Site currently has "Something went wrong" error (D001) that must be fixed first

### BLK-002: "Something went wrong" runtime error
- **Gate:** A7
- **Status:** Checkout and cart adding broken on production
- **Action:** Diagnose client-side JS error — likely Zustand store hydration mismatch from cart store changes. User should clear localStorage and hard refresh. Error boundary now shows message (commit 60b9a21).
- **Owner:** Phil (clear localStorage) → if persists, requires code fix

### BLK-003: Twilio credentials for staff notifications
- **Gate:** C7
- **Status:** TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM not set
- **Action:** Add to Vercel environment variables
- **Owner:** Phil

## IMPORTANT BLOCKERS (should resolve before launch)

### BLK-004: Santa Ana phone number confirmation
- **Gate:** B4
- **Status:** Site shows 2445-5999, but 2455-4899 exists in history
- **Action:** Client (Grupo KASE) to confirm correct number
- **Owner:** Phil → client

### BLK-005: Review claims verification
- **Gate:** B3
- **Status:** "+8,000 resenas" and "4.9 estrellas" on about page + meta
- **Action:** Client to confirm these numbers are accurate, or remove
- **Owner:** Phil → client

### BLK-006: Vercel env var cleanup
- **Gate:** A8
- **Status:** FAC_CURRENCY_CODE and NEXT_PUBLIC_APP_URL had trailing newlines
- **Action:** Re-enter values in Vercel dashboard (trim is in code as safety net)
- **Owner:** Phil

## POST-LAUNCH BLOCKERS

### BLK-007: FAC API password rotation
- **Gate:** F6
- **Action:** Request new password from BAC after certification complete
- **Owner:** Phil → BAC/PowerTranz

### BLK-008: Google Search Console
- **Gate:** n/a (SEO, not launch-blocking)
- **Action:** Configure verification tag, submit sitemap
- **Owner:** Phil

### BLK-009: scan-secrets.sh hook
- **Gate:** F5
- **Action:** Restore hook file or remove registration from ~/.claude/settings.json
- **Owner:** Phil

### BLK-010: Lighthouse audit
- **Gates:** G4, G5
- **Action:** Run Lighthouse in browser, fix scores below 80
- **Owner:** Phil

### BLK-011: SimmerLovers signup test
- **Gate:** D5
- **Action:** Browser test: signup → verify profile created in Supabase
- **Owner:** Phil

### BLK-012: EN/ES toggle test
- **Gate:** D6
- **Action:** Browser test: switch language on each page, verify persistence
- **Owner:** Phil
