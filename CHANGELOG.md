# CHANGELOG — Simmer Down Platform

## Execution Protocol — Verification Sweep · 2026-08-09

**Context.** The platform was already built and deployed to production before the Execution Protocol was applied; MASTER_SPEC.md was reverse-engineered from the live system. Per the Constitution ("never refactor working code unless explicitly asked") and the protocol's own no-opportunistic-refactor rule, BUILD was already-shipped for every drop (git-evidenced) and this pass ran the LOOP in **verification mode**: ORIENT → VERIFY (real battery) → PROVE (real requests) → LOG. No working money code was rewritten.

### Constitution battery — GREEN (real output)
| Check | Result |
|---|---|
| `tsc --noEmit` | **exit 0** — clean |
| `npm run build` | **✓ Compiled successfully in 17.9s** |
| Contamination grep (TODO/FIXME/placeholder) | **0 real** (1 false positive: "TODO el menú" = Spanish "whole menu" in ANIMA prompt) |
| Hardcoded-secret grep (sk-ant/sk_live/whsec/JWT/PEM) | **0 matches** |
| `.env.example` coverage | present, 26 vars |
| Working tree | 0 uncommitted files; all drops committed `250480d`…`a7e332b` |

### Per-drop verification (MASTER_SPEC §10)

| Drop | Status | Verified-by (real evidence) |
|---|---|---|
| **0 Infra** | ✅ closed | `GET /api/health` → `{ok:true, db:true, latencyMs:183}` |
| **1 Catalog+Content** | ✅ closed | `/carta,/restaurantes,/nosotros,/privacy,/terms` → 200; `/api/locations` → 5; `/api/menu` → `{success, categories[…]}` (real items: Agua, Café…); `/carta` HTML renders Margherita/Maradona/Fungi/Camarones/Lasaña |
| **2 Cart+Orders** | ✅ closed | `POST /api/orders/create {}` → **400 rejects empty body** (Zod); 77 real orders in prod |
| **3 Payments** ⚠️money | ✅ closed · **double-verified** | SUCCESS: 11 `completed` charges (last 2026-08-04, real ISO-00). DECLINED: 14 `failed` charges recorded, order not food-confirmed. IDEMPOTENCY: `payment_callback_nonces` table + 75 `payment_attempts` audit rows + callback "Already completed" early-return (route.ts:282). TIMEOUT: 3DS modal falls back to `/api/payments/status` poll (2 refs). |
| **4 Admin+Kitchen** | ✅ closed | `/api/admin/dashboard` → **401**, `/api/admin/orders` → **401**, `/admin` → **307→login**, `/kitchen/display` → 200 |
| **5 Loyalty** ⚠️money-adj | ✅ closed · mechanism verified | Idempotency index `uq_loyalty_earn_per_order` present; `POST /api/loyalty/redeem` unauth → **401**. Earn/idempotency/tier-promotion proven E2E with synthetic confirmed orders this session. *earned_tx=0 in prod — awaiting first real registered-member order (§Deferred).* |
| **6 Specials+Promos** | ✅ closed | `GET /api/specials` → `{success:true}` (0 live today — 2x1 window expired; gating correct). 2x1 engine proven E2E this session (subtotal→discount→total). |
| **7 ANIMA** | ✅ closed | `POST /api/anima` → real `claude-sonnet-5` reply recommending Fungi/vegetarian items; conversation-memory + live-specials injection proven this session; health-gated launcher |
| **8 Events+Tickets** ⚠️money | ✅ closed · **double-verified** | `/events` → 200 (nav-reachable, 9 concerts). Validation: bad phone → **400 "Teléfono inválido"**. IDEMPOTENCY: `event_tickets.order_id` unique (issuance-once); check-in admit-then-reject proven E2E. `/api/admin/tickets/checkin` unauth → **401**. |
| **9 Ops hardening** | ✅ closed | `/api/health` 503-on-DB-down design; dashboard KPIs render (staff E2E this session); `on_staff_sync_access` trigger present |

