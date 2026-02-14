# Simmer Down Database Schema Documentation

## Quick Start

```bash
# 1. Backup existing database (via Supabase Dashboard)
# 2. Run migration
cat scripts/complete-schema.sql | # paste in Supabase SQL Editor

# 3. Verify
psql $DATABASE_URL -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"

# 4. Update types in app
# Already done: src/lib/supabase/database.types.ts
```

## Schema Overview

### Core Tables (Existing)
- `profiles` - User accounts (customers, staff, admin)
- `menu_items` - Pizza menu with prices and categories
- `locations` - Physical restaurant locations
- `orders` - Customer orders with delivery tracking
- `contact_submissions` - Contact form submissions

### New Tables (Added in v2.0.0)
- `events` - Event management (Jazz nights, workshops, tastings)
- `event_registrations` - Customer event sign-ups
- `specials` - Promotions and daily deals
- `operating_hours` - Structured hours per location and day
- `customers` - Dedicated customer tracking and loyalty
- `loyalty_tiers` - Loyalty program configuration

## Entity Relationship Diagram

```
locations (1) ----< (M) events
                |
                +----< (M) operating_hours
                |
                +----< (M) orders

events (1) ----< (M) event_registrations

menu_items (1) ----< (M) specials

orders ----> (trigger) ----> customers (auto-update stats)
```

## Table Details

### events
Event management with automatic registration counting.

**Key Fields:**
- `event_date` (TIMESTAMPTZ) - Event start date/time
- `location_id` (FK) - Link to locations table
- `capacity` (INT) - Max attendees
- `registrations_count` (INT) - Auto-updated by trigger
- `is_recurring` (BOOL) - For weekly events
- `is_featured` (BOOL) - Show on homepage

**Indexes:**
- `idx_events_event_date` - Fast date queries
- `idx_events_active_featured` - Homepage featured events

**RLS:** Public read (active only), admin write

### event_registrations
Customer sign-ups for events.

**Key Fields:**
- `event_id` (FK) - Link to events
- `customer_phone` (TEXT) - Primary contact
- `party_size` (INT) - Number of guests
- `status` - confirmed | cancelled | waitlist | attended

**Triggers:**
- Updates `events.registrations_count` on insert/update/delete

**RLS:** Anyone insert, users view own, admin full access

### specials
Promotions and time-based deals.

**Key Fields:**
- `discount_type` - percentage | fixed | combo | bogo
- `menu_item_id` (FK) - Optional link to menu item
- `start_date`, `end_date` - Date range
- `day_of_week` (INT[]) - For recurring specials (0=Sun, 6=Sat)
- `start_time`, `end_time` - Time restrictions

**Indexes:**
- `idx_specials_active_dates` - Fast date range queries

**RLS:** Public read (active only), admin write

### operating_hours
Structured operating hours per location and day.

**Key Fields:**
- `location_id` (FK) - Link to locations
- `day_of_week` (INT) - 0=Sunday through 6=Saturday
- `open_time`, `close_time` (TIME) - Business hours
- `is_closed` (BOOL) - For holidays
- `is_24_hours` (BOOL) - For 24/7 locations

**Constraints:**
- UNIQUE(location_id, day_of_week) - One record per location/day

**RLS:** Public read, admin write

### customers
Dedicated customer tracking separate from auth.

**Key Fields:**
- `phone` (TEXT UNIQUE) - Primary identifier
- `loyalty_points` (INT) - Accumulated points
- `loyalty_tier` - bronze | silver | gold | platinum
- `total_orders` (INT) - Auto-updated
- `total_spent` (DECIMAL) - Auto-updated
- `last_order_at` (TIMESTAMPTZ) - Auto-updated

**Triggers:**
- Auto-created/updated when order status = 'delivered'

**RLS:** Users view own, anyone insert, admin full access

### loyalty_tiers
Loyalty program configuration.

**Key Fields:**
- `tier_name` (UNIQUE) - bronze | silver | gold | platinum
- `points_required` (INT) - Points needed to reach tier
- `discount_percentage` (INT) - Automatic discount
- `perks` (JSONB) - Additional benefits

**Sample Data:**
- Bronze: 0 points, 0% discount
- Silver: 500 points, 5% discount
- Gold: 2000 points, 10% discount
- Platinum: 5000 points, 15% discount

**RLS:** Public read, admin-only write

## Automatic Features

### Auto-Updated Timestamps
All tables have `updated_at` auto-updated via trigger:
```sql
CREATE TRIGGER table_updated_at
  BEFORE UPDATE ON table_name
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Event Registration Counter
Automatically maintains accurate count:
```sql
-- When someone registers:
registrations_count += party_size

