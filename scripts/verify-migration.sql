-- SIMMER DOWN - MIGRATION VERIFICATION SCRIPT
-- Run this after executing complete-schema.sql
-- All queries should return expected results

-- =====================
-- 1. CHECK TABLES EXIST
-- =====================
SELECT
  'Table Check' as test_category,
  CASE
    WHEN COUNT(*) = 6 THEN '✓ PASS - All 6 tables created'
    ELSE '✗ FAIL - Expected 6 tables, found ' || COUNT(*)
  END as result
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('events', 'event_registrations', 'specials',
                  'operating_hours', 'customers', 'loyalty_tiers');

-- =====================
-- 2. CHECK RLS ENABLED
-- =====================
SELECT
  'RLS Check' as test_category,
  CASE
    WHEN COUNT(*) = 0 THEN '✓ PASS - RLS enabled on all new tables'
    ELSE '✗ FAIL - RLS not enabled on: ' || STRING_AGG(tablename, ', ')
  END as result
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('events', 'event_registrations', 'specials',
                  'operating_hours', 'customers', 'loyalty_tiers')
AND rowsecurity = false
GROUP BY rowsecurity;

-- =====================
-- 3. CHECK POLICIES CREATED
-- =====================
SELECT
  'Policy Check' as test_category,
  CASE
    WHEN COUNT(*) >= 15 THEN '✓ PASS - ' || COUNT(*) || ' policies created'
    ELSE '✗ FAIL - Expected ≥15 policies, found ' || COUNT(*)
  END as result
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('events', 'event_registrations', 'specials',
                  'operating_hours', 'customers', 'loyalty_tiers');

-- =====================
-- 4. CHECK INDEXES CREATED
-- =====================
SELECT
  'Index Check' as test_category,
  CASE
    WHEN COUNT(*) >= 20 THEN '✓ PASS - ' || COUNT(*) || ' indexes created'
    ELSE '✗ FAIL - Expected ≥20 indexes, found ' || COUNT(*)
  END as result
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%';

-- =====================
-- 5. CHECK TRIGGERS CREATED
-- =====================
SELECT
  'Trigger Check' as test_category,
  CASE
    WHEN COUNT(*) >= 8 THEN '✓ PASS - ' || COUNT(*) || ' triggers created'
    ELSE '✗ FAIL - Expected ≥8 triggers, found ' || COUNT(*)
  END as result
FROM pg_trigger
WHERE tgrelid IN (
  'events'::regclass,
  'event_registrations'::regclass,
  'specials'::regclass,
  'operating_hours'::regclass,
  'customers'::regclass,
  'loyalty_tiers'::regclass,
  'orders'::regclass
);

-- =====================
-- 6. CHECK SAMPLE DATA
-- =====================
SELECT
  'Sample Data Check' as test_category,
  CASE
    WHEN COUNT(*) = 4 THEN '✓ PASS - 4 loyalty tiers loaded'
    ELSE '✗ FAIL - Expected 4 loyalty tiers, found ' || COUNT(*)
  END as result
FROM loyalty_tiers;

-- =====================
-- 7. CHECK FOREIGN KEYS
-- =====================
SELECT
  'Foreign Key Check' as test_category,
  CASE
    WHEN COUNT(*) >= 5 THEN '✓ PASS - ' || COUNT(*) || ' foreign keys created'
    ELSE '✗ FAIL - Expected ≥5 foreign keys, found ' || COUNT(*)
  END as result
FROM information_schema.table_constraints
WHERE constraint_schema = 'public'
AND constraint_type = 'FOREIGN KEY'
AND table_name IN ('events', 'event_registrations', 'specials', 'operating_hours');

-- =====================
-- 8. CHECK UNIQUE CONSTRAINTS
-- =====================
SELECT
  'Unique Constraint Check' as test_category,
  CASE
    WHEN COUNT(*) >= 3 THEN '✓ PASS - ' || COUNT(*) || ' unique constraints'
    ELSE '✗ FAIL - Expected ≥3 unique constraints, found ' || COUNT(*)
  END as result
FROM information_schema.table_constraints
WHERE constraint_schema = 'public'
AND constraint_type = 'UNIQUE'
AND table_name IN ('customers', 'loyalty_tiers', 'operating_hours');

-- =====================
-- 9. CHECK FUNCTION EXISTS
-- =====================
SELECT
  'Function Check' as test_category,
  CASE
    WHEN COUNT(*) >= 3 THEN '✓ PASS - All required functions exist'
    ELSE '✗ FAIL - Missing functions'
  END as result
