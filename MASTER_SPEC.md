# MASTER_SPEC.md — Simmer Down Platform

> **Compiled 2026-08-09** by reverse-engineering the deployed system (simmerdownsv.com) into a complete module map. This is the anti-amnesia reference: every module, route, endpoint, table, integration, flow, and failure mode enumerated. The system is **live in production**; this documents what IS, and defines how a from-scratch rebuild would proceed (§10).
>
> Scope grounded in: 37 page routes · 34 API endpoints · 36 tables · 12 migrations · 7 integrations, all verified against prod.

---

## 1. OUTCOME STATEMENT

A customer in El Salvador can, from one bilingual (ES/EN) website on Simmer Down's own domain: browse the full menu across 5 locations, place a food order for pickup or delivery, **pay by card with 3D-Secure** (Visa/MC/Amex via FAC/Credomatic — no redirect to a third party), track that order's status live, earn and redeem **SimmerLovers** loyalty points automatically, chat with an AI concierge (**ANIMA**) that knows the real menu/prices/live promos, and **buy QR tickets to live concerts** that staff scan at the door. Restaurant staff can, from an admin panel, manage the menu/events/promos/locations, watch a live operations dashboard (sales, top sellers, tickets, loyalty), receive every paid order as a Telegram alert, and check in ticket-holders by phone camera.

**Success is measured by:** (a) a real approved card charge produces a confirmed order + awarded loyalty points + staff Telegram within seconds (verified: prod ISO-00 orders); (b) a ticket purchase issues exactly one scannable QR that admits once and is rejected on re-scan (verified); (c) zero food orders lost — displayed total always equals charged total; (d) every page renders with no runtime error and no horizontal scroll at 375px; (e) the site answers `/api/health` 200 with DB reachable.

---

## 2. MODULE TREE

