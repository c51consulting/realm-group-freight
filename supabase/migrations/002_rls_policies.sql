-- ============================================================
-- REALM Ag Marketplace — Row Level Security Policies
-- Migration: 002_rls_policies
--
-- Assumes Supabase Auth: auth.uid() returns the authenticated
-- user's UUID which must match users.id.
--
-- Run:   psql $DATABASE_URL -f supabase/migrations/002_rls_policies.sql
-- Undo:  psql $DATABASE_URL -f supabase/migrations/002_rls_policies_rollback.sql
-- ============================================================

BEGIN;

-- ============================================================
-- HELPER: is_admin()
-- Returns true when the calling user has role = 'admin'.
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ============================================================
-- TABLE: users
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Anyone can read public profile fields (no passwordHash exposed via API)
CREATE POLICY "users_select_public"
  ON users FOR SELECT
  USING (TRUE);

-- Users can only update their own profile
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Only admins can delete users
CREATE POLICY "users_delete_admin"
  ON users FOR DELETE
  USING (is_admin());

-- Insert handled by auth registration (service role)
CREATE POLICY "users_insert_service"
  ON users FOR INSERT
  WITH CHECK (TRUE);

-- ============================================================
-- TABLE: listings
-- ============================================================
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read active listings; owners can read all their own
CREATE POLICY "listings_select"
  ON listings FOR SELECT
  USING (
    status = 'active'
    OR seller_id = auth.uid()
    OR is_admin()
  );

-- Sellers can create listings
CREATE POLICY "listings_insert"
  ON listings FOR INSERT
  WITH CHECK (seller_id = auth.uid());

-- Sellers can update their own listings
CREATE POLICY "listings_update_own"
  ON listings FOR UPDATE
  USING (seller_id = auth.uid() OR is_admin());

-- Sellers can delete (cancel) their own listings
CREATE POLICY "listings_delete_own"
  ON listings FOR DELETE
  USING (seller_id = auth.uid() OR is_admin());

-- ============================================================
-- TABLE: feed_tests
-- ============================================================
ALTER TABLE feed_tests ENABLE ROW LEVEL SECURITY;

-- Anyone can read feed tests on active listings; listing owner can read all
CREATE POLICY "feed_tests_select"
  ON feed_tests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = feed_tests.listing_id
        AND (l.status = 'active' OR l.seller_id = auth.uid())
    )
    OR is_admin()
  );

-- Listing owner can attach feed tests
CREATE POLICY "feed_tests_insert"
  ON feed_tests FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id AND l.seller_id = auth.uid()
    )
  );

-- Listing owner or admin can update (e.g. attach certificate URL)
CREATE POLICY "feed_tests_update"
  ON feed_tests FOR UPDATE
  USING (
    uploaded_by = auth.uid()
    OR is_admin()
  );

-- Listing owner or admin can delete
CREATE POLICY "feed_tests_delete"
  ON feed_tests FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR is_admin()
  );

-- ============================================================
-- TABLE: quality_tiers
-- ============================================================
ALTER TABLE quality_tiers ENABLE ROW LEVEL SECURITY;

-- Read: same visibility as listings
CREATE POLICY "quality_tiers_select"
  ON quality_tiers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = quality_tiers.listing_id
        AND (l.status = 'active' OR l.seller_id = auth.uid())
    )
    OR is_admin()
  );

-- Managed by trigger only — no direct user insert/update/delete
CREATE POLICY "quality_tiers_insert_trigger"
  ON quality_tiers FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "quality_tiers_update_trigger"
  ON quality_tiers FOR UPDATE
  USING (is_admin());

-- ============================================================
-- TABLE: offers
-- ============================================================
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Buyers can see their own offers; sellers can see offers on their listings
CREATE POLICY "offers_select"
  ON offers FOR SELECT
  USING (
    buyer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = offers.listing_id AND l.seller_id = auth.uid()
    )
    OR is_admin()
  );

-- Buyers can create offers on active listings
CREATE POLICY "offers_insert"
  ON offers FOR INSERT
  WITH CHECK (
    buyer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id AND l.status = 'active'
    )
  );

-- Buyers can update (withdraw) their own pending offers;
-- sellers can update (accept/reject) offers on their listings
CREATE POLICY "offers_update"
  ON offers FOR UPDATE
  USING (
    buyer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = offers.listing_id AND l.seller_id = auth.uid()
    )
    OR is_admin()
  );

-- Buyers can delete their own pending offers
CREATE POLICY "offers_delete"
  ON offers FOR DELETE
  USING (buyer_id = auth.uid() AND status = 'pending');

-- ============================================================
-- TABLE: orders
-- ============================================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Buyer, seller and assigned carrier can read their orders
CREATE POLICY "orders_select"
  ON orders FOR SELECT
  USING (
    buyer_id  = auth.uid()
    OR seller_id = auth.uid()
    OR carrier_id = auth.uid()
    OR is_admin()
  );

