-- ============================================================
-- REALM Ag Marketplace — Initial Schema Migration
-- Migration: 001_initial_schema
-- Created: 2024-01-01
--
-- Tables:
--   users, listings, feed_tests, quality_tiers, offers,
--   orders, freight_jobs, weigh_events, proof_of_delivery,
--   reviews
--
-- Run:   psql $DATABASE_URL -f supabase/migrations/001_initial_schema.sql
-- Undo:  psql $DATABASE_URL -f supabase/migrations/001_initial_schema_rollback.sql
-- ============================================================

BEGIN;

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";   -- optional: geo queries

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'carrier', 'admin');

CREATE TYPE listing_type AS ENUM ('sell', 'buy', 'freight_only');

CREATE TYPE listing_status AS ENUM ('draft', 'active', 'paused', 'sold', 'expired', 'cancelled');

CREATE TYPE material_type AS ENUM (
  'hay', 'straw', 'silage', 'grain', 'seed',
  'pellets', 'fertiliser', 'supplement', 'drums',
  'bulk_liquid', 'other'
);

CREATE TYPE unit_type AS ENUM (
  'bale_small', 'bale_large', 'bale_round', 'bag', 'drum',
  'tonne', 'kg', 'load', 'pallet', 'cubic_metre', 'litre', 'custom'
);

CREATE TYPE pricing_type AS ENUM ('fixed', 'offers', 'auction', 'urgent');

CREATE TYPE quality_level AS ENUM ('basic', 'verified', 'performance');

CREATE TYPE feed_test_source AS ENUM ('lab', 'on_farm_nir', 'vendor_estimate');

CREATE TYPE afia_grade AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D', 'ungraded');

CREATE TYPE offer_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn', 'expired');

CREATE TYPE order_status AS ENUM (
  'pending_payment', 'paid', 'in_transit', 'delivered',
  'confirmed', 'disputed', 'refunded', 'completed'
);

CREATE TYPE freight_status AS ENUM (
  'open', 'quoted', 'assigned', 'in_transit', 'delivered', 'cancelled'
);

CREATE TYPE weigh_source AS ENUM ('api', 'csv_import', 'ocr_upload', 'manual');

CREATE TYPE settlement_status AS ENUM ('pending', 'matched', 'disputed', 'settled');

CREATE TYPE pod_status AS ENUM ('pending', 'submitted', 'accepted', 'rejected');