```
PLATFORM (Next.js 15 App Router · TS strict · Supabase · Vercel)
│
├── I18N
│   ├── translations table (data.ts TRANSLATIONS — es/en key maps)
│   ├── store (useUIStore 'simmerdown-ui-v2' — single source of language)
│   ├── i18n context (adapter over useUIStore; keeps useI18n consumers in sync)
│   └── language toggle (header; persists; sets <html lang>)
│
├── AUTH
│   ├── customer auth (Supabase Auth — signup/login/forgot/reset)
│   │   └── on_auth_user_created trigger → customers row + 50 welcome pts
│   ├── staff auth (Supabase Auth + staff table + profiles.role='admin')
│   │   ├── middleware (protects /admin/*, refresh, role gate)
│   │   ├── requireStaff() helper (API-side: auth_user_id ∈ active staff)
│   │   └── on_staff_sync_access trigger (syncs user_id↔auth_user_id, upserts admin role)
│   └── kitchen auth (PIN-based, KITCHEN_PIN, cookie)
│
├── MENU / CATALOG
│   ├── static catalog (data.ts — 63+ bilingual items, sizes, modifiers, IVA-incl)
│   ├── DB catalog (menu_items/categories/sizes/modifiers + location overrides)
│   ├── menu image overrides (CMS-swappable photos; Supabase Storage 'menu-images')
│   ├── public menu API (/api/menu, /api/menu/images)
│   └── admin menu CRUD (/admin/menu, /admin/carta, /api/admin/menu*)
│
├── CART & CHECKOUT
│   ├── cart store (Zustand persist 'simmerdown-cart-v3'; line-key = item+size+mods;
│   │                legacy store/cart.ts 'simmer-down-cart' present — consolidate)
│   ├── promo engine (promo.ts — 2x1 traditional pizzas; shared client+server)
│   ├── cart pages (/carrito, legacy /cart→redirect)
│   ├── checkout page (review→payment→3ds→result state machine)
│   └── order creation API (/api/orders/create — Zod, pricing authority, rate-limit)
│
├── PAYMENTS (PowerTranz / FAC — CERTIFIED, do not fork)
│   ├── powertranz lib (client, schemas, sanitize, types — the gateway SDK)
│   ├── initiate (/api/payments/initiate — SPI 3DS Sale, creates payment row)
│   ├── 3DS modal (ThreeDSecureModal — iframe + postMessage + status poll)
│   ├── callback (/api/payments/callback — HMAC breakout, capture, confirm order)
│   ├── status (/api/payments/status — poll; returns loyalty + ticket token)
│   ├── void (/api/payments/void — cancel/void)
│   └── guards (payment_attempts audit, payment_callback_nonces, idempotency)
│
├── ORDERS & TRACKING
│   ├── order lifecycle (pending→confirmed→preparing→ready→out_for_delivery→completed)
│   ├── order tracking page (/orders — live 15s poll, order-type-aware stepper)
│   ├── order API (/api/orders/[orderId] — sanitized public read via UUID capability)
│   ├── receipt (/api/orders/[orderId]/receipt — printable HTML)
│   ├── customer orders (/api/customer/orders — authed history)
│   └── order counters (order_counters — sequential order_number generation)
│
├── LOYALTY (SimmerLovers)
│   ├── tier config (loyalty_tier_config — bronze/silver/gold/platinum, multipliers)
│   ├── earning (on_order_confirmed_award_loyalty trigger — $1×multiplier, idempotent)
│   ├── ledger (loyalty_transactions — earned/redeemed/bonus/...)
│   ├── rewards (loyalty_rewards — catalog)
│   ├── redemption (/api/loyalty/redeem — server-authoritative, tier+limit checks)
│   └── member UI (/simmerlovers — dashboard, rewards, history)
│
├── EVENTS & TICKETING
│   ├── events catalog (events table — published concerts, featured, capacity)
│   ├── public events (/events — hero + grid, DB-driven, capped heroes)
│   ├── events API (/api/events — upcoming published)
│   ├── ticketing (paid, native)
│   │   ├── purchase API (/api/events/tickets/create — marks order event_id)
│   │   ├── issuance (on_order_confirmed_issue_tickets trigger — atomic QR + capacity)
│   │   ├── ticket page (/boletos/[token] — QR + WhatsApp save)
│   │   ├── buy flow (/boletos/comprar/[slug] — qty + buyer + reused card checkout)
│   │   ├── door check-in (/admin/boletos/[token] + /api/admin/tickets/checkin)
│   │   └── check_in_ticket() (idempotent admit; rejects double-scan)
│   ├── rsvp (event_rsvps table — free guest-list scaffold; UNWIRED)
│   └── admin events CRUD (/admin/events — publish, feature, tickets_enabled+price)
│
├── SPECIALS / PROMOS
│   ├── specials table (client-managed; date/day windows)
│   ├── specials API (/api/specials — live-now gating, America/El_Salvador)
│   ├── specials section (home + PromoSync → cart discount)
│   └── admin specials (/admin/specials)
│
├── RESERVATIONS
│   ├── reservation form (/reservations, legacy /reservar→redirect)
│   ├── reservations API (/api/reservations — Zod, DB insert, Telegram)
│   └── reservations table
│
├── AI CONCIERGE (ANIMA)
│   ├── chat widget (AnimaChatV2 — mounted via ClientProviders, health-gated)
│   ├── anima API (/api/anima — claude-sonnet-5, live specials, conversation memory)
│   └── (legacy Sophia — /sophia, /api/sophia — superseded by ANIMA)
│
├── NOTIFICATIONS
│   ├── telegram (telegram.ts — staff order/payment/ticket/reservation alerts; PRIMARY)
│   ├── telegram bot webhook (/api/telegram/webhook — commands, /evento insert)
│   ├── whatsapp (twilio/client.ts — optional staff channel; degrades gracefully)
│   ├── order-notify formatters (order-notify.ts — self-contained staff messages)
│   └── customer WhatsApp receipts (wa.me deep-links — NO email, per SV market)
│
├── ADMIN PANEL (staff-gated)
│   ├── dashboard (/admin — KPIs, WoW deltas, 7d revenue, hourly, by-location,
│   │              top sellers, SimmerLovers, promos, tickets, recent orders)
│   ├── dashboard API (/api/admin/dashboard — SV-tz aggregation, tickets excluded from food rev)
│   ├── orders (/admin/orders + /api/admin/orders — filter, status update)
│   ├── menu (/admin/menu, /admin/carta + /api/admin/menu*, menu-image, menu-item)
│   ├── events (/admin/events)
│   ├── specials (/admin/specials)
│   ├── locations (/admin/locations)
│   ├── fotos (/admin/fotos — gallery CMS, Storage 'images')
│   ├── inquiries (/admin/inquiries — contact submissions)
│   ├── settings (/admin/settings)
│   └── payments admin (/api/admin/payments)
│
├── KITCHEN DISPLAY
│   ├── kitchen login (/kitchen/login + /api/kitchen/auth — PIN)
│   └── kitchen display (/kitchen/display — active order board)
│
├── CONTENT / MARKETING
│   ├── home (/(public) — hero, specials, events, cinematic sections)
│   ├── locations (/restaurantes, /locations/[slug])
│   ├── about (/nosotros), contact (/contact + /api/contact)
│   ├── legal (/privacy, /terms)
│   └── SEO (per-route layout metadata, OG images, sitemap, robots, structured-data)
│
├── DELIVERY INTEGRATIONS (scaffolded, inactive)
│   └── third-party webhook (/api/delivery/webhook/[provider] — uber/doordash/hugo/pedidosya)
│
└── INFRA / CROSS-CUTTING
    ├── supabase clients (browser/server/service/api/middleware — RLS boundary)
    ├── rate limiting (rate-limit.ts — in-memory per-IP, per-endpoint)
    ├── validation (validation.ts — Zod schemas, bilingual errors)
    ├── logging (logger.ts — console.error with [Context])
    ├── health (/api/health — app+DB check for uptime monitors)
    └── error/loading boundaries (per-segment error.tsx / loading.tsx)
```

**Completeness note:** every leaf maps to an existing or planned owner-file. RSVP (`event_rsvps`) and delivery webhooks are present in the data/route layer but **not wired end-to-end** — flagged as dormant in §11.

---

## 3. ROUTE MAP

**Legend:** Auth — 🌐 public · 🔑 customer · 🛡️ staff/admin · 🍳 kitchen-PIN. States abbreviated L/E/Er/S/P = loading/empty/error/success/partial.