### Route reachability (route map §3)
Public pages 200; canonical redirects (`/menu,/locations,/about,/reservar,/eventos,/cart,/login`) resolve; admin/api gated (401/307); kitchen PIN-gated. Five-state grids documented per route in spec §3 and spot-verified on critical paths (checkout, orders, events, tickets, simmerlovers).

### Explicitly deferred (with spec section — so nothing is forgotten)
- **First real-member loyalty accrual** (§10 Drop 5) — mechanism verified; awaits organic member order. Not a defect.
- **Delivery-zone / radius validation** (§11 non-goal, but a known open gap) — checkout accepts any address; quoted to client separately.
- **PWA install, Google reviews feed, shareable specials OG cards** (§11) — planned, not in this version.
- **RSVP wiring** (`event_rsvps`, §2/§11) — dormant scaffolding; ticketing chose the paid path.
- **Delivery-aggregator webhooks** (§6/§11) — scaffolded, inactive; secrets present but unused.
- **Legacy retirement** (§3 orphans) — Sophia (`/sophia`,`/api/sophia`), duplicate cart store — cleanup, no functional impact.

### Observed, not touched (scope discipline)
- Two cart-store implementations (`lib/store.ts` active `simmerdown-cart-v3`, `store/cart.ts` legacy `simmer-down-cart`) — consolidate in a future drop.
- `menu_items.is_available` is actually column `available` — spec/DB naming note (SQL used the right column after correction).

**Verification pass owner:** Claude (Executor mode). **Battery:** GREEN. **Money paths:** double-verified. **Next:** ADVERSARIAL AUDIT — completion of construction is not completion of the product.

---

## Adversarial Audit → Gap Closure · 2026-08-10 · Hours Data Integrity

**Trigger.** Client screenshot: ANIMA told a customer *"Simmer Garden cierra los lunes."* Reconciliation audit pulled from every owned source (5 official menu PDFs, branded guide, call-prep, completion ledger, Google-export PDF, encrypted business docx) + live web/aggregators. **Finding: operating hours exist in NO owned document; the codebase hard-coded them in 5 places that had drifted apart (split-brain).** Contact/address/menu/social data verified accurate.

### Findings by severity
| ID | Sev | Finding | Status |
|---|---|---|---|
| F-01 | P0 | SEO JSON-LD (`structured-data.ts`, injected every page `<head>`) told Google: Surf City **open Mon+Tue** (really closed), San Benito Mon 11AM (really 4PM), Garden Fri–Sun (site = daily) | **CLOSED** |
| F-02 | P0 | ANIMA hard-coded rule #8 "Garden solo Vie–Dom" overrode data.ts → "closed Monday" reply | **CLOSED** |
| F-03 | P1 | ANIMA location block emitted only weekday/weekend/sunday — hid Surf City closed-days + San Benito Thursday | **CLOSED** |
| F-04 | P2 | *(observed)* `structured-data.ts` keeps a 2nd copy of location data (addresses/coords/hours) — root cause of drift; full dedup deferred | **ACCEPTED — named** |
| F-05 | P2 | *(accepted-risk)* Simmer Garden true schedule unconfirmed by any owned doc; set to data.ts value **open daily 11AM–8PM** (= what the live site already shows; 4 internal sources vs 2 drifted outliers). Owner must confirm — if Fri–Sun, it is now a ONE-LINE change in data.ts | **ACCEPTED — named** |

### Closures with proof
- **F-01** — `structured-data.ts`: San Benito/Garden/Surf City hour-blocks + FAQ string corrected to data.ts. PROOF: served JSON-LD on `GET /` → Surf City `['Wed','Thu','Fri','Sat','Sun'] 12:00–20:00` (Mon/Tue absent = closed), Garden all 7 days 11–20, San Benito Mon–Wed 16:00–22:00 / Thu 12–23 / Fri–Sun 12–01. Stale-claim greps → 0.
- **F-02** — `anima/route.ts`: deleted rule #8 (+ redundant Surf City rule); added rule forcing use of per-day block. PROOF: `grep "abre solo Viernes-Domingo"` → 0.
- **F-03** — `anima/route.ts`: location block now emits Lunes…Domingo from `data.ts`. PROOF: live `POST /api/anima` (Monday ctx) → *"Simmer Garden: sí abre los lunes, 11:00 AM a 8:00 PM. Surf City: los lunes está cerrado. Abre de miércoles a domingo."*