-- When registration is cancelled:
registrations_count -= party_size
```

### Customer Stats Tracking
When order is marked 'delivered':
```sql
-- Creates or updates customer record:
total_orders += 1
total_spent += order.total
last_order_at = order.delivered_at
```

## Security Model

### Row Level Security (RLS)
EVERY table has RLS enabled. No exceptions.

### Policy Pattern
```sql
-- Public read (filtered)
CREATE POLICY "name" ON table FOR SELECT USING (is_active = true);

-- Admin write
CREATE POLICY "name" ON table FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE id = auth.uid() AND role IN ('admin', 'staff')
));
```

### Admin Setup
```sql
-- Set user as admin
UPDATE profiles SET role = 'admin' WHERE email = 'admin@simmerdown.com';
```

## Performance Considerations

### Indexed Queries (Fast)
```sql
-- Events by date
SELECT * FROM events WHERE is_active = true AND event_date >= NOW();

-- Specials active today
SELECT * FROM specials WHERE is_active = true AND start_date <= CURRENT_DATE;

-- Customer lookup
SELECT * FROM customers WHERE phone = '+503-1234-5678';

-- Orders by status
SELECT * FROM orders WHERE status = 'pending' ORDER BY created_at DESC;
```

### Non-Indexed Queries (Slow - Avoid)
```sql
-- Bad: Full table scan
SELECT * FROM events WHERE EXTRACT(MONTH FROM event_date) = 2;

-- Bad: Function on indexed column
SELECT * FROM customers WHERE LOWER(name) LIKE '%john%';

-- Good alternative: Use trigram index or full-text search
```

## Realtime Subscriptions

Enabled tables:
- `orders` - Live order tracking
- `events` - Live event updates
- `event_registrations` - Live registration counts
- `specials` - Live promotion changes

Usage:
```typescript
const subscription = supabase
  .channel('public:events')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'events' },
    (payload) => {
      console.log('Change:', payload)
    }
  )
  .subscribe()
```

## Common Queries

### Get upcoming events
```sql
SELECT e.*, l.name as location_name
FROM events e
LEFT JOIN locations l ON e.location_id = l.id
WHERE e.is_active = true
  AND e.event_date >= NOW()
ORDER BY e.event_date ASC;
```

### Get active specials
```sql
SELECT s.*, m.name as menu_item_name
FROM specials s
LEFT JOIN menu_items m ON s.menu_item_id = m.id
WHERE s.is_active = true
  AND (s.start_date IS NULL OR s.start_date <= CURRENT_DATE)
  AND (s.end_date IS NULL OR s.end_date >= CURRENT_DATE);
```

### Get today's operating hours
```sql
SELECT oh.*, l.name as location_name
FROM operating_hours oh
JOIN locations l ON oh.location_id = l.id
WHERE oh.day_of_week = EXTRACT(DOW FROM CURRENT_DATE);
```

### Customer loyalty stats
```sql
SELECT
  loyalty_tier,
  COUNT(*) as customer_count,
  AVG(total_spent) as avg_spent,
  SUM(total_orders) as total_orders
FROM customers
GROUP BY loyalty_tier
ORDER BY
  CASE loyalty_tier
    WHEN 'platinum' THEN 1
    WHEN 'gold' THEN 2
    WHEN 'silver' THEN 3
    WHEN 'bronze' THEN 4
  END;
```

## Migration Files

- `complete-schema.sql` - Full migration (run this)
- `rollback-schema.sql` - Undo migration (emergency only)
- `MIGRATION-GUIDE.md` - Detailed migration steps
- `SCHEMA-README.md` - This file

## TypeScript Types

Located: `src/lib/supabase/database.types.ts`

```typescript
import type {
  Event,
  EventRegistration,
  Special,
  OperatingHours,
  Customer,
  LoyaltyTier
} from '@/lib/supabase/database.types'
```

## Verification Checklist

After migration:
- [ ] All 6 new tables exist
- [ ] All tables have RLS enabled
- [ ] Sample data loaded (4 loyalty tiers)
- [ ] Indexes created (~20 total)
- [ ] Triggers created (updated_at, business logic)
- [ ] Admin role set on at least one user
- [ ] Test queries return expected results
- [ ] TypeScript types updated and imported
- [ ] No TypeScript compilation errors

## Support & Troubleshooting

### Check RLS is enabled
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### List all policies
```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

### Check indexes
```sql
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### View trigger definitions
```sql
SELECT tgname, tgrelid::regclass, proname
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE tgrelid::regclass::text LIKE 'events%';
```

## Version History

- **v2.0.0** (2026-02-14)
  - Initial complete schema
  - 6 new tables
  - 20+ indexes
  - Comprehensive RLS
  - Auto-update triggers
  - TypeScript types