-- ============================================================
-- TABLE: users
-- Buyers, sellers, carriers and admins.
-- ============================================================
CREATE TABLE users (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  email             TEXT          NOT NULL UNIQUE,
  password_hash     TEXT          NOT NULL,
  business_name     TEXT,
  abn               TEXT,                          -- Australian Business Number
  phone             TEXT,
  role              user_role     NOT NULL DEFAULT 'buyer',
  address           JSONB,                         -- { street, suburb, state, postcode, country }
  lat               DOUBLE PRECISION,
  lng               DOUBLE PRECISION,
  verified          BOOLEAN       NOT NULL DEFAULT FALSE,
  stripe_account_id TEXT,                          -- Stripe Connect account for payouts
  rating            NUMERIC(3,2)  NOT NULL DEFAULT 0,
  review_count      INTEGER       NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  users IS 'Platform users: buyers, sellers, carriers and admins';
COMMENT ON COLUMN users.abn IS 'Australian Business Number — 11 digits';
COMMENT ON COLUMN users.stripe_account_id IS 'Stripe Connect Express account for seller payouts';

-- ============================================================
-- TABLE: listings
-- Sell / buy / freight-only posts.
-- ============================================================
CREATE TABLE listings (
  id                      UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id               UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                    listing_type  NOT NULL,
  status                  listing_status NOT NULL DEFAULT 'draft',
  material_type           material_type NOT NULL,
  material_subtype        TEXT,                    -- e.g. "Lucerne", "Oaten", "Barley"
  title                   TEXT          NOT NULL,
  description             TEXT,
  unit_type               unit_type     NOT NULL,
  unit_label              TEXT,                    -- custom label override
  price_per_unit          NUMERIC(12,2),
  price_per_tonne_equiv   NUMERIC(12,2),           -- auto-calculated normalised price
  quantity_available      NUMERIC(12,2),
  quantity_unit           TEXT,
  minimum_order           NUMERIC(12,2),
  estimated_weight_per_unit NUMERIC(10,2),         -- kg per unit for tonne-equiv calc
  pricing_type            pricing_type  NOT NULL DEFAULT 'fixed',
  freight_included        BOOLEAN       NOT NULL DEFAULT FALSE,
  delivery_radius         INTEGER,                 -- km
  pickup_address          JSONB,
  pickup_lat              DOUBLE PRECISION,
  pickup_lng              DOUBLE PRECISION,
  loading_available       BOOLEAN       NOT NULL DEFAULT FALSE,
  images                  JSONB         NOT NULL DEFAULT '[]',
  quality_level           quality_level NOT NULL DEFAULT 'basic',
  expires_at              TIMESTAMPTZ,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  listings IS 'Sell, buy and freight-only posts for agricultural materials';
COMMENT ON COLUMN listings.price_per_tonne_equiv IS 'Normalised price/tonne for cross-unit comparison';

-- ============================================================
-- TABLE: feed_tests
-- Lab and on-farm NIR nutritional analysis results.
-- ============================================================
CREATE TABLE feed_tests (
  id                    UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id            UUID            NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  uploaded_by           UUID            NOT NULL REFERENCES users(id),
  source                feed_test_source NOT NULL,
  lab_name              TEXT,
  device_id             TEXT,           -- NIR device serial / model
  test_date             DATE,
  certificate_url       TEXT,           -- S3 / storage URL
  dry_matter            NUMERIC(5,2),   -- %
  moisture              NUMERIC(5,2),   -- %
  crude_protein         NUMERIC(5,2),   -- % DM
  metabolisable_energy  NUMERIC(5,2),   -- MJ/kg DM
  ndf                   NUMERIC(5,2),   -- Neutral Detergent Fibre %
  adf                   NUMERIC(5,2),   -- Acid Detergent Fibre %
  digestibility         NUMERIC(5,2),   -- % IVDMD
  afia_grade            afia_grade,
  rfv                   NUMERIC(7,2),   -- Relative Feed Value
  fei                   NUMERIC(7,2),   -- Fat & Energy Index
  ash                   NUMERIC(5,2),   -- %
  raw_data              JSONB,          -- full lab report payload
  verified              BOOLEAN         NOT NULL DEFAULT FALSE,
  verified_by           UUID            REFERENCES users(id),
  verified_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE feed_tests IS 'Nutritional analysis: lab certificates and on-farm NIR scans';

-- ============================================================
-- TABLE: quality_tiers
-- Derived quality summary per listing (recalculated on feed test changes).
-- ============================================================
CREATE TABLE quality_tiers (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id        UUID          NOT NULL UNIQUE REFERENCES listings(id) ON DELETE CASCADE,
  tier              quality_level NOT NULL DEFAULT 'basic',
  has_lab_test      BOOLEAN       NOT NULL DEFAULT FALSE,
  has_nir_test      BOOLEAN       NOT NULL DEFAULT FALSE,
  best_afia_grade   afia_grade,
  best_rfv          NUMERIC(7,2),
  best_cp           NUMERIC(5,2),
  best_me           NUMERIC(5,2),
  test_count        INTEGER       NOT NULL DEFAULT 0,
  last_calculated   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE quality_tiers IS 'Derived quality summary per listing — recalculated when feed tests change';

-- ============================================================
-- TABLE: offers
-- Price, quantity and freight offers on listings.
-- ============================================================
CREATE TABLE offers (
  id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id       UUID         NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status           offer_status NOT NULL DEFAULT 'pending',
  price_per_unit   NUMERIC(12,2) NOT NULL,
  quantity         NUMERIC(12,2) NOT NULL,
  total_price      NUMERIC(14,2),
  freight_included BOOLEAN      NOT NULL DEFAULT FALSE,
  freight_price    NUMERIC(12,2),
  delivery_date    DATE,
  message          TEXT,
  expires_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE offers IS 'Buyer offers on listings — accepted offer triggers order creation';

-- ============================================================
-- TABLE: orders
-- Escrow transaction lifecycle from offer acceptance to payment release.
-- ============================================================
CREATE TABLE orders (
  id                        UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number              TEXT         NOT NULL UNIQUE,
  offer_id                  UUID         NOT NULL UNIQUE REFERENCES offers(id),
  listing_id                UUID         NOT NULL REFERENCES listings(id),
  buyer_id                  UUID         NOT NULL REFERENCES users(id),
  seller_id                 UUID         NOT NULL REFERENCES users(id),
  carrier_id                UUID         REFERENCES users(id),
  status                    order_status NOT NULL DEFAULT 'pending_payment',
  total_amount              NUMERIC(14,2) NOT NULL,
  freight_amount            NUMERIC(12,2) NOT NULL DEFAULT 0,
  platform_fee              NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_held              BOOLEAN      NOT NULL DEFAULT FALSE,
  payment_released_at       TIMESTAMPTZ,
  stripe_payment_intent_id  TEXT,
  stripe_transfer_id        TEXT,        -- transfer to seller on release
  quality_assurance_level   quality_level NOT NULL DEFAULT 'basic',
  contract_terms            JSONB,
  delivery_evidence         JSONB        NOT NULL DEFAULT '{}',
  confirmed_at              TIMESTAMPTZ,
  dispute_reason            TEXT,
  created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE orders IS 'Escrow order lifecycle — payment held until buyer confirms delivery';
COMMENT ON COLUMN orders.platform_fee IS '5% platform fee deducted from seller payout';

-- ============================================================
-- TABLE: freight_jobs
-- Standalone or order-linked transport jobs.
-- ============================================================
CREATE TABLE freight_jobs (
  id                UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id          UUID           REFERENCES orders(id) ON DELETE SET NULL,
  posted_by         UUID           NOT NULL REFERENCES users(id),
  carrier_id        UUID           REFERENCES users(id),
  status            freight_status NOT NULL DEFAULT 'open',
  pickup_address    JSONB          NOT NULL,
  pickup_lat        DOUBLE PRECISION,
  pickup_lng        DOUBLE PRECISION,
  delivery_address  JSONB          NOT NULL,
  delivery_lat      DOUBLE PRECISION,
  delivery_lng      DOUBLE PRECISION,
  material_type     material_type,
  material_desc     TEXT,
  weight_kg         NUMERIC(12,2),
  volume_m3         NUMERIC(10,2),
  required_by       DATE,
  price_offered     NUMERIC(12,2),
  price_agreed      NUMERIC(12,2),
  notes             TEXT,
  assigned_at       TIMESTAMPTZ,
  picked_up_at      TIMESTAMPTZ,
  delivered_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE freight_jobs IS 'Transport jobs — standalone or linked to an order';

-- ============================================================
-- TABLE: weigh_events
-- Weight records from API, CSV, OCR or manual entry.
-- ============================================================
CREATE TABLE weigh_events (
  id                UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id          UUID              REFERENCES orders(id) ON DELETE SET NULL,
  freight_job_id    UUID              REFERENCES freight_jobs(id) ON DELETE SET NULL,
  recorded_by       UUID              REFERENCES users(id),
  source            weigh_source      NOT NULL,
  source_system     TEXT,             -- e.g. "Loadrite", "Avery Weigh-Tronix"
  source_ticket_id  TEXT,             -- external ticket/docket number
  site_id           TEXT,
  site_name         TEXT,
  vehicle_rego      TEXT,
  gross_weight      NUMERIC(12,2),    -- kg
  tare_weight       NUMERIC(12,2),    -- kg
  net_weight        NUMERIC(12,2),    -- kg
  weight_unit       TEXT             NOT NULL DEFAULT 'kg',
  weighed_at        TIMESTAMPTZ,
  operator_name     TEXT,
  ticket_image_url  TEXT,
  gps_lat           DOUBLE PRECISION,
  gps_lng           DOUBLE PRECISION,
  trade_approved    BOOLEAN          NOT NULL DEFAULT FALSE,
  raw_data          JSONB,
  verified          BOOLEAN          NOT NULL DEFAULT FALSE,
  verified_by       UUID             REFERENCES users(id),
  verified_at       TIMESTAMPTZ,
  settlement_status settlement_status NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE weigh_events IS 'Weighbridge records from API, CSV import, OCR upload or manual entry';

-- ============================================================
-- TABLE: proof_of_delivery
-- Photos, signatures and weighbridge evidence for order delivery.
-- ============================================================
CREATE TABLE proof_of_delivery (
  id              UUID       PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID       NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  submitted_by    UUID       NOT NULL REFERENCES users(id),
  status          pod_status NOT NULL DEFAULT 'pending',
  photo_urls      JSONB      NOT NULL DEFAULT '[]',  -- array of storage URLs
  signature_url   TEXT,
  notes           TEXT,
  gps_lat         DOUBLE PRECISION,
  gps_lng         DOUBLE PRECISION,
  weigh_event_id  UUID       REFERENCES weigh_events(id),
  reviewed_by     UUID       REFERENCES users(id),
  reviewed_at     TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE proof_of_delivery IS 'Delivery evidence: photos, signature, GPS and weighbridge link';

-- ============================================================
-- TABLE: reviews
-- 1–5 star ratings with rolling average maintained on users.
-- ============================================================
CREATE TABLE reviews (
  id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID    NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  reviewer_id UUID    NOT NULL REFERENCES users(id),
  reviewee_id UUID    NOT NULL REFERENCES users(id),
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  role        user_role,   -- role the reviewee played in this order
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (order_id, reviewer_id, reviewee_id)  -- one review per pair per order
);

COMMENT ON TABLE reviews IS '1–5 star post-order reviews; rolling average maintained on users.rating';

-- ============================================================
-- INDEXES
-- ============================================================

-- users
CREATE INDEX idx_users_email        ON users(email);
CREATE INDEX idx_users_role         ON users(role);
CREATE INDEX idx_users_verified     ON users(verified);

-- listings
CREATE INDEX idx_listings_seller_id     ON listings(seller_id);
CREATE INDEX idx_listings_status        ON listings(status);
CREATE INDEX idx_listings_material_type ON listings(material_type);
CREATE INDEX idx_listings_type          ON listings(type);
CREATE INDEX idx_listings_quality_level ON listings(quality_level);
CREATE INDEX idx_listings_pricing_type  ON listings(pricing_type);
CREATE INDEX idx_listings_expires_at    ON listings(expires_at);
CREATE INDEX idx_listings_created_at    ON listings(created_at DESC);
-- Geo bounding-box search
CREATE INDEX idx_listings_geo           ON listings(pickup_lat, pickup_lng)
  WHERE pickup_lat IS NOT NULL AND pickup_lng IS NOT NULL;

-- feed_tests
CREATE INDEX idx_feed_tests_listing_id ON feed_tests(listing_id);
CREATE INDEX idx_feed_tests_source     ON feed_tests(source);
CREATE INDEX idx_feed_tests_afia_grade ON feed_tests(afia_grade);

-- quality_tiers
CREATE INDEX idx_quality_tiers_listing_id ON quality_tiers(listing_id);
CREATE INDEX idx_quality_tiers_tier       ON quality_tiers(tier);

-- offers
CREATE INDEX idx_offers_listing_id ON offers(listing_id);
CREATE INDEX idx_offers_buyer_id   ON offers(buyer_id);
CREATE INDEX idx_offers_status     ON offers(status);

-- orders
CREATE INDEX idx_orders_buyer_id   ON orders(buyer_id);
CREATE INDEX idx_orders_seller_id  ON orders(seller_id);
CREATE INDEX idx_orders_carrier_id ON orders(carrier_id);
CREATE INDEX idx_orders_status     ON orders(status);
CREATE INDEX idx_orders_listing_id ON orders(listing_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- freight_jobs
CREATE INDEX idx_freight_jobs_order_id   ON freight_jobs(order_id);
CREATE INDEX idx_freight_jobs_posted_by  ON freight_jobs(posted_by);
CREATE INDEX idx_freight_jobs_carrier_id ON freight_jobs(carrier_id);
CREATE INDEX idx_freight_jobs_status     ON freight_jobs(status);

-- weigh_events
CREATE INDEX idx_weigh_events_order_id       ON weigh_events(order_id);
CREATE INDEX idx_weigh_events_freight_job_id ON weigh_events(freight_job_id);
CREATE INDEX idx_weigh_events_source         ON weigh_events(source);
CREATE INDEX idx_weigh_events_verified       ON weigh_events(verified);
CREATE INDEX idx_weigh_events_weighed_at     ON weigh_events(weighed_at DESC);

-- proof_of_delivery
CREATE INDEX idx_pod_order_id ON proof_of_delivery(order_id);
CREATE INDEX idx_pod_status   ON proof_of_delivery(status);

-- reviews
CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX idx_reviews_order_id    ON reviews(order_id);

-- ============================================================
-- TRIGGERS: updated_at auto-maintenance
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_feed_tests_updated_at
  BEFORE UPDATE ON feed_tests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_quality_tiers_updated_at
  BEFORE UPDATE ON quality_tiers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_offers_updated_at
  BEFORE UPDATE ON offers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_freight_jobs_updated_at
  BEFORE UPDATE ON freight_jobs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_weigh_events_updated_at
  BEFORE UPDATE ON weigh_events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_pod_updated_at
  BEFORE UPDATE ON proof_of_delivery
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TRIGGER: recalculate quality_tier when feed_tests change
-- ============================================================

CREATE OR REPLACE FUNCTION recalculate_quality_tier()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_listing_id UUID;
  v_has_lab    BOOLEAN;
  v_has_nir    BOOLEAN;
  v_best_grade afia_grade;
  v_best_rfv   NUMERIC(7,2);
  v_best_cp    NUMERIC(5,2);
  v_best_me    NUMERIC(5,2);
  v_count      INTEGER;
  v_tier       quality_level;
BEGIN
  v_listing_id := COALESCE(NEW.listing_id, OLD.listing_id);

  SELECT
    COUNT(*)                                                    INTO v_count
  FROM feed_tests WHERE listing_id = v_listing_id;

  SELECT
    BOOL_OR(source = 'lab'),
    BOOL_OR(source = 'on_farm_nir'),
    MAX(rfv),
    MAX(crude_protein),
    MAX(metabolisable_energy)
  INTO v_has_lab, v_has_nir, v_best_rfv, v_best_cp, v_best_me
  FROM feed_tests WHERE listing_id = v_listing_id;

  -- Best AFIA grade (A1 > A2 > B1 … D)
  SELECT afia_grade INTO v_best_grade
  FROM feed_tests
  WHERE listing_id = v_listing_id AND afia_grade IS NOT NULL
  ORDER BY CASE afia_grade
    WHEN 'A1' THEN 1 WHEN 'A2' THEN 2 WHEN 'B1' THEN 3 WHEN 'B2' THEN 4
    WHEN 'C1' THEN 5 WHEN 'C2' THEN 6 WHEN 'D'  THEN 7 ELSE 8
  END
  LIMIT 1;

  -- Derive tier
  IF v_has_lab THEN
    v_tier := 'performance';
  ELSIF v_has_nir THEN
    v_tier := 'verified';
  ELSE
    v_tier := 'basic';
  END IF;

  INSERT INTO quality_tiers (listing_id, tier, has_lab_test, has_nir_test,
    best_afia_grade, best_rfv, best_cp, best_me, test_count, last_calculated)
  VALUES (v_listing_id, v_tier, COALESCE(v_has_lab, FALSE), COALESCE(v_has_nir, FALSE),
    v_best_grade, v_best_rfv, v_best_cp, v_best_me, v_count, NOW())
  ON CONFLICT (listing_id) DO UPDATE SET
    tier             = EXCLUDED.tier,
    has_lab_test     = EXCLUDED.has_lab_test,
    has_nir_test     = EXCLUDED.has_nir_test,
    best_afia_grade  = EXCLUDED.best_afia_grade,
    best_rfv         = EXCLUDED.best_rfv,
    best_cp          = EXCLUDED.best_cp,
    best_me          = EXCLUDED.best_me,
    test_count       = EXCLUDED.test_count,
    last_calculated  = EXCLUDED.last_calculated,
    updated_at       = NOW();

  -- Sync quality_level on listing
  UPDATE listings SET quality_level = v_tier WHERE id = v_listing_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_feed_test_quality_recalc
  AFTER INSERT OR UPDATE OR DELETE ON feed_tests
  FOR EACH ROW EXECUTE FUNCTION recalculate_quality_tier();

-- ============================================================
-- TRIGGER: update user rolling rating after review insert/update
-- ============================================================

CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_avg   NUMERIC(3,2);
  v_count INTEGER;
BEGIN
  SELECT AVG(rating)::NUMERIC(3,2), COUNT(*)
  INTO v_avg, v_count
  FROM reviews
  WHERE reviewee_id = NEW.reviewee_id;

  UPDATE users
  SET rating = v_avg, review_count = v_count
  WHERE id = NEW.reviewee_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_review_rating_update
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_user_rating();

COMMIT;