### Public pages
| Route | Auth | Loads | 5 states | Navigates to | Reached from |
|---|---|---|---|---|---|
| `/` | 🌐 | specials, events (API), static hero | L skeleton · E (no specials → hero only) · Er (fallback content) · S full · P (events load after paint) | carta, events, restaurantes, checkout | root, nav, ads |
| `/carta` | 🌐 | menu (data + DB overrides) | L skeleton · E "sin items" · Er fallback catalog · S grid · P images lazy | item sheet→cart | nav, home |
| `/carrito` | 🌐 | cart store | L mount · **E "carrito vacío"** · Er n/a · S lines+total · P promo applied | checkout, carta | cart icon, carta |
| `/checkout` | 🌐 | cart, location | L mount skeleton · E empty→redirect · Er payment error banner · S result · P 3ds in progress | orders (on paid), carrito | carrito |
| `/orders` | 🌐 (UUID cap) | order via API, 15s poll | L spinner · E "no encontrado" · Er timeout · S stepper+details · P polling active | carta, wa.me | success screen, receipt, WhatsApp |
| `/events` | 🌐 | events (direct DB read) | L skeleton · E fallback event · Er fallback · S heroes+grid · P images | boletos/comprar, contact | **nav "Eventos"**, home |
| `/boletos/comprar/[slug]` | 🌐 | event (server) | L n/a · E "no disponible/agotado" · Er create fail · S review→pay→result · P 3ds | boletos/[token], events | events buy button |
| `/boletos/[token]` | 🌐 (token cap) | ticket+event (service) | L n/a · E 404 · Er n/a · S QR ticket · P used/void banner | events, wa.me | success screen, WhatsApp |
| `/simmerlovers` | 🌐/🔑 | tiers, rewards, customer (authed) | L guest view SSR · E guest CTA · Er toast · S member dashboard · P redeeming | auth/signup, rewards | nav, success screen |
| `/reservations` | 🌐 | form | L n/a · E n/a · Er field errors · S confirmation · P submitting | contact | nav, home |
| `/restaurantes` | 🌐 | locations | L n/a · E n/a · Er n/a · S list · P — | locations/[slug] | nav |
| `/locations/[slug]` | 🌐 | location detail | L n/a · E 404 · Er n/a · S detail+map · P — | carta, reservations | restaurantes |
| `/nosotros` | 🌐 | static | S · (others n/a) | — | nav |
| `/contact` | 🌐 | form | Er field · S sent · P submitting | wa.me | nav, footer |
| `/account` | 🔑 | profile, orders | L · E no orders · Er · S · P | orders | header (authed) |
| `/privacy`,`/terms` | 🌐 | static legal | S | — | footer |
| `/auth/login`,`/signup`,`/forgot-password`,`/reset-password` | 🌐 | — | Er invalid · S redirect · P submitting | account/admin | header, gated routes |

### Admin pages (all 🛡️ — middleware gate on `profiles.role='admin'`)
| Route | Loads | Key states |
|---|---|---|
| `/admin` | dashboard API + realtime orders | L spinner · E "no orders" · S full dashboard · P realtime refresh |
| `/admin/orders` | orders (filterable) | L · E · Er retry · S table · P status-updating |
| `/admin/menu`,`/admin/carta` | menu CRUD | L · E · S · P saving |
| `/admin/events` | events CRUD + ticket config | L · E "crear primero" · S cards · P saving |
| `/admin/specials` | specials CRUD | L · E · S · P |
| `/admin/locations` | locations CRUD | L · E · S · P |
| `/admin/fotos` | gallery CMS (Storage) | L · E · S · P uploading |
| `/admin/inquiries` | contact submissions | L · E · S · — |
| `/admin/settings` | settings | L · S · P saving |
| `/admin/boletos/[token]` | ticket (service) | E 404 · S admit button · P admitting · (used/void terminal) |

### Kitchen (🍳)
| Route | Notes |
|---|---|
| `/kitchen/login` | PIN entry → cookie |
| `/kitchen/display` | active-orders board (PIN-gated) |

### Redirects (308/307)
`/menu→/carta` · `/locations→/restaurantes` · `/about→/nosotros` · `/reservar→/reservations` · `/eventos→/events` · `/cart→/carrito` · unauthed `/admin/*→/auth/login?redirect=…`

### ⚠️ Orphans / legacy (flagged)
- `/sophia` + `/api/sophia` — **superseded by ANIMA**; not linked in nav. *Decision: retire or keep as internal.*
- `/login`, `/(public)/cart` — already redirect shims to `/auth/login` and `/carrito`; harmless, optional cleanup.
- Two cart stores (`lib/store.ts` active `simmerdown-cart-v3`, `store/cart.ts` legacy) — consolidate to one.
- `event_rsvps` has no page/route wired — RSVP is dormant scaffolding.

---

## 4. API CONTRACT TABLE

**Common:** JSON bodies; Zod-validated; consistent `{ success, data?/…, error?, message? }`; per-IP rate limiting; bilingual error messages. Auth column same legend as §3.

