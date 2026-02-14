# Simmer Down - Database Schema Quick Reference

## Tables at a Glance

| Table | Purpose | Key Fields | RLS |
|-------|---------|------------|-----|
| **profiles** | User accounts | email, role, loyalty_points | Users own, admin all |
| **menu_items** | Pizza menu | name, price, category, tags | Public read, admin write |
| **locations** | Restaurants | name, address, phone | Public read, admin write |
| **orders** | Customer orders | customer_phone, status, total | Users own, admin all |
| **contact_submissions** | Contact forms | name, email, message, status | Anyone insert, admin read |
| **events** | Event management | title, event_date, capacity | Public read, admin write |
| **event_registrations** | Event sign-ups | event_id, customer_phone, party_size | Anyone insert, admin all |
| **specials** | Promotions | title, discount_type, dates | Public read, admin write |
| **operating_hours** | Business hours | location_id, day_of_week, times | Public read, admin write |
| **customers** | Loyalty tracking | phone, loyalty_tier, total_spent | Users own, admin all |
| **loyalty_tiers** | Tier config | tier_name, points_required | Public read, admin write |

## Data Types Cheat Sheet

```typescript
// Events
type EventStatus = 'active' | 'inactive'
type EventCategory = string // 'Música', 'Taller', 'Degustación', etc.

// Orders
type OrderStatus = 'pending' | 'in_progress' | 'ready' | 'delivered' | 'cancelled'
type PaymentStatus = 'pending' | 'paid' | 'refunded'

// Specials
type DiscountType = 'percentage' | 'fixed' | 'combo' | 'bogo'

// Event Registrations
type RegistrationStatus = 'confirmed' | 'cancelled' | 'waitlist' | 'attended'

// Loyalty
type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum'

// Contact Forms
type ContactStatus = 'new' | 'read' | 'responded' | 'archived'

// Roles
type UserRole = 'customer' | 'staff' | 'admin'

// Menu Categories
type MenuCategory = 'pizza' | 'sides' | 'drinks' | 'desserts'

// Days of Week (operating_hours, specials)
type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0=Sunday, 6=Saturday
```

## Common Queries

### Events
```sql
-- Upcoming events
SELECT * FROM events
WHERE is_active = true AND event_date >= NOW()
ORDER BY event_date ASC;

-- Featured events
SELECT * FROM events
WHERE is_active = true AND is_featured = true;

-- Event with registrations
SELECT e.*, COUNT(er.id) as confirmed_count
FROM events e
LEFT JOIN event_registrations er ON e.id = er.event_id AND er.status = 'confirmed'
GROUP BY e.id;
```

### Specials
```sql
-- Active today
SELECT * FROM specials
WHERE is_active = true
  AND start_date <= CURRENT_DATE
  AND end_date >= CURRENT_DATE;

-- Recurring (e.g., every Friday)
SELECT * FROM specials
WHERE is_active = true
  AND 5 = ANY(day_of_week); -- 5 = Friday
```

### Operating Hours
```sql
-- Today's hours for all locations
SELECT l.name, oh.open_time, oh.close_time, oh.is_closed
FROM operating_hours oh
JOIN locations l ON oh.location_id = l.id
WHERE oh.day_of_week = EXTRACT(DOW FROM CURRENT_DATE);
```

### Customers
```sql
-- Top customers
SELECT name, phone, total_spent, total_orders, loyalty_tier
FROM customers
ORDER BY total_spent DESC
LIMIT 10;

-- Loyalty tier distribution
SELECT loyalty_tier, COUNT(*) as count
FROM customers
GROUP BY loyalty_tier;
```

### Orders
```sql
-- Pending orders
SELECT * FROM orders
WHERE status IN ('pending', 'in_progress')
ORDER BY created_at ASC;

-- Today's revenue
SELECT SUM(total) as daily_revenue
FROM orders
WHERE status = 'delivered'
  AND DATE(created_at) = CURRENT_DATE;
```

## TypeScript Usage

```typescript
// Import types
import type { Event, Special, Customer } from '@/lib/supabase/database.types'

// Fetch events
const { data: events } = await supabase
  .from('events')
  .select('*')
  .eq('is_active', true)
  .gte('event_date', new Date().toISOString())
  .order('event_date', { ascending: true })

// Create event registration
const { error } = await supabase
  .from('event_registrations')
  .insert({
    event_id: eventId,
    customer_name: 'Juan Pérez',
    customer_phone: '+503-1234-5678',
    customer_email: 'juan@email.com',
    party_size: 2
  })

// Fetch active specials with menu items
const { data: specials } = await supabase
  .from('specials')
  .select(`
    *,
    menu_items (
      id,
      name,
      image_url
    )
  `)
  .eq('is_active', true)
  .lte('start_date', new Date().toISOString().split('T')[0])
  .gte('end_date', new Date().toISOString().split('T')[0])

// Customer lookup
const { data: customer } = await supabase
  .from('customers')
  .select('*')
  .eq('phone', phoneNumber)
  .single()
```

