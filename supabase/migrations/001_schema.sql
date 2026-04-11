-- REALM Ag Marketplace Database Schema
-- Supabase/PostgreSQL migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  business_name TEXT,
  abn TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'carrier', 'admin')),
  address JSONB,
  lat FLOAT,
  lng FLOAT,
  verified BOOLEAN DEFAULT false,
  rating FLOAT DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  stripe_account_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Listings table
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('sell', 'buy', 'freight_only')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'sold', 'expired', 'cancelled')),
  material_type TEXT NOT NULL CHECK (material_type IN ('hay', 'straw', 'silage', 'grain', 'seed', 'pellets', 'fertiliser', 'supplement', 'drums', 'bulk_liquid', 'other')),
  material_subtype TEXT,
  title TEXT NOT NULL,
  description TEXT,
  unit_type TEXT NOT NULL CHECK (unit_type IN ('bale_small', 'bale_large', 'bale_round', 'bag', 'drum', 'tonne', 'kg', 'load', 'pallet', 'cubic_metre', 'litre', 'custom')),
  unit_label TEXT,
  price_per_unit DECIMAL(10,2),
  price_per_tonne_equiv DECIMAL(10,2),
  quantity_available DECIMAL(10,2),
  quantity_unit TEXT,
  minimum_order DECIMAL(10,2),
  estimated_weight_per_unit DECIMAL(10,2),
  pricing_type TEXT DEFAULT 'fixed' CHECK (pricing_type IN ('fixed', 'offers', 'auction', 'urgent')),
  freight_included BOOLEAN DEFAULT false,
  delivery_radius INTEGER,
  pickup_address JSONB,
  pickup_lat FLOAT,
  pickup_lng FLOAT,
  loading_available BOOLEAN DEFAULT false,
  images JSONB DEFAULT '[]',
  quality_level TEXT DEFAULT 'basic' CHECK (quality_level IN ('basic', 'verified', 'performance')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Feed Tests table
CREATE TABLE IF NOT EXISTS feed_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('lab', 'on_farm_nir', 'vendor_estimate')),
  lab_name TEXT,
  device_id TEXT,
  test_date TIMESTAMPTZ,
  certificate_url TEXT,
  dry_matter DECIMAL(5,2),
  moisture DECIMAL(5,2),
  crude_protein DECIMAL(5,2),
  metabolisable_energy DECIMAL(5,2),
  ndf DECIMAL(5,2),
  adf DECIMAL(5,2),
  digestibility DECIMAL(5,2),
  afia_grade TEXT CHECK (afia_grade IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D', 'ungraded')),
  rfv DECIMAL(6,2),
  fei DECIMAL(6,2),
  ash DECIMAL(5,2),
  raw_data JSONB,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Offers table
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn', 'expired')),
  price_per_unit DECIMAL(10,2) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(12,2),
  freight_included BOOLEAN DEFAULT false,
  freight_price DECIMAL(10,2),
  delivery_date TIMESTAMPTZ,
  message TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_id UUID REFERENCES offers(id),
  listing_id UUID REFERENCES listings(id),
  buyer_id UUID REFERENCES users(id),
  seller_id UUID REFERENCES users(id),
  carrier_id UUID REFERENCES users(id),
  order_number TEXT UNIQUE,
  status TEXT DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'paid', 'in_transit', 'delivered', 'confirmed', 'disputed', 'refunded', 'completed')),
  total_amount DECIMAL(12,2),
  freight_amount DECIMAL(10,2),
  platform_fee DECIMAL(10,2),
  payment_held BOOLEAN DEFAULT false,
  payment_released_at TIMESTAMPTZ,
  stripe_payment_intent_id TEXT,
  quality_assurance_level TEXT DEFAULT 'basic' CHECK (quality_assurance_level IN ('basic', 'verified', 'performance')),
  contract_terms JSONB,
  delivery_evidence JSONB DEFAULT '{}',
  confirmed_at TIMESTAMPTZ,
  dispute_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Weighbridge Events table
CREATE TABLE IF NOT EXISTS weighbridge_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id),
  source TEXT NOT NULL CHECK (source IN ('api', 'csv_import', 'email_parse', 'ocr_upload', 'manual')),
  source_system TEXT,
  source_ticket_id TEXT,
  site_id TEXT,
  site_name TEXT,
  vehicle_rego TEXT,
  gross_weight DECIMAL(10,2),
  tare_weight DECIMAL(10,2),
  net_weight DECIMAL(10,2),
  weight_unit TEXT DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'tonne')),
  weighed_at TIMESTAMPTZ,
  operator_name TEXT,
  ticket_image_url TEXT,
  gps_lat FLOAT,
  gps_lng FLOAT,
  trade_approved BOOLEAN DEFAULT false,
  raw_data JSONB,
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES users(id),
  settlement_status TEXT DEFAULT 'pending' CHECK (settlement_status IN ('pending', 'matched', 'disputed', 'settled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id),
  reviewer_id UUID REFERENCES users(id),
  reviewee_id UUID REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  role TEXT CHECK (role IN ('buyer', 'seller', 'carrier')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id),
  sender_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_listings_seller ON listings(seller_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_material ON listings(material_type);
CREATE INDEX idx_listings_type ON listings(type);
CREATE INDEX idx_offers_listing ON offers(listing_id);
CREATE INDEX idx_offers_buyer ON offers(buyer_id);
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_weighbridge_order ON weighbridge_events(order_id);
CREATE INDEX idx_messages_order ON messages(order_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE weighbridge_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Anyone can view active listings" ON listings FOR SELECT USING (status = 'active');
CREATE POLICY "Sellers can manage own listings" ON listings FOR ALL USING (auth.uid() = seller_id);
CREATE POLICY "Anyone can view feed tests" ON feed_tests FOR SELECT USING (true);
CREATE POLICY "Buyers can view own offers" ON offers FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Buyers can create offers" ON offers FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Order participants can view" ON orders FOR SELECT USING (auth.uid() IN (buyer_id, seller_id, carrier_id));
CREATE POLICY "Order participants can view weighbridge" ON weighbridge_events FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND auth.uid() IN (orders.buyer_id, orders.seller_id)));
CREATE POLICY "Message participants" ON messages FOR ALL USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND auth.uid() IN (orders.buyer_id, orders.seller_id)));
