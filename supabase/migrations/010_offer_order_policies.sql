-- Allow normal marketplace offer and order lifecycle under RLS.
-- Safe to re-run.

-- Authenticated users must be able to create their public profile row.
-- Listing and offer APIs upsert this row as the FK target for seller/buyer IDs.
DROP POLICY IF EXISTS "Users can create own profile" ON users;
CREATE POLICY "Users can create own profile" ON users
  FOR INSERT WITH CHECK (
    auth.uid() = id
  );

-- Sellers must be able to see offers made on their own listings.
DROP POLICY IF EXISTS "Sellers can view listing offers" ON offers;
CREATE POLICY "Sellers can view listing offers" ON offers
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM listings l
      WHERE l.id = offers.listing_id
        AND l.seller_id = auth.uid()
    )
  );

-- Buyers may withdraw their pending offers.
DROP POLICY IF EXISTS "Buyers can withdraw own pending offers" ON offers;
CREATE POLICY "Buyers can withdraw own pending offers" ON offers
  FOR UPDATE USING (
    buyer_id = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (
    buyer_id = auth.uid()
    AND status IN ('pending', 'withdrawn')
  );

-- Sellers may accept or reject pending offers on their own listings.
DROP POLICY IF EXISTS "Sellers can action listing offers" ON offers;
CREATE POLICY "Sellers can action listing offers" ON offers
  FOR UPDATE USING (
    status = 'pending'
    AND EXISTS (
      SELECT 1
      FROM listings l
      WHERE l.id = offers.listing_id
        AND l.seller_id = auth.uid()
    )
  )
  WITH CHECK (
    status IN ('pending', 'accepted', 'rejected')
    AND EXISTS (
      SELECT 1
      FROM listings l
      WHERE l.id = offers.listing_id
        AND l.seller_id = auth.uid()
    )
  );

-- Orders are created from an accepted offer or buy-now action by one of the
-- parties, then visible to participants via the existing SELECT policy.
DROP POLICY IF EXISTS "Participants can create orders" ON orders;
CREATE POLICY "Participants can create orders" ON orders
  FOR INSERT WITH CHECK (
    auth.uid() IN (buyer_id, seller_id)
  );

DROP POLICY IF EXISTS "Participants can update orders" ON orders;
CREATE POLICY "Participants can update orders" ON orders
  FOR UPDATE USING (
    auth.uid() IN (buyer_id, seller_id, carrier_id)
  )
  WITH CHECK (
    auth.uid() IN (buyer_id, seller_id, carrier_id)
  );
