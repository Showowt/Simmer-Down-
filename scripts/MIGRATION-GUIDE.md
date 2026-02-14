# Simmer Down Database Schema Migration Guide
Version: 2.0.0 | Date: 2026-02-14

## Overview
This migration adds complete admin functionality to Simmer Down with events, specials, operating hours, customer tracking, and loyalty program support.

## New Tables Added
1. **events** - Event management with registrations tracking
2. **event_registrations** - Customer event sign-ups
3. **specials** - Promotions and daily deals
4. **operating_hours** - Structured hours per location
5. **customers** - Dedicated customer tracking and loyalty
6. **loyalty_tiers** - Loyalty program configuration

## Migration Steps

### 1. Pre-Migration Backup
```bash
# Via Supabase Dashboard
# Project Settings > Database > Backup
# Or via CLI (if installed)
npx supabase db dump --file backup-$(date +%Y%m%d).sql
```

### 2. Run Migration
```sql
-- In Supabase SQL Editor (https://supabase.com/dashboard)
-- Copy and paste contents of: scripts/complete-schema.sql
-- Execute the entire script
```

### 3. Verify Migration
```sql
-- Check all tables exist
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('events', 'event_registrations', 'specials', 'operating_hours', 'customers', 'loyalty_tiers');
-- Expected: 6 rows

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('events', 'event_registrations', 'specials', 'operating_hours', 'customers', 'loyalty_tiers');
-- Expected: All rows should have rowsecurity = true

-- Check indexes created
SELECT tablename, indexname FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('events', 'event_registrations', 'specials', 'operating_hours', 'customers');
-- Expected: ~20 indexes

-- Check sample data
SELECT COUNT(*) FROM loyalty_tiers; -- Expected: 4 (bronze, silver, gold, platinum)
SELECT COUNT(*) FROM operating_hours; -- Expected: 7 (if Santa Ana location exists)
```

### 4. Test RLS Policies

#### Test as Public User (not logged in)
```sql
-- Should work
SELECT * FROM events WHERE is_active = true;
SELECT * FROM specials WHERE is_active = true;
SELECT * FROM operating_hours;

-- Should fail
INSERT INTO events (title, event_date) VALUES ('Test', NOW());
UPDATE events SET title = 'Hacked' WHERE id = '...';
```

#### Test as Admin User
```sql
-- Set admin role first
UPDATE profiles SET role = 'admin' WHERE email = 'your-admin@email.com';

-- Should all work
INSERT INTO events (title, event_date) VALUES ('Test Event', NOW());
UPDATE events SET is_featured = true WHERE title = 'Test Event';
DELETE FROM events WHERE title = 'Test Event';
```

### 5. Update Application Code

#### Import New Types
```typescript
// Update imports in your components
import type {
  Event,
  EventRegistration,
  Special,
  OperatingHours,
  Customer,
  LoyaltyTier
} from '@/lib/supabase/database.types'
```

#### Example Query Usage
```typescript
// Fetch active events
const { data: events } = await supabase
  .from('events')
  .select('*')
  .eq('is_active', true)
  .order('event_date', { ascending: true })

// Register for event
const { error } = await supabase
  .from('event_registrations')
  .insert({
    event_id: eventId,
    customer_name: name,
    customer_phone: phone,
    customer_email: email,
    party_size: 2
  })

// Fetch active specials
const { data: specials } = await supabase
  .from('specials')
  .select('*, menu_items(*)')
  .eq('is_active', true)
  .lte('start_date', new Date().toISOString())
  .gte('end_date', new Date().toISOString())
```

## Performance Optimization

### Indexes Created
All performance-critical queries are indexed:

- **Events**: event_date, is_active, is_featured, location_id, category
- **Event Registrations**: event_id, status, customer_phone
- **Specials**: start_date, end_date, is_active, menu_item_id
- **Operating Hours**: location_id, day_of_week
- **Customers**: phone, email, loyalty_tier
- **Orders**: customer_phone, status, location_id, created_at (DESC)
- **Menu Items**: category (with available = true)
- **Contact Submissions**: status, created_at