| Method · Path | Auth | Request | Response (2xx) | Errors | Called by |
|---|---|---|---|---|---|
| POST `/api/orders/create` | 🌐 | `{locationId, orderType, customerName, customerPhone, customerEmail?, notes?, deliveryAddress?, deliveryCity?, items[]}` | `{success, order:{id,orderNumber,subtotal,deliveryFee,discount,total}}` | 400 validation · 409 dup/location-gate · 429 rate · 500 | checkout |
| POST `/api/payments/initiate` | 🌐 | `{orderId, card, billing}` | `{success, spiToken, redirectData, orderId, paymentId}` | 400 · 404 order · 409 already-processing · 5xx gateway | checkout, TicketCheckout |
| POST `/api/payments/callback` | 🌐 (HMAC) | PowerTranz form (SpiToken, Response) | HTML breakout (postMessage) | 404 unknown token · returns HTML always | PowerTranz (server-to-server) |
| GET `/api/payments/status?orderId` | 🌐 | query orderId | `{success, order:{…,paymentStatus,status,total}, loyalty, ticketToken}` | 400 · 404 · 429 | 3DS modal poll, success screens |
| POST `/api/payments/void` | 🛡️ | `{paymentId}` | `{success}` | 401 · 404 · 5xx | admin |
| GET `/api/orders/[orderId]` | 🌐 (UUID cap) | path uuid | `{success, data:{…receipt-grade, items[], payment_status, card_brand, card_last4}}` | 400 bad-uuid · 404 · 429 · 500 | /orders page |
| GET `/api/orders/[orderId]/receipt` | 🌐 (UUID cap) | path uuid | printable HTML | 400 · 404 | success screen, /orders |
| GET `/api/customer/orders` | 🔑 | session | `{orders[]}` | 401 | /account |
| POST `/api/events/tickets/create` | 🌐 | `{eventSlug, quantity(1-10), buyerName, buyerPhone}` | `{success, orderId, orderNumber, quantity, unitPrice, total, eventTitle}` | 400 validation · 404 event · 409 not-on-sale/ended/sold_out · 429 · 500 | TicketCheckout |
| POST `/api/admin/tickets/checkin` | 🛡️ | `{token}` | `{ok, admitted, quantity}` or `{ok:false, reason:'already_used'/'void'/'not_found', …}` | 400 bad-token · 401 · 500 | CheckInButton |
| POST `/api/loyalty/redeem` | 🔑 | `{reward_id}` | `{success, reward_name, points_deducted, new_balance}` | 401 · 400 insufficient/tier/limit · 429 | /simmerlovers |
| POST `/api/anima` | 🌐 | `{message, context:{…,currentTime,dayOfWeek,language}, history[]?}` | `{success, response, suggestedItems[], actions[], intent}` | 400 validation · 429 · 503 not-configured · 500→graceful WA fallback | AnimaChatV2 |
| GET `/api/events` | 🌐 | `?location?&featured?` | `{success, events[]}` (cached 120s) | 429 · 500 | home EventsSection |
| GET `/api/specials` | 🌐 | — | `{success, specials[](is_live)}` | 429 · 500 | home, PromoSync |
| GET `/api/menu`, `/api/menu/images` | 🌐 | — | `{items[]}` / `{images[]}` | 500 | carta |
| GET `/api/locations` | 🌐 | — | `{success, locations[]}` | 500 | order flow, location bar |
| POST `/api/reservations` | 🌐 | `{name, phone, date, time, partySize, location, notes?}` | `{success}` | 400 · 429 · 500 | /reservations |
| POST `/api/contact` | 🌐 | `{name, email?, phone?, reason, message}` | `{success}` | 400 · 429 · 500 | /contact |
| GET `/api/admin/dashboard` | 🛡️ | — | `{today, deltas, week, week7, hourlyToday, byLocation, topItems, loyalty, tickets}` | 401 · 500 | /admin |
| GET/POST `/api/admin/orders` | 🛡️ | filters / `{status,notes}` | `{orders[],total}` / `{success}` | 401 · 400 · 500 | /admin/orders |
| `/api/admin/menu*`,`menu-item`,`menu-image`,`payments` | 🛡️ | CRUD | `{success,…}` | 401 · 400 · 500 | admin menu/payments |
| POST `/api/kitchen/auth` | 🍳 | `{pin}` | `{success}`+cookie | 401 | /kitchen/login |
| POST `/api/telegram/webhook` | 🌐 (secret) | Telegram update | `{ok}` | 401 bad-secret | Telegram |
| POST `/api/telegram/setup` | 🛡️ | — | `{success}` | 401 | one-time setup |
| POST `/api/delivery/webhook/[provider]` | 🌐 (secret) | provider payload | `{ok}` | 401 · 400 | **inactive** |
| GET `/api/health` | 🌐 | — | `{ok, db, latencyMs, time}` (503 if DB down) | 503 | uptime monitor |
| POST `/api/sophia` | 🌐 | legacy | — | — | **legacy/orphan** |

**Dead-endpoint check:** `/api/sophia` (orphan), delivery webhooks (inactive) — candidates to cut or gate. **Hole check:** every §3 page's data need maps to an endpoint above (or a direct RLS-guarded Supabase read).

---

## 5. DATA MODEL

