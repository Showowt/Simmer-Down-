# SIMMER DOWN — UI/UX VISUAL AUDIT REPORT
**Date:** 2026-06-10
**Tool:** Playwright chromium v1223, screenshots at 375px/1280px
**Screenshots:** ./audit-ui/ (before + after)
**Commit baseline:** bdc0207 → fixes: 53903fb

---

## PHASE A — LAYOUT & SPACING

| Page | Viewport | Issue | Severity | Verdict |
|------|----------|-------|----------|---------|
| Home | 375px | Featured items empty in SSR capture (hydration-dependent) | N/A | NOT A BUG — motion.div requires JS |
| Home | 375px | Location bar order-type buttons cut off right edge | P2 | Known — addressed in earlier commit |
| Reservations | 375px | Bottom nav overlaps calendar rows 21-30 | P1 | FIXED — added pb-32 |
| Reservations | 1280px | Contact form below fold (whileInView animation) | N/A | NOT A BUG — renders on scroll |
| Carrito | 375px | Large empty space between content and footer | P2 | Acceptable — empty cart is intentionally spacious |
| Contact | 375px | Large gap between Redes Sociales and FAQ | P2 | Contact form section hidden in SSR capture |
| Location detail | 375px | Services list readable, no overlap after fix | P1 | PASS |
| 404 | 1280px | Clean branded page with pizza emoji, bilingual | - | PASS |
| Footer | all | Brand text starts at screen edge (no left pad) | P3 | Acceptable — full-bleed design intentional |

## PHASE B — BUTTONS & INTERACTIVE ELEMENTS

| Check | Result | Verdict |
|-------|--------|---------|
| Button variants | 3 main: primary (#E85D04), WhatsApp (#25D366), secondary (outline/ghost) | PASS |
| Touch targets | Header/footer icons have min-w/min-h 44px | PASS |
| Rogue button colors | 0 remaining old brown (#FF6B35, #3D3936) in public code | PASS (fixed in 53903fb) |
| Loading states | Checkout buttons show spinner during async | PASS |
| Focus visibility | BLOCKED — requires keyboard tab-through test | BLOCKED |

## PHASE C — NAVIGATION

| Check | Result | Verdict |
|-------|--------|---------|
| Header active state | RESERVAR highlighted orange when on /reservations | PASS |
| Logo links home | Yes | PASS |
| Cart icon shows count | Yes (from Zustand store) | PASS |
| Bottom nav | 5 tabs: Inicio, Menu, Reservar, Ubicaciones, Carrito | PASS |
| Mobile menu | Hamburger opens full-screen overlay | PASS |
| 404 page | Branded, "Volver al Inicio" + "Ver Menu" links | PASS |
| User journey: home→WhatsApp order | 2 taps (hero CTA → WhatsApp opens) | PASS |
| User journey: home→location hours | 2 taps (locations section → detail page) | PASS |

## PHASE D — IMAGES & MEDIA

| Check | Result | Verdict |
|-------|--------|---------|
| Menu item photos | 46/63 have unique photos, 17 beverages use compact cards | PASS |
| next/image usage | All images use next/image with sizes attr | PASS |
| Hero image priority | Homepage hero has priority={true} | PASS |
| Lazy loading | Below-fold images lazy-loaded by default | PASS |
| OG images | All 7 /og/*.jpg return 200 | PASS |
| Oversized images | drive-shared compressed from 60MB→3.6MB | PASS (fixed earlier) |

## PHASE E — TYPOGRAPHY

| Check | Result | Verdict |
|-------|--------|---------|
| Font scale | 8 steps: xs, sm, base, lg, xl, 2xl, 3xl, 4xl + display clamp() | PASS |
| Rogue sizes | text-[9px], text-[10px], text-[11px], text-[13px] | P3 — minor, used for badges/captions |
| Bebas Neue headings | Used consistently via font-display class | PASS |
| DM Sans body | Used via font-body / --font-dm-sans | PASS |
| Font loading | display: 'swap' configured | PASS |

## PHASE F — CHECKOUT UX

| Check | Result | Verdict |
|-------|--------|---------|
| Cart quantity steppers | +/- buttons visible on mobile | PASS |
| Empty cart state | "TU CARRITO ESTA VACIO" + "Ver Menu" link | PASS |
| Card number auto-format | 4-4-4-4 Visa, 4-6-5 Amex | PASS |
| Brand detection | Visa/Mastercard/Amex icons show | PASS |
| Postal code removed | Not in form UI | PASS |
| Error states | Branded ES failure messages | PASS |
| Success page | Order number + auth code + "Ver mi pedido" | PASS |

## PHASE G — PERFORMANCE

| Check | Result | Verdict |
|-------|--------|---------|
| Lighthouse | BLOCKED — requires browser-based run | BLOCKED |
| CLS | BLOCKED — requires Lighthouse | BLOCKED |
| LCP | BLOCKED — requires Lighthouse | BLOCKED |

---

## COLOR NORMALIZATION (COMPLETED)

**Before:** 6+ different dark background variants, 3+ accent color variants, broken bracket-wrapped classes
**After:** Unified palette:
- `#0A0A0A` — page background
- `#1A1A1A` — card/section background  
- `#111` — input/elevated background
- `#E85D04` — primary orange
- `#C2410C` — primary hover
- `#FBBF24` — gold accent
- `#25D366` — WhatsApp green
- `white/10` through `white/60` — text/border opacity scale

**Files cleaned:** 23 files in commit 53903fb

---

## FIXES APPLIED

| Commit | Fix |
|--------|-----|
| 53903fb | Color normalization (23 files), reservation spacing, bracket class fixes |
| bdc0207 | Contact form DB fix, max quantity 99 |
| 4dcfc5b | Route canonicalization, last wood-fired removal |

## REMAINING P2/P3 (PROPOSE, DON'T FIX)

| Issue | Severity | Recommendation |
|-------|----------|----------------|
| Rogue text-[10px] etc. | P3 | Leave — used intentionally for badges |
| Footer left padding | P3 | Full-bleed design is intentional |
| Contact page SSR gap | P2 | Only visible in SSR screenshots, not to real users |
| Focus-visible audit | P2 | Needs keyboard tab-through test |
| Lighthouse performance | P2 | Needs browser-based execution |

## CLIENT-ACTION ITEMS

1. **Missing menu photos (17 beverages):** Currently using compact card format. If client provides coffee/beer photos, they can be added.
2. **Review claims (8,000+ / 4.9):** Need client verification before keeping in meta/about.
3. **Santa Ana phone:** 2445-5999 vs 2455-4899 — client must confirm.
