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
