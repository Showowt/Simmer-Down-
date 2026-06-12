# PHASE 0 — BLIND-SPOT SCAN
Gaps between "done.md gates pass" and "Grupo KASE runs this site alone."

## GAPS FOUND → NEW GATES OR DEFECTS

### 1. Cart store hydration crash (→ DEFECT D001/D002, GATE A7)
The site crashes with "Something went wrong" on checkout. This is the #1
blocker right now. Without a working cart, nothing else matters.
**Already tracked:** D001, D002, A7

### 2. No admin menu management without code deploy (→ NEW GATE)
Menu data is hardcoded in data.ts. Client cannot add/remove items, change
prices, or mark items unavailable without a code deploy. The admin panel
has a menu page but it reads from Supabase menu_items which is disconnected.
**Action:** Flag as known limitation. Admin menu CRUD works against DB but
frontend reads from data.ts. This is acceptable for launch but needs
migration to DB-driven menu post-launch.
**New gate:** None (known arch debt, not a launch blocker)

### 3. No email receipt or confirmation (→ NEW GATE)
Orders and reservations store in DB but no email goes to the customer.
WhatsApp notification to staff also doesn't fire (BLK-003).
The customer has zero confirmation beyond the success screen.
**New gate:** C10 — Customer receives order confirmation (WhatsApp or email)
**Status:** BLOCKED — depends on Twilio (BLK-003)

### 4. No order management for staff (→ OBSERVATION)
Kitchen display exists (/kitchen) but requires PIN and orders in DB.
Admin orders page exists but depends on Supabase data.
For WhatsApp-only launch, staff manage orders through WhatsApp — acceptable.
**New gate:** None (WhatsApp-only launch path)

### 5. No way to see/cancel a reservation (→ NEW GATE)
Reservations store in DB with status "confirmed" but there's no:
- Confirmation email to customer
- Customer-facing view of their reservation
- Way for customer to cancel/modify
Staff would need to check admin panel or Supabase directly.
**New gate:** D7 — Reservation has a confirmation mechanism (at minimum,
the confirmation screen tells them to call/WhatsApp to modify)
**Status:** The confirmation screen already says "Recibirás un recordatorio
por WhatsApp" — but that requires Twilio. Flag as BLK-003 dependent.

### 6. No delivery zone validation (→ OBSERVATION)
Delivery option exists but no address validation, zone checking, or
delivery radius enforcement. Client would need to manually reject
out-of-zone orders.
**New gate:** None (manual process acceptable for launch)

### 7. Events page has no real upcoming events (→ DEFECT)
The events page shows generic categories but no specific dated events.
The "featured event" timestamp was identified as placeholder.
**New defect:** D016 — Events page needs real event data or "coming soon" state
**Status:** Content blocker — client must provide event dates/details

### 8. Auth pages don't match site theme fully (→ OBSERVATION)
Auth pages were migrated from brown to black but still use old
component patterns. Functional — not a launch blocker.

### 9. Declined card path untested (→ GATE E6)
We've tested approved cards but never verified the decline path
shows a proper failure screen. Already in done.md as E6.

### 10. Success page auth code display (→ GATE E9)
The success page shows "Auth: 123456" which is a sandbox placeholder.
In production this would be a real code — but customers don't know
what it means. Should hide or label it properly.
Already in done.md as E9.

## NEW DEFECT ENTRIES
- D016: Events page has no real upcoming events (P2, content-dependent)

## VERDICT
done.md covers the technical launch gates well. The main gaps are:
1. **D001/D002** — cart/checkout crash (MUST FIX before anything)
2. **Customer confirmation** — no email/WhatsApp confirmation (blocked on Twilio)
3. **Events content** — client-dependent
4. **Menu management** — known architecture debt, acceptable for launch

No new gates needed beyond what's already tracked. Priority is fixing
the runtime crash (D001/D002) then completing MC certification (E3).