**RLS posture:** enabled on all customer/payment/order/loyalty/event tables. Public (anon) may SELECT only published/public rows (menu, locations, specials, published events). Writes to orders/payments/tickets/loyalty go through **service-role server code**; direct client writes to balance/ticket tables are REVOKED. Staff read/write gated by `is_staff(roles[])`. Money-mutating balances/issuance are written **only** by SECURITY DEFINER functions + triggers.

### Core tables (columns abbreviated; ★ = indexed; RLS one-line)
| Table | Key columns | RLS | R/W by |
|---|---|---|---|
| `customers` | id, auth_user_id★(uniq), email, phone★, first/last_name, loyalty_tier(enum), loyalty_points_balance, lifetime_points_earned, referral_code(uniq), marketing_opt_ins, totals, created_at | select/insert/update self (auth_user_id=uid); UPDATE revoked from clients (balances via functions) | signup trigger, loyalty fns, /simmerlovers read |
| `profiles` | id(=auth uid), role | self-read; role gate for admin | staff auth, middleware |
| `staff` | id, auth_user_id, user_id, email, name, role, is_active | self-read/update | requireStaff, admin |
| `locations` | id, slug★, name, city, phone, delivery_enabled, delivery_fee, is_accepting_orders, hours, coords | public read | everywhere |
| `menu_items` (+categories, sizes, modifiers, *_overrides) | id, categoryId, name/nameEs, basePrice, flags, image, sizes, modifiers | public read published | carta, order pricing |
| `orders` | id, order_number★(counter), customer_id, location_id★, order_type(enum), status(enum)★, customer_name/phone/email, subtotal, delivery_fee, discount_amount, total_amount, event_id★(→events), ticket_quantity, points_earned/redeemed, timestamps | insert authed; update-own-pending; staff all; service all | create API, callback, triggers, dashboard |
| `order_items` | id, order_id★, menu_item_id, item_name, unit_price, quantity, modifiers, line_total | via order | create API, receipt, dashboard |
| `order_counters` | date, seq | service only | order_number gen |
| `payments` | id, order_id★, amount, currency, payment_method(enum), status(enum), card_last_four, card_brand, authorization_code, spi_token, powertranz_*, processor_response, error_code, timestamps | service; staff read | initiate, callback, status, void |
| `payment_attempts` | id, order_id, payment_id, stage, response_payload, iso_response_code, http_status | service; audit | callback (audit trail) |
| `payment_callback_nonces` | nonce, used | service | callback replay guard |
| `loyalty_tier_config` | tier(enum), min_lifetime_points, points_multiplier | public read | earn/promote logic |
| `loyalty_transactions` | id, customer_id★, transaction_type(enum), points, balance_after, order_id★(uniq for 'earned'), reward_id, description, created_at★ | self-read; INSERT/UPDATE/DELETE revoked from clients | earn trigger, redeem API |
| `loyalty_rewards` | id, name/name_es, points_required, min_tier_required, reward_type, active | public read | /simmerlovers, redeem |
| `events` | id, title/title_es, slug★(uniq), description*, starts_at★, custom_venue, location_id, image_url, is_featured, is_published★, rsvp_enabled, has_capacity_limit, max_capacity, current_rsvps, tickets_enabled, ticket_price, tickets_sold, tags | public read published; staff all | /events, tickets, admin |
| `event_tickets` | id, order_id(uniq)→orders, event_id★→events, qr_token★(uniq), quantity, admitted_count, status(valid/used/void), buyer_name/phone, unit_price, total_amount, oversold, issued_at, checked_in_at/by | service; staff read; client writes revoked | issue trigger, ticket pages, checkin |
| `event_rsvps` | id, event_id, customer_id, guest_name/email/phone, party_size, status | (dormant) | — |
| `specials` | id, title, description, discount_type, discount_value, menu_items[], start_date, end_date, days_of_week, active, featured, image_url | public read active; staff all | /api/specials, promo, admin |
| `reservations` | id, name, phone, date, time, party_size, location, status, notes | insert public; staff read | /api/reservations |
| `contact_submissions` | id, name, email, phone, reason, message, created_at | insert public; staff read/update/delete | /api/contact, /admin/inquiries |
| `settings` | key, value | staff | /admin/settings |
| `audit_log`, `notifications`, `notification_*`, `referrals`, `promo_codes`, `customer_addresses`, `menu_image_overrides` | supporting | mixed | various |

### Enums
- `order_status`: pending · confirmed · preparing · ready · out_for_delivery · completed · cancelled · refunded
- `order_type`: dine_in · delivery · pickup *(NOTE: raw inserts must use these; 'takeout' rejected)*
- `payment_status`: pending · processing · completed · failed · cancelled · refunded · partially_refunded
- `loyalty_tier`: bronze · silver · gold · platinum
- `loyalty_transaction_type`: earned · redeemed · bonus · adjusted · expired · referral (+legacy aliases)

### Triggers (money/state integrity)
- `auth.users` → `on_auth_user_created` (customers row + 50 pts)
- `orders` → `on_order_confirmed_award_loyalty`, `on_order_confirmed_issue_tickets`, `trigger_update_customer_stats`, `trigger_orders_updated_at`
- `staff` → `on_staff_sync_access`, updated_at · `events` → `events_updated_at`