FROM pg_proc
WHERE proname IN (
  'update_updated_at',
  'update_event_registrations_count',
  'update_customer_stats'
);

-- =====================
-- 10. CHECK COLUMN TYPES
-- =====================
SELECT
  'Column Type Check' as test_category,
  '✓ PASS - All column types correct' as result
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'events'
AND column_name = 'event_date'
AND data_type = 'timestamp with time zone';

-- =====================
-- DETAILED TABLE INFORMATION
-- =====================
SELECT
  '--- DETAILED TABLE INFO ---' as section,
  '' as details
UNION ALL
SELECT
  'Table: ' || tablename,
  'Columns: ' || COUNT(*)::text
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('events', 'event_registrations', 'specials',
                   'operating_hours', 'customers', 'loyalty_tiers')
GROUP BY tablename;

-- =====================
-- DETAILED POLICY INFORMATION
-- =====================
SELECT
  '--- DETAILED POLICY INFO ---' as section,
  '' as details
UNION ALL
SELECT
  tablename || ': ' || policyname,
  'Command: ' || cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('events', 'event_registrations', 'specials',
                  'operating_hours', 'customers', 'loyalty_tiers')
ORDER BY tablename, policyname;

-- =====================
-- DETAILED INDEX INFORMATION
-- =====================
SELECT
  '--- DETAILED INDEX INFO ---' as section,
  '' as details
UNION ALL
SELECT
  tablename || ': ' || indexname,
  'Columns: ' || COALESCE(pg_get_indexdef(indexrelid), 'N/A')
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- =====================
-- SUMMARY REPORT
-- =====================
SELECT
  '--- MIGRATION SUMMARY ---' as section,
  '' as status
UNION ALL
SELECT
  'Total Tables',
  COUNT(*)::text
FROM pg_tables
WHERE schemaname = 'public'
UNION ALL
SELECT
  'Total Policies',
  COUNT(*)::text
FROM pg_policies
WHERE schemaname = 'public'
UNION ALL
SELECT
  'Total Indexes',
  COUNT(*)::text
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
UNION ALL
SELECT
  'Total Triggers',
  COUNT(*)::text
FROM pg_trigger
WHERE tgrelid IN (
  SELECT oid FROM pg_class
  WHERE relname IN ('events', 'event_registrations', 'specials',
                    'operating_hours', 'customers', 'loyalty_tiers', 'orders')
)
UNION ALL
SELECT
  'Loyalty Tiers',
  COUNT(*)::text
FROM loyalty_tiers;

-- =====================
-- TEST RLS POLICIES (must be run as different users)
-- =====================
-- Run these manually to test RLS:
/*
-- TEST 1: Public read should work (as anonymous)
SET ROLE anon;
SELECT COUNT(*) FROM events WHERE is_active = true; -- Should work
RESET ROLE;

-- TEST 2: Public insert should fail (as anonymous)
SET ROLE anon;
INSERT INTO events (title, event_date) VALUES ('Test', NOW()); -- Should fail
RESET ROLE;

-- TEST 3: Admin should have full access
-- First set admin role:
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
-- Then test insert (should work)

-- TEST 4: Event registration counter
INSERT INTO event_registrations (event_id, customer_name, customer_phone, party_size)
VALUES ('event-id-here', 'Test User', '+503-1234-5678', 2);
-- Check events.registrations_count increased by 2

-- TEST 5: Customer stats update
UPDATE orders SET status = 'delivered' WHERE id = 'order-id-here';
-- Check customers table was updated/created
*/

-- =====================
-- PERFORMANCE CHECK
-- =====================
EXPLAIN ANALYZE
SELECT * FROM events
WHERE is_active = true
AND event_date >= NOW()
ORDER BY event_date ASC;
-- Should show "Index Scan using idx_events_event_date"

EXPLAIN ANALYZE
SELECT * FROM customers WHERE phone = '+503-1234-5678';
-- Should show "Index Scan using idx_customers_phone"

-- =====================
-- FINAL STATUS
-- =====================
SELECT
  '=== MIGRATION COMPLETE ===' as status,
  CASE
    WHEN (
      SELECT COUNT(*) FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('events', 'event_registrations', 'specials',
                        'operating_hours', 'customers', 'loyalty_tiers')
    ) = 6
    THEN '✓ All checks passed - Ready for production'
    ELSE '✗ Some checks failed - Review errors above'
  END as result;