### Query Performance Tips
```sql
-- Good: Uses idx_events_event_date index
SELECT * FROM events WHERE is_active = true AND event_date >= NOW();

-- Bad: Full table scan
SELECT * FROM events WHERE EXTRACT(MONTH FROM event_date) = 2;

-- Good: Uses idx_specials_active_dates
SELECT * FROM specials WHERE is_active = true AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE;

-- Good: Uses idx_customers_phone
SELECT * FROM customers WHERE phone = '+503-1234-5678';
```

## Automatic Triggers

### Updated At Timestamps
All tables automatically update `updated_at` on row modification.

### Event Registration Counter
```sql
-- When registration is added/cancelled, events.registrations_count updates automatically
INSERT INTO event_registrations (...);
-- events.registrations_count increments by party_size

UPDATE event_registrations SET status = 'cancelled' WHERE id = '...';
-- events.registrations_count decrements by party_size
```

### Customer Stats Tracking
```sql
-- When order status changes to 'delivered', customers table updates automatically
UPDATE orders SET status = 'delivered' WHERE id = '...';
-- Creates/updates customer record with:
-- - total_orders +1
-- - total_spent + order.total
-- - last_order_at = order.delivered_at
```

## Rollback Procedure

If you need to undo this migration:

```sql
-- Run the rollback script
-- In Supabase SQL Editor, copy and paste: scripts/rollback-schema.sql
-- WARNING: This deletes all data in new tables
```

Or manually:
```sql
-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS loyalty_tiers CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS operating_hours CASCADE;
DROP TABLE IF EXISTS specials CASCADE;
DROP TABLE IF EXISTS event_registrations CASCADE;
DROP TABLE IF EXISTS events CASCADE;
```

## Security Notes

### RLS Policy Summary

| Table | Public Read | Public Insert | Admin Full Access |
|-------|------------|---------------|-------------------|
| events | ✓ (active only) | ✗ | ✓ |
| event_registrations | Own only | ✓ | ✓ |
| specials | ✓ (active only) | ✗ | ✓ |
| operating_hours | ✓ | ✗ | ✓ |
| customers | Own only | ✓ (insert) | ✓ |
| loyalty_tiers | ✓ | ✗ | ✓ (admin only) |

### Admin Access Control
Policies use this pattern:
```sql
EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
```

Make sure to set admin role:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'admin@simmerdown.com';
```

## Realtime Subscriptions

These tables have realtime enabled:
- `events` - Live event updates
- `event_registrations` - Live registration tracking
- `specials` - Live promotions

Usage:
```typescript
const channel = supabase
  .channel('events-channel')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'events' },
    (payload) => console.log('Event changed:', payload)
  )
  .subscribe()
```

## Sample Data Included

- **Loyalty Tiers**: 4 tiers (bronze, silver, gold, platinum)
- **Operating Hours**: Sample hours for Santa Ana location (if exists)

## Common Issues & Solutions

### Issue: RLS blocking admin queries
```sql
-- Solution: Verify admin role is set
SELECT id, email, role FROM profiles WHERE email = 'your-email@domain.com';
-- Should show role = 'admin'
```

### Issue: Foreign key constraint errors
```sql
-- Solution: Make sure parent records exist
-- Example: Before creating event with location_id, verify location exists
SELECT id FROM locations WHERE id = 'location-uuid';
```

### Issue: Trigger not firing
```sql
-- Solution: Check trigger exists
SELECT tgname FROM pg_trigger WHERE tgrelid = 'events'::regclass;
-- Should show: events_updated_at

-- Verify function exists
SELECT proname FROM pg_proc WHERE proname = 'update_updated_at';
```

## Next Steps

1. Update TypeScript types in app (already done in `src/lib/supabase/database.types.ts`)
2. Create admin UI components for managing:
   - Events (create, edit, view registrations)
   - Specials (create, edit, schedule)
   - Operating hours (per location)
   - Customer loyalty dashboard
3. Add frontend event registration flow
4. Build specials showcase on menu page
5. Implement loyalty points on checkout

## Support

For issues with this migration:
1. Check verification queries above
2. Review Supabase logs: Project > Logs > Database
3. Check RLS policies: Table Editor > [table] > Policies tab

## Version History

- **2.0.0** (2026-02-14): Initial complete schema migration
  - Added 6 new tables
  - Added 20+ indexes
  - Added 2 business logic triggers
  - Added comprehensive RLS policies