### Migration order (dependency-sorted, as shipped)
`001_profiles` → `20250211_insert_menu_items` → `20250211_menu_lago_coatepeque` → `20260214_admin_tables` → `20260415_powertranz_payments` → `20260423_security_hardening` → `20260615_events` → `20260729_delivery_fee_and_images_storage` → `20260801_customer_signup_trigger` → `20260801_delivery_available` → `20260804_loyalty_earning` → `20260804_staff_access_sync` → `20260808_event_tickets`

---

## 6. INTEGRATION REGISTER

| Service | Purpose | Env vars | Degraded-mode behavior (user-facing) | Limits/cost |
|---|---|---|---|---|
| **Supabase** (Postgres+Auth+Storage+RLS) | System of record, auth, file storage | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | DB down → `/api/health` 503; pages show fallback content (static menu, fallback events); order/pay blocked with error toast, never a crash | project tier; daily physical backups on (PITR = paid upgrade) |
| **PowerTranz / FAC (Credomatic)** | 3DS card payments (Visa/MC/Amex) | `FAC_API_ROOT`, `FAC_POWERTRANZ_ID`, `FAC_POWERTRANZ_PASSWORD`, `FAC_CURRENCY_CODE`(840), `PAYMENT_CALLBACK_SECRET` (HMAC) | gateway error → payment marked failed, "Pago no procesado, no se realizó ningún cargo", customer retries or orders via WhatsApp | MC certified (prod ISO-00); values must have **no trailing newline** |
| **Anthropic Claude** | ANIMA concierge (`claude-sonnet-5`) | `ANTHROPIC_API_KEY` | empty/invalid key → launcher **hidden** (GET /api/anima `enabled:false`); mid-chat failure → graceful "estoy tomando un descanso, ordena por WhatsApp" | per-call; thinking disabled, max_tokens 600 |
| **Telegram** (staff, PRIMARY) | Order/payment/ticket/reservation alerts + bot commands | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET` | send failure swallowed (logged); never blocks the payment/order response | free |
| **Twilio WhatsApp** (staff, OPTIONAL) | Secondary staff alert channel | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`, `STAFF_NOTIFICATION_WHATSAPP` | not configured → skipped silently (Telegram covers it) | per-message; opt-in window |
| **qrcode** (lib) | Ticket QR generation (server-side) | — | n/a (deterministic) | — |
| **Vercel** | Hosting, deploys, env, edge | (platform) | build/deploy gated; env values verified byte-clean | — |
| **Delivery aggregators** (INACTIVE) | Uber Eats / DoorDash / Hugo / PedidosYa webhooks | `UBER_EATS_WEBHOOK_SECRET`, `DOORDASH_WEBHOOK_SECRET`, `HUGO_WEBHOOK_SECRET`, `PEDIDOS_YA_WEBHOOK_SECRET` | scaffolded only — not enabled | — |
| **Customer WhatsApp receipts** | wa.me deep-links (no API) | — | always works; user taps to save receipt/ticket to any chat. **No email integration by design** (SV market) | free |

---

## 7. USER FLOW STATE MACHINES

### A. Card checkout (food)
```
REVIEW ──(valid name+phone[+addr if delivery])──> create order (pending)
  │ invalid → stay, show field error
  └─> PAYMENT (card form)
        │ submit → /initiate
        │   gateway error → stay PAYMENT, banner "no se pudo iniciar"
        └─> 3DS (iframe challenge)
              ├─ postMessage paid ─┐
              ├─ poll status paid ─┤─> RESULT:paid → confirm order (trigger: loyalty)
              │                    │      → clearCart → success (loyalty + WA receipt + track)
              ├─ 3D fail / ISO≠00 ─┴─> RESULT:failed "no se realizó cargo" → retry→REVIEW
              ├─ user closes modal → back to PAYMENT ("verificación cancelada")
              └─ timeout 5min → RESULT:failed
Money failure states: declined(ISO≠00)→failed screen · webhook/callback never arrives→status poll still resolves via /status · double-submit→409 already-processing (idempotent on spi_token) · pay-twice→second attempt sees order already confirmed
```

### B. Ticket purchase
```
BUY(review: qty+name+phone) ──> /events/tickets/create
  ├─ sold_out/ended/not-on-sale → 409 message, block
  └─ order(pending, event_id) → PAYMENT → 3DS  (reuses flow A)
        └─ paid → confirm → on_order_confirmed_issue_tickets (atomic, capacity, idempotent)
              → /status returns ticketToken → RESULT: "Ver mi boleto (QR)"
        Oversell race (2 buyers, last seats): both honored (paid), 2nd flagged oversold → staff alert
```

### C. Door check-in
```
SCAN QR → /admin/boletos/[token]  (unauth → redirect login)
  staff taps Admitir → check_in_ticket()
    ├─ valid → USED (admitted=quantity)  [green ✓]
    ├─ already used → reject, show prior admit + time  [amber]
    └─ void/not_found → reject  [red]
  Idempotent: repeat scan never double-admits
```

### D. Loyalty
```
SIGNUP → trigger: customers row + 50 pts (welcome)
ORDER CONFIRMED → trigger: floor(total × tier_multiplier) pts, once per order (uniq index)
  tier recompute from lifetime (never downgrades)
REDEEM (/api/loyalty/redeem) → check balance+tier+limit → deduct + ledger (server-authoritative)
```

