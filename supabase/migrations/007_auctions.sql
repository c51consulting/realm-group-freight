-- 007_auctions.sql
-- Adds Auction It mode alongside existing List It / Sell It flows.
-- Mechanics: English ascending with optional reserve + optional Buy-Now,
-- fixed $10 increments, hard close at deadline, auto-convert winning bid to a paid-pending order.
-- Safe to re-run.

-- ---------------------------------------------------------------
-- 1. Extend listings: seller's chosen mode + auction fields
-- ---------------------------------------------------------------

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS listing_mode TEXT
    NOT NULL DEFAULT 'list'
    CHECK (listing_mode IN ('list', 'sell', 'auction'));
-- list   = browse/discovery only (POA, "contact seller")
-- sell   = fixed-price, instant Stripe checkout
-- auction = bidding flow (this migration)

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS auction_starts_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auction_ends_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auction_starting_price   DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS auction_reserve_price    DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS auction_buy_now_price    DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS auction_increment        DECIMAL(10,2) DEFAULT 10.00,
  ADD COLUMN IF NOT EXISTS auction_current_bid      DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS auction_high_bidder_id   UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS auction_bid_count        INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS auction_status           TEXT
    CHECK (auction_status IN ('scheduled', 'live', 'ended_sold', 'ended_no_sale', 'cancelled')),
  ADD COLUMN IF NOT EXISTS auction_winner_id        UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS auction_winning_bid      DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS auction_closed_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auction_order_id         UUID REFERENCES orders(id);

-- Soft constraints (cheap consistency checks)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'auction_window_valid'
  ) THEN
    ALTER TABLE listings
      ADD CONSTRAINT auction_window_valid
      CHECK (
        listing_mode <> 'auction'
        OR (auction_starts_at IS NOT NULL
            AND auction_ends_at IS NOT NULL
            AND auction_ends_at > auction_starts_at
            AND auction_starting_price IS NOT NULL
            AND auction_starting_price >= 0)
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_listings_auction_ends_at
  ON listings(auction_ends_at)
  WHERE listing_mode = 'auction' AND auction_status IN ('scheduled', 'live');

CREATE INDEX IF NOT EXISTS idx_listings_listing_mode
  ON listings(listing_mode);

-- ---------------------------------------------------------------
-- 2. bids table
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS bids (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id   UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  bidder_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount       DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  is_winning   BOOLEAN DEFAULT false,
  is_buy_now   BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bids_listing       ON bids(listing_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bids_bidder        ON bids(bidder_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bids_listing_amount ON bids(listing_id, amount DESC);

-- ---------------------------------------------------------------
-- 3. Trigger: keep listing's current high bid + bidder in sync
-- ---------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_bids_update_listing()
RETURNS TRIGGER AS $$
DECLARE
  v_listing listings%ROWTYPE;
BEGIN
  SELECT * INTO v_listing FROM listings WHERE id = NEW.listing_id FOR UPDATE;

  IF v_listing IS NULL THEN
    RAISE EXCEPTION 'Listing % not found', NEW.listing_id;
  END IF;

  IF v_listing.listing_mode <> 'auction' THEN
    RAISE EXCEPTION 'Listing % is not an auction', NEW.listing_id;
  END IF;

  IF v_listing.auction_status NOT IN ('scheduled', 'live') THEN
    RAISE EXCEPTION 'Auction % is not open for bids (status: %)', NEW.listing_id, v_listing.auction_status;
  END IF;

  IF v_listing.auction_ends_at IS NOT NULL AND now() >= v_listing.auction_ends_at THEN
    RAISE EXCEPTION 'Auction % has ended', NEW.listing_id;
  END IF;

  IF v_listing.auction_starts_at IS NOT NULL AND now() < v_listing.auction_starts_at THEN
    RAISE EXCEPTION 'Auction % has not started yet', NEW.listing_id;
  END IF;

  IF v_listing.seller_id = NEW.bidder_id THEN
    RAISE EXCEPTION 'Seller cannot bid on own auction';
  END IF;

  -- Minimum bid: max(starting_price, current_bid + increment)
  IF v_listing.auction_current_bid IS NOT NULL
     AND NEW.amount < v_listing.auction_current_bid + COALESCE(v_listing.auction_increment, 10) THEN
    RAISE EXCEPTION 'Bid must be at least % (current % + increment %)',
      v_listing.auction_current_bid + COALESCE(v_listing.auction_increment, 10),
      v_listing.auction_current_bid,
      COALESCE(v_listing.auction_increment, 10);
  END IF;

  IF v_listing.auction_current_bid IS NULL
     AND NEW.amount < v_listing.auction_starting_price THEN
    RAISE EXCEPTION 'First bid must be at least starting price %', v_listing.auction_starting_price;
  END IF;

  -- Mark previous bids as not winning, mark this one winning
  UPDATE bids SET is_winning = false WHERE listing_id = NEW.listing_id AND id <> NEW.id;
  NEW.is_winning := true;

  -- Update listing snapshot
  UPDATE listings
  SET auction_current_bid    = NEW.amount,
      auction_high_bidder_id = NEW.bidder_id,
      auction_bid_count      = COALESCE(auction_bid_count, 0) + 1,
      auction_status         = CASE WHEN auction_status = 'scheduled' THEN 'live' ELSE auction_status END,
      updated_at             = now()
  WHERE id = NEW.listing_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bids_update_listing ON bids;
CREATE TRIGGER trg_bids_update_listing
  BEFORE INSERT ON bids
  FOR EACH ROW
  EXECUTE FUNCTION fn_bids_update_listing();

-- ---------------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------------

ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Bidders see own bids" ON bids;
CREATE POLICY "Bidders see own bids" ON bids
  FOR SELECT USING (bidder_id = auth.uid());

DROP POLICY IF EXISTS "Sellers see bids on own listings" ON bids;
CREATE POLICY "Sellers see bids on own listings" ON bids
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM listings l WHERE l.id = bids.listing_id AND l.seller_id = auth.uid())
  );

DROP POLICY IF EXISTS "Public sees bid amounts on active auctions" ON bids;
CREATE POLICY "Public sees bid amounts on active auctions" ON bids
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = bids.listing_id
        AND l.listing_mode = 'auction'
        AND l.auction_status IN ('scheduled', 'live', 'ended_sold', 'ended_no_sale')
    )
  );

DROP POLICY IF EXISTS "Bidders insert own bids" ON bids;
CREATE POLICY "Bidders insert own bids" ON bids
  FOR INSERT WITH CHECK (bidder_id = auth.uid());

DROP POLICY IF EXISTS "Admin all bids" ON bids;
CREATE POLICY "Admin all bids" ON bids
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- ---------------------------------------------------------------
-- 5. Helper view: live auctions
-- ---------------------------------------------------------------

CREATE OR REPLACE VIEW live_auctions AS
SELECT
  l.id,
  l.title,
  l.material_type,
  l.pickup_address,
  l.images,
  l.auction_starts_at,
  l.auction_ends_at,
  l.auction_starting_price,
  l.auction_reserve_price,
  l.auction_buy_now_price,
  l.auction_current_bid,
  l.auction_bid_count,
  l.auction_high_bidder_id,
  l.auction_status,
  EXTRACT(EPOCH FROM (l.auction_ends_at - now())) AS seconds_remaining
FROM listings l
WHERE l.listing_mode = 'auction'
  AND l.auction_status IN ('scheduled', 'live')
  AND l.status = 'active';

GRANT SELECT ON live_auctions TO anon, authenticated;
