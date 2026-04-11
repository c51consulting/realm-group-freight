-- ============================================================
-- REALM Ag Marketplace — Rollback Migration 001
-- Drops all objects created by 001_initial_schema.sql
-- ============================================================

BEGIN;

-- Triggers
DROP TRIGGER IF EXISTS trg_review_rating_update    ON reviews;
DROP TRIGGER IF EXISTS trg_feed_test_quality_recalc ON feed_tests;
DROP TRIGGER IF EXISTS trg_pod_updated_at           ON proof_of_delivery;
DROP TRIGGER IF EXISTS trg_weigh_events_updated_at  ON weigh_events;
DROP TRIGGER IF EXISTS trg_freight_jobs_updated_at  ON freight_jobs;
DROP TRIGGER IF EXISTS trg_orders_updated_at        ON orders;
DROP TRIGGER IF EXISTS trg_offers_updated_at        ON offers;
DROP TRIGGER IF EXISTS trg_quality_tiers_updated_at ON quality_tiers;
DROP TRIGGER IF EXISTS trg_feed_tests_updated_at    ON feed_tests;
DROP TRIGGER IF EXISTS trg_listings_updated_at      ON listings;
DROP TRIGGER IF EXISTS trg_users_updated_at         ON users;

-- Functions
DROP FUNCTION IF EXISTS update_user_rating();
DROP FUNCTION IF EXISTS recalculate_quality_tier();
DROP FUNCTION IF EXISTS set_updated_at();

-- Tables (reverse dependency order)
DROP TABLE IF EXISTS reviews            CASCADE;
DROP TABLE IF EXISTS proof_of_delivery  CASCADE;
DROP TABLE IF EXISTS weigh_events       CASCADE;
DROP TABLE IF EXISTS freight_jobs       CASCADE;
DROP TABLE IF EXISTS orders             CASCADE;
DROP TABLE IF EXISTS offers             CASCADE;
DROP TABLE IF EXISTS quality_tiers      CASCADE;
DROP TABLE IF EXISTS feed_tests         CASCADE;
DROP TABLE IF EXISTS listings           CASCADE;
DROP TABLE IF EXISTS users              CASCADE;

-- Enum types
DROP TYPE IF EXISTS pod_status;
DROP TYPE IF EXISTS settlement_status;
DROP TYPE IF EXISTS weigh_source;
DROP TYPE IF EXISTS freight_status;
DROP TYPE IF EXISTS order_status;
DROP TYPE IF EXISTS offer_status;
DROP TYPE IF EXISTS afia_grade;
DROP TYPE IF EXISTS feed_test_source;
DROP TYPE IF EXISTS quality_level;
DROP TYPE IF EXISTS pricing_type;
DROP TYPE IF EXISTS unit_type;
DROP TYPE IF EXISTS material_type;
DROP TYPE IF EXISTS listing_status;
DROP TYPE IF EXISTS listing_type;
DROP TYPE IF EXISTS user_role;

COMMIT;