### E. ANIMA chat
```
WIDGET MOUNT → GET /api/anima (health) → enabled? show launcher : hide
SEND msg (+last 6 turns history) → claude-sonnet-5 (live specials injected)
  ├─ ok → render answer + suggested items + action chips
  ├─ 503 not-configured → "descanso, ordena por WhatsApp"
  └─ error → graceful fallback (never a stack trace)
```

---

## 8. FAILURE MODE ENUMERATION

| Failure | Designed behavior (never "crash") |
|---|---|
| Supabase unreachable | `/api/health` 503; public pages render static/fallback content; order+pay blocked with toast |
| PowerTranz gateway 5xx / timeout | payment→failed, "no se realizó ningún cargo", retry or WhatsApp path; audit row in payment_attempts |
| Card declined (ISO≠00) | failure screen (not "confirmado"); staff NOT told to prepare |
| 3DS callback never arrives | 3DS modal falls back to polling `/api/payments/status` (server truth); 5-min timeout → failed |
| Double-submit payment | 409 "already processing"; idempotent on `spi_token` |
| Callback replay | `payment_callback_nonces` + HMAC signature reject re-use |
| Ticket oversell race | issuance atomic (row lock); both paid tickets honored, 2nd flagged `oversold` → staff alert |
| Ticket double-scan | `check_in_ticket` rejects `already_used` with prior timestamp |
| Loyalty double-award | unique partial index on `loyalty_transactions(order_id) where type='earned'` |
| Empty data (no menu/events/specials) | fallback catalog / fallback event / "no promos hoy" — never blank |
| Malformed API input | Zod 400 with bilingual message; never a 500 |
| Auth expiry mid-action | middleware refresh; admin actions → redirect to login preserving `?redirect=` |
| Anthropic key missing/invalid | ANIMA launcher hidden; no broken widget |
| Telegram/Twilio send fails | swallowed + logged; payment/order response unaffected |
| Env var trailing newline | code trims defensively (BLK-006 lesson); ANIMA/health explicit trim |
| New staff mis-provisioned | `on_staff_sync_access` trigger syncs both id columns + admin role (no silent lockout) |
| Rate-limit hit | 429 with polite ES message + retry hint |
| Horizontal overflow at 375px | audited; `overflow-hidden` guards on animated sections |
| Order not found / bad UUID | 404/400 friendly message on /orders |
| Unpaid/pending order abandoned | stays `pending`; never counted as revenue; loyalty/tickets only on `confirmed` |

---

## 9. NON-FUNCTIONAL FLOOR

- **Mobile-first**: primary device is a phone; breakpoints 375 / 640 / 768 / 1024 / 1280; **no horizontal scroll at 375px** (audited).
- **Languages**: Spanish (primary) + English, every user-facing string; language persists; `<html lang>` updates.
- **Response times**: `/api/health` < 500ms; menu/events cached (s-maxage 120s); dashboard aggregates server-side.
- **Accessibility**: visible `:focus-visible`; alt text on images; min 44px tap targets on controls; Lighthouse a11y ≥ 90 (home/carta verified 95).
- **Performance**: Lighthouse perf ≥ 90 (home/carta verified 91).
- **SEO/OG**: per-route metadata + OG images for all share paths; sitemap (canonical slugs), robots (blocks admin/api/kitchen/checkout), schema.org structured data; branded bilingual 404.
- **Payments compliance**: no PAN persisted (only last4 + brand); FAC field compliance; PAN-leak DB guard.
- **Legal**: `/privacy`, `/terms` present with real content.
- **Money integrity**: displayed total === charged total, always (server is pricing authority).

---

## 10. BUILD ORDER (dependency-sorted drops)

*(Reverse-engineered from the shipped system; a from-scratch rebuild follows this. No drop imports from a later drop. Demo-able by Drop 3.)*

