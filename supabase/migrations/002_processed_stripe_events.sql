-- Create idempotency table for Stripe events
CREATE TABLE IF NOT EXISTS processed_stripe_events (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

-- Add missing columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dispute_id TEXT;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_stripe_checkout_session_id ON orders(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_dispute_id ON orders(dispute_id);

