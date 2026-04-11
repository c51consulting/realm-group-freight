-- ============================================================
-- REALM Ag Marketplace — Rollback RLS Policies (002)
-- ============================================================

BEGIN;

-- Drop all policies
DROP POLICY IF EXISTS "reviews_delete"              ON reviews;
DROP POLICY IF EXISTS "reviews_update"              ON reviews;
DROP POLICY IF EXISTS "reviews_insert"              ON reviews;
DROP POLICY IF EXISTS "reviews_select"              ON reviews;

DROP POLICY IF EXISTS "pod_delete"                  ON proof_of_delivery;
DROP POLICY IF EXISTS "pod_update"                  ON proof_of_delivery;
DROP POLICY IF EXISTS "pod_insert"                  ON proof_of_delivery;
DROP POLICY IF EXISTS "pod_select"                  ON proof_of_delivery;

DROP POLICY IF EXISTS "weigh_events_delete"         ON weigh_events;
DROP POLICY IF EXISTS "weigh_events_update"         ON weigh_events;
DROP POLICY IF EXISTS "weigh_events_insert"         ON weigh_events;
DROP POLICY IF EXISTS "weigh_events_select"         ON weigh_events;

DROP POLICY IF EXISTS "freight_jobs_delete"         ON freight_jobs;
DROP POLICY IF EXISTS "freight_jobs_update"         ON freight_jobs;
DROP POLICY IF EXISTS "freight_jobs_insert"         ON freight_jobs;
DROP POLICY IF EXISTS "freight_jobs_select"         ON freight_jobs;

DROP POLICY IF EXISTS "orders_delete"               ON orders;
DROP POLICY IF EXISTS "orders_update"               ON orders;
DROP POLICY IF EXISTS "orders_insert"               ON orders;
DROP POLICY IF EXISTS "orders_select"               ON orders;

DROP POLICY IF EXISTS "offers_delete"               ON offers;
DROP POLICY IF EXISTS "offers_update"               ON offers;
DROP POLICY IF EXISTS "offers_insert"               ON offers;
DROP POLICY IF EXISTS "offers_select"               ON offers;

DROP POLICY IF EXISTS "quality_tiers_update_trigger" ON quality_tiers;
DROP POLICY IF EXISTS "quality_tiers_insert_trigger" ON quality_tiers;
DROP POLICY IF EXISTS "quality_tiers_select"         ON quality_tiers;

DROP POLICY IF EXISTS "feed_tests_delete"           ON feed_tests;
DROP POLICY IF EXISTS "feed_tests_update"           ON feed_tests;
DROP POLICY IF EXISTS "feed_tests_insert"           ON feed_tests;
DROP POLICY IF EXISTS "feed_tests_select"           ON feed_tests;

DROP POLICY IF EXISTS "listings_delete_own"         ON listings;
DROP POLICY IF EXISTS "listings_update_own"         ON listings;
DROP POLICY IF EXISTS "listings_insert"             ON listings;
DROP POLICY IF EXISTS "listings_select"             ON listings;

DROP POLICY IF EXISTS "users_insert_service"        ON users;
DROP POLICY IF EXISTS "users_delete_admin"          ON users;
DROP POLICY IF EXISTS "users_update_own"            ON users;
DROP POLICY IF EXISTS "users_select_public"         ON users;

-- Disable RLS
ALTER TABLE reviews            DISABLE ROW LEVEL SECURITY;
ALTER TABLE proof_of_delivery  DISABLE ROW LEVEL SECURITY;
ALTER TABLE weigh_events       DISABLE ROW LEVEL SECURITY;
ALTER TABLE freight_jobs       DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders             DISABLE ROW LEVEL SECURITY;
ALTER TABLE offers             DISABLE ROW LEVEL SECURITY;
ALTER TABLE quality_tiers      DISABLE ROW LEVEL SECURITY;
ALTER TABLE feed_tests         DISABLE ROW LEVEL SECURITY;
ALTER TABLE listings           DISABLE ROW LEVEL SECURITY;
ALTER TABLE users              DISABLE ROW LEVEL SECURITY;

DROP FUNCTION IF EXISTS is_admin();

COMMIT;