| Drop | Goal | Files (created/modified) | Depends on | Acceptance | Verify |
|---|---|---|---|---|---|
| **0 Infra** | Next15+TS+Supabase+Vercel skeleton, i18n, RLS baseline | supabase clients, middleware, data.ts (catalog+TRANSLATIONS), layout, error/loading | — | app boots, ES/EN toggle, RLS on | `npm run build`; `/api/health` 200 |
| **1 Catalog+Content** | Menu, locations, home, legal, SEO | carta, restaurantes, nosotros, privacy/terms, /api/menu, /api/locations, migrations 001/menu | 0 | menu renders 5 locations, bilingual | curl routes 200; Lighthouse |
| **2 Cart+Orders(WhatsApp)** | Cart, order creation, WhatsApp CTA, tracking | cart store, carrito, checkout(review), /api/orders/create, /orders, order_counters | 1 | order creates, number generated, trackable | E2E order; DB row |
| **3 Payments (DEMO-ABLE)** | PowerTranz 3DS card path | powertranz lib, initiate/callback/status/void, CardPaymentForm, ThreeDSecureModal, payments+attempts+nonces migration | 2 | Visa/Amex ISO-00 in browser; failed shows no-charge | prod ISO-00 order + payment_attempts |
| **4 Admin+Kitchen** | Staff auth, order mgmt, menu/locations CRUD, kitchen display | admin layout+middleware, /admin/*, /api/admin/*, kitchen, staff+profiles, admin_tables migration | 2 | staff login → manage orders/menu | staff session E2E |
| **5 Loyalty** | SimmerLovers earn/redeem/tiers | signup trigger, loyalty_earning migration, /api/loyalty/redeem, /simmerlovers, tier_config | 3,4 | confirmed order awards pts; redeem works | synthetic order → pts |
| **6 Specials+Promos** | Client-managed promos, 2x1 engine | specials table+API, promo.ts, PromoSync, /admin/specials | 4 | 2x1 shows in cart; server re-validates | E2E 2x1 |
| **7 ANIMA** | AI concierge | /api/anima (sonnet-5), AnimaChatV2, ClientProviders, health-gate | 1 | answers menu/promos; hidden if no key | live chat E2E |
| **8 Events+Tickets** | Public events, native paid ticketing, door check-in | events nav, /events, event_tickets migration, tickets/create, /boletos/*, /admin/boletos, checkin, admin ticket config, dashboard tickets | 3,4,5 | buy → QR → scan admits once | synthetic confirmed order E2E |
| **9 Ops hardening** | Dashboard, health, staff sync, WhatsApp receipts | /admin dashboard+API, /api/health, staff_sync migration, wa.me receipts | 4,5,8 | dashboard KPIs; health 503 on DB down | staff dashboard render |

---

## 11. EXPLICIT NON-GOALS

This version deliberately does **NOT**:
- **Email** anything (SV market uses WhatsApp; receipts/tickets are wa.me). No Resend/SMTP.
- **Native mobile apps** (iOS/Android) — the web app is the product (PWA install is a future add).
- **Driver GPS / live delivery tracking / route optimization** — delivery status is staff-driven, not GPS.
- **Delivery-zone / radius validation** — checkout currently accepts any delivery address (quoted separately; known gap).
- **Third-party delivery aggregator sync** (Uber/DoorDash/Hugo/PedidosYa) — webhooks scaffolded, inactive.
- **Free-RSVP guest lists** — `event_rsvps` exists but is dormant; ticketing chose the paid path.
- **POS / Retail One integration** — web orders run independent of the BAC POS.
- **Ticket tiers / reserved seating / refunds-in-app** — single GA price per event; refunds handled manually.
- **Multi-currency** — USD only (El Salvador).
- **Sophia (legacy AI)** — superseded by ANIMA; retire.
- **Google reviews feed / shareable specials OG cards / PWA** — planned, not in this version.

---

## DECISIONS (defaults chosen where the system was silent)

1. **Reuse orders+payments for tickets** (vs. separate ticket-payment tables) — keeps the FAC-certified 3DS pipeline untouched; tickets are `orders` marked `event_id`, issued by a trigger at the same confirm point as loyalty. *Rationale: zero risk to certified money path.*
2. **Issuance & loyalty via DB triggers, not callback edits** — atomic + idempotent at the DB layer; the payment route stays a black box. *Rationale: correctness by construction.*
3. **Telegram = primary staff channel, Twilio WhatsApp = optional** — Telegram is free and verified; Twilio degrades silently. *Rationale: no hard dependency on paid SMS.*
4. **WhatsApp receipts, never email** — SV market reality (recorded as a permanent org rule). *Rationale: adoption + zero infra.*
5. **Single dark theme** — the brand is a dark gastro-musical identity; no light mode. *Rationale: deliberate visual world.*
6. **Ticket QR encodes the staff check-in URL** — scanning with any phone camera lands a logged-in staffer on the admit screen; no separate scanner app. *Rationale: no new hardware/app.*
7. **Static catalog in data.ts as fallback** for DB catalog — pages never blank if DB hiccups. *Rationale: fallback-first.*
8. **Language single-source in useUIStore**, i18n context as adapter — prevents the split-brain toggle bug. *Rationale: one source of truth.*
9. **Capacity gate at purchase-start + honor-on-oversell** — never take money for a sold-out show; the rare race still honors a paid ticket and flags staff. *Rationale: customer-first, venue absorbs edge.*
10. **order_type='pickup' for ticket orders** — the enum lacks a ticket type; `event_id` is the real discriminator. *Rationale: don't fork the enum.*
11. **Location HOURS single-source = `src/lib/data.ts` LOCATIONS.hours** — every displayed-hours surface (restaurantes, homepage, LocationSheet, LocationDetail, LocationsClient) plus ANIMA read from it; SEO `structured-data.ts`, Telegram `handleHorarios`, and reservations mirror it. ANIMA emits an explicit per-day block and must not assert open/closed days from hard-coded rules. DB `locations.operating_hours` gates order-acceptance only, never displayed text. *Rationale: one source of truth — closes the 2026-08-10 hours split-brain audit (F-01…F-05).*
```
COMPLETENESS PASS
✓ every outcome noun → module (menu, order, payment, tracking, loyalty, ANIMA, events, tickets, admin, kitchen)
✓ every module → routes + endpoints + tables
✓ every route → 5 states
✓ every integration → degraded mode
✓ every money flow → failure states (declined, no-webhook, double-submit, pay-twice, oversell)
✓ orphans flagged (sophia, /login dup, event_rsvps, delivery webhooks)
```