## Indexes Reference

| Index Name | Table | Columns | Purpose |
|------------|-------|---------|---------|
| idx_events_event_date | events | event_date (WHERE is_active) | Fast date queries |
| idx_events_active_featured | events | is_active, is_featured | Homepage featured |
| idx_specials_active_dates | specials | start_date, end_date, is_active | Date range queries |
| idx_customers_phone | customers | phone | Customer lookup |
| idx_orders_status | orders | status, created_at | Pending orders |
| idx_orders_created_at | orders | created_at DESC | Recent orders |
| idx_operating_hours_location | operating_hours | location_id, day_of_week | Hours lookup |

## Triggers Reference

| Trigger | Table | Function | Purpose |
|---------|-------|----------|---------|
| events_updated_at | events | update_updated_at() | Auto-update timestamp |
| event_registrations_count_trigger | event_registrations | update_event_registrations_count() | Auto-update event capacity |
| orders_update_customer_stats | orders | update_customer_stats() | Track customer loyalty |

## RLS Policy Summary

```sql
-- Admin check (used in most policies)
EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))

-- Own records check
customer_phone IN (SELECT phone FROM profiles WHERE id = auth.uid())
OR customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
```

## Admin Setup

```sql
-- Create admin user (after first signup)
UPDATE profiles SET role = 'admin' WHERE email = 'admin@simmerdown.com';

-- Verify admin access
SELECT id, email, role FROM profiles WHERE role = 'admin';
```

## Sample Data Seeds

```sql
-- Events
INSERT INTO events (title, event_date, is_featured) VALUES
  ('Jazz Night', '2026-02-21 19:00:00', true);

-- Specials
INSERT INTO specials (title, discount_percentage, start_date, end_date, is_active) VALUES
  ('Tuesday Special', 20, '2026-02-01', '2026-02-28', true);

-- Operating Hours (for a location)
INSERT INTO operating_hours (location_id, day_of_week, open_time, close_time) VALUES
  ('location-uuid', 5, '11:00', '22:00'); -- Friday
```

## Debugging Commands

```sql
-- Check RLS status
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- List all policies
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- Check indexes
SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename;

-- View table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check for missing indexes (slow queries)
SELECT schemaname, tablename, attname
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 100
  AND correlation < 0.1;
```

## Migration Commands

```bash
# Run migration
# Paste scripts/complete-schema.sql in Supabase SQL Editor

# Verify
# Paste verification queries from MIGRATION-GUIDE.md

# Rollback (if needed)
# Paste scripts/rollback-schema.sql
```

## File Locations

```
simmer-down/
├── scripts/
│   ├── complete-schema.sql          # Main migration
│   ├── rollback-schema.sql          # Undo migration
│   ├── MIGRATION-GUIDE.md           # Detailed guide
│   ├── SCHEMA-README.md             # Full documentation
│   └── SCHEMA-QUICK-REFERENCE.md    # This file
├── src/lib/supabase/
│   └── database.types.ts            # TypeScript types
├── supabase-schema.sql              # Original schema
└── admin-schema.sql                 # First admin additions
```

## Performance Tips

1. **Always use indexes**: Check query plans with `EXPLAIN ANALYZE`
2. **Batch inserts**: Use array of objects instead of multiple singles
3. **Limit results**: Always use `.limit()` in production
4. **Select specific columns**: Don't use `SELECT *` if you only need a few fields
5. **Use views for complex joins**: Create views for frequently used joins
6. **Monitor slow queries**: Check Supabase Logs > Database regularly

## Security Checklist

- [x] RLS enabled on ALL tables
- [x] Policies test with both authenticated and anonymous users
- [x] No raw SQL from user input (use parameterized queries)
- [x] Admin role required for destructive operations
- [x] Phone/email validation on inserts
- [x] Timestamps on all records (audit trail)

## Next Steps After Migration

1. Create admin UI for events management
2. Build customer-facing event registration form
3. Add specials carousel to homepage
4. Display operating hours on locations page
5. Implement loyalty points on checkout
6. Add customer dashboard showing points and tier
7. Create admin analytics dashboard

---

**Last Updated:** 2026-02-14
**Schema Version:** 2.0.0
**Contact:** Reference MIGRATION-GUIDE.md for support