### Constitution battery — GREEN
`tsc --noEmit` exit 0 · `npm run build` ✓ Compiled successfully 10.6s · contamination 0 real (1 known FP "TODO el menú") · secret grep 0.

### Files touched
- `src/lib/seo/structured-data.ts` — 3 hour-blocks + 1 FAQ string
- `src/app/api/anima/route.ts` — per-day location block + rules
- `MASTER_SPEC.md` — decision #11 (hours single-source)

### Next-round mandate
100% of actionable findings were P0/P1 → per protocol, a **fresh-session adversarial audit** on data-consistency between `data.ts` and `structured-data.ts` (F-04 siblings: addresses, coords, phones, ratings/review counts) is recommended before considering the data layer clean.

---

## Adversarial Audit → Fix Pass · 2026-08-10 · 11 findings closed

Ran the 6-pass adversarial audit (0 P0, 0 P1, 2 P2, 9 P3), then fixed all. Battery GREEN after: `tsc --noEmit` exit 0 · `npm run build` ✓ Compiled 9.8s · deployed + proven live.

| ID | Sev | Finding | Fix | Proof |
|---|---|---|---|---|
| A-01 | P2 | SEO JSON-LD `foundingDate:'2012'` contradicted site-wide 2014 (served every page) | structured-data.ts → '2014' | live `curl /` JSON-LD → `"foundingDate":"2014"` |
| A-02 | P2 | Abandoned card attempts left payment 'processing' forever → order lock ("Ya hay un intento de pago"); 17 stuck rows in prod | initiate.ts: expire 'processing' >15min to 'failed' before 409 + one-time reconcile of the 17 | DB `stuck=0`; code live |
| A-03 | P2 (found P3) | ANIMA imported cart from `@/store/cart` while checkout used `@/lib/store` — ANIMA's cart-awareness + add-to-cart hit a diverged store checkout never read | migrated ANIMA to `@/lib/store` (MENU_ITEMS lookup, price→basePrice); deleted legacy `store/cart.ts` | **E2E: ANIMA add → "Maradona" in real `simmerdown-cart-v3`**, 0 console errors |
| A-04 | P3 | schema.org unverified `founder:"Marvin Medina"` + `numberOfEmployees 50–100` | removed both from structured-data.ts | not in served JSON-LD |
| A-05 | P3 | dead `cardComingSoon` string ("card payment coming soon") in a live-card system | deleted key from translations.ts | grep → 0 |
| A-06 | P3 | EasterEggs devtools art said founding "2012" | → "2014" | grep → 0 |
| A-07 | P3 | `as any` ×4 (ANIMA + Sophia speech recognition) | typed `SpeechRecognitionLike`/`SpeechWindow` shim; Sophia deleted | grep real `as any` → 0 |
| A-08 | P3 | `.env.example` missing KITCHEN_PIN, TELEGRAM_WEBHOOK_SECRET | added both | present |
| A-09 | P3 | legacy Sophia (`/sophia`, `/api/sophia`, components, schema, translation) — orphan, superseded by ANIMA | deleted all + cleaned refs | `/sophia` → 404; grep Sophia → 0 |
| A-10 | P3 | duplicate cart store | consolidated (see A-03) | 0 `@/store/cart` importers |
| A-11 | P3 | soft-404s: notFound() pages return HTTP 200 under `force-dynamic` streaming | **ACCEPTED — named**: content correct (branded not-found renders), affects only unlinked garbage URLs, fix risk to working ticket/location pages > SEO value | documented |

**Result: 10/11 fixed, 1 accepted-with-reasoning (A-11).** No P0/P1 existed; RLS boundary confirmed holding (all anon cross-tenant reads → []).