-- Created by service layer (service role) — restrict direct insert
CREATE POLICY "orders_insert"
  ON orders FOR INSERT
  WITH CHECK (
    buyer_id = auth.uid()
    OR is_admin()
  );

-- Buyer, seller, carrier can update status fields on their orders
CREATE POLICY "orders_update"
  ON orders FOR UPDATE
  USING (
    buyer_id  = auth.uid()
    OR seller_id = auth.uid()
    OR carrier_id = auth.uid()
    OR is_admin()
  );

-- Only admins can delete orders
CREATE POLICY "orders_delete"
  ON orders FOR DELETE
  USING (is_admin());

-- ============================================================
-- TABLE: freight_jobs
-- ============================================================
ALTER TABLE freight_jobs ENABLE ROW LEVEL SECURITY;

-- Open jobs visible to all authenticated users (carriers browse)
CREATE POLICY "freight_jobs_select"
  ON freight_jobs FOR SELECT
  USING (
    status = 'open'
    OR posted_by  = auth.uid()
    OR carrier_id = auth.uid()
    OR is_admin()
  );

-- Any authenticated user can post a freight job
CREATE POLICY "freight_jobs_insert"
  ON freight_jobs FOR INSERT
  WITH CHECK (posted_by = auth.uid());

-- Poster or assigned carrier can update
CREATE POLICY "freight_jobs_update"
  ON freight_jobs FOR UPDATE
  USING (
    posted_by  = auth.uid()
    OR carrier_id = auth.uid()
    OR is_admin()
  );

-- Only poster or admin can delete
CREATE POLICY "freight_jobs_delete"
  ON freight_jobs FOR DELETE
  USING (posted_by = auth.uid() OR is_admin());

-- ============================================================
-- TABLE: weigh_events
-- ============================================================
ALTER TABLE weigh_events ENABLE ROW LEVEL SECURITY;

-- Order participants (buyer, seller, carrier) can read weigh events
CREATE POLICY "weigh_events_select"
  ON weigh_events FOR SELECT
  USING (
    recorded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = weigh_events.order_id
        AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid() OR o.carrier_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM freight_jobs fj
      WHERE fj.id = weigh_events.freight_job_id
        AND (fj.posted_by = auth.uid() OR fj.carrier_id = auth.uid())
    )
    OR is_admin()
  );

-- Order participants can create weigh events
CREATE POLICY "weigh_events_insert"
  ON weigh_events FOR INSERT
  WITH CHECK (
    recorded_by = auth.uid()
    AND (
      order_id IS NULL
      OR EXISTS (
        SELECT 1 FROM orders o
        WHERE o.id = order_id
          AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid() OR o.carrier_id = auth.uid())
      )
    )
  );

-- Recorded-by user or admin can update (e.g. attach image URL)
CREATE POLICY "weigh_events_update"
  ON weigh_events FOR UPDATE
  USING (recorded_by = auth.uid() OR is_admin());

-- Only admin can delete weigh events (audit trail)
CREATE POLICY "weigh_events_delete"
  ON weigh_events FOR DELETE
  USING (is_admin());

-- ============================================================
-- TABLE: proof_of_delivery
-- ============================================================
ALTER TABLE proof_of_delivery ENABLE ROW LEVEL SECURITY;

-- Order participants can read POD
CREATE POLICY "pod_select"
  ON proof_of_delivery FOR SELECT
  USING (
    submitted_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = proof_of_delivery.order_id
        AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid() OR o.carrier_id = auth.uid())
    )
    OR is_admin()
  );

-- Carrier or seller can submit POD
CREATE POLICY "pod_insert"
  ON proof_of_delivery FOR INSERT
  WITH CHECK (
    submitted_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id
        AND (o.seller_id = auth.uid() OR o.carrier_id = auth.uid())
    )
  );

-- Submitter or admin can update
CREATE POLICY "pod_update"
  ON proof_of_delivery FOR UPDATE
  USING (submitted_by = auth.uid() OR is_admin());

-- Only admin can delete
CREATE POLICY "pod_delete"
  ON proof_of_delivery FOR DELETE
  USING (is_admin());

-- ============================================================
-- TABLE: reviews
-- ============================================================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Reviews are publicly readable
CREATE POLICY "reviews_select"
  ON reviews FOR SELECT
  USING (TRUE);

-- Can only review after order is completed; one review per pair per order
CREATE POLICY "reviews_insert"
  ON reviews FOR INSERT
  WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id
        AND o.status = 'completed'
        AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid() OR o.carrier_id = auth.uid())
    )
  );

-- Reviewer can update their own review (within 48h — enforced at app layer)
CREATE POLICY "reviews_update"
  ON reviews FOR UPDATE
  USING (reviewer_id = auth.uid() OR is_admin());

-- Only admin can delete reviews
CREATE POLICY "reviews_delete"
  ON reviews FOR DELETE
  USING (is_admin());

COMMIT;
