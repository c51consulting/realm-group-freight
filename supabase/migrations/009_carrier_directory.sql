-- Migration 009: Carrier Directory (public-facing listings)
-- Separate from `carriers` (operational onboarding for self-serve carriers).
-- This table holds the curated network of AU carriers shown at /carriers,
-- imported initially from REALM_Carrier_Network_Australia CSV.
-- Idempotent.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- 1. carrier_directory
-- =========================================================
CREATE TABLE IF NOT EXISTS carrier_directory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realm_record_id TEXT UNIQUE NOT NULL,          -- e.g. RCN-AU-0001
  operator_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,                     -- url-safe operator_name

  -- Contact
  address TEXT,
  phone TEXT,
  email TEXT,
  digital_contact_type TEXT,                     -- "public email" | "contact form" | etc.
  website TEXT,

  -- Categorisation (denormalised arrays for fast filtering)
  carrier_type TEXT,                             -- raw csv string
  carrier_type_tags TEXT[] DEFAULT '{}',         -- parsed: ['road freight','courier','rail freight'...]
  equipment_and_services TEXT,                   -- raw csv string
  equipment_tags TEXT[] DEFAULT '{}',            -- parsed
  operating_regions TEXT,                        -- raw csv string ("NSW, VIC, QLD" or "Australia wide")
  region_tags TEXT[] DEFAULT '{}',               -- parsed states: ['NSW','VIC',...] or ['ALL']

  pos_matching_fit TEXT,                         -- internal note (admin-only)
  country TEXT DEFAULT 'Australia',
  verification_status TEXT DEFAULT 'unverified', -- 'verified' | 'unverified' | 'flagged'
  confidence TEXT,                               -- 'High' | 'Medium' | 'Low'
  source_urls TEXT,
  research_subject TEXT,

  -- Claim / ownership link (optional; set when a carrier claims their listing)
  claimed_by_carrier_id UUID REFERENCES carriers(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ,

  -- Admin moderation
  is_published BOOLEAN NOT NULL DEFAULT true,
  admin_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cd_published ON carrier_directory(is_published);
CREATE INDEX IF NOT EXISTS idx_cd_region_tags ON carrier_directory USING GIN(region_tags);
CREATE INDEX IF NOT EXISTS idx_cd_type_tags ON carrier_directory USING GIN(carrier_type_tags);
CREATE INDEX IF NOT EXISTS idx_cd_equipment_tags ON carrier_directory USING GIN(equipment_tags);
CREATE INDEX IF NOT EXISTS idx_cd_verification ON carrier_directory(verification_status);
CREATE INDEX IF NOT EXISTS idx_cd_operator_name_trgm ON carrier_directory USING GIN (operator_name gin_trgm_ops);

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =========================================================
-- 2. carrier_directory_messages (in-app contact)
-- =========================================================
CREATE TABLE IF NOT EXISTS carrier_directory_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  directory_id UUID NOT NULL REFERENCES carrier_directory(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Snapshot of sender at time of send (so carrier sees real info even if user later changes)
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  sender_phone TEXT,
  sender_company TEXT,

  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  freight_type TEXT,                          -- optional structured hint: 'livestock' | 'grain' | 'general'
  origin_region TEXT,
  destination_region TEXT,
  estimated_quantity TEXT,
  pickup_date DATE,

  -- Delivery status
  delivered_email BOOLEAN DEFAULT false,
  delivered_email_id TEXT,                    -- Resend message id
  delivered_error TEXT,

  -- Carrier-side response (if claimed)
  carrier_replied_at TIMESTAMPTZ,
  carrier_reply TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cdm_directory ON carrier_directory_messages(directory_id);
CREATE INDEX IF NOT EXISTS idx_cdm_sender ON carrier_directory_messages(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_cdm_created ON carrier_directory_messages(created_at DESC);

-- =========================================================
-- 3. carrier_directory_claims (verification flow)
-- =========================================================
CREATE TABLE IF NOT EXISTS carrier_directory_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  directory_id UUID NOT NULL REFERENCES carrier_directory(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  claimed_business_name TEXT NOT NULL,
  claimed_abn TEXT,
  contact_role TEXT,                          -- 'Owner' | 'Manager' | 'Operations' | etc.
  evidence_notes TEXT,                        -- free-text proof (eg "I'll respond from info@..."
  verification_token TEXT UNIQUE NOT NULL,    -- one-time link sent to listed email
  verification_email TEXT NOT NULL,           -- the email the token was sent to (from directory.email)
  verified_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected','expired')),
  rejected_reason TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (directory_id, user_id)              -- one pending claim per user per listing
);

CREATE INDEX IF NOT EXISTS idx_cdc_status ON carrier_directory_claims(status);
CREATE INDEX IF NOT EXISTS idx_cdc_token ON carrier_directory_claims(verification_token);

-- =========================================================
-- 4. Triggers: keep updated_at fresh
-- =========================================================
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cd_touch ON carrier_directory;
CREATE TRIGGER trg_cd_touch
  BEFORE UPDATE ON carrier_directory
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- =========================================================
-- 5. Row Level Security
-- =========================================================
ALTER TABLE carrier_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE carrier_directory_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE carrier_directory_claims ENABLE ROW LEVEL SECURITY;

-- carrier_directory:
--   PUBLIC SELECT for published rows (anyone can browse the directory)
--   Admins (users.is_admin = true) full control
--   The claiming carrier can UPDATE their own listing (after claim verified)

DROP POLICY IF EXISTS cd_select_public ON carrier_directory;
CREATE POLICY cd_select_public ON carrier_directory
  FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS cd_admin_all ON carrier_directory;
CREATE POLICY cd_admin_all ON carrier_directory
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

DROP POLICY IF EXISTS cd_claimed_update ON carrier_directory;
CREATE POLICY cd_claimed_update ON carrier_directory
  FOR UPDATE
  USING (
    claimed_by_carrier_id IS NOT NULL
    AND claimed_by_carrier_id IN (SELECT id FROM carriers WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    claimed_by_carrier_id IS NOT NULL
    AND claimed_by_carrier_id IN (SELECT id FROM carriers WHERE owner_id = auth.uid())
  );

-- carrier_directory_messages:
--   Signed-in users can INSERT (their own messages)
--   Sender can SELECT their own messages
--   Claimed carrier can SELECT messages for their listing
--   Admins full access

DROP POLICY IF EXISTS cdm_insert_self ON carrier_directory_messages;
CREATE POLICY cdm_insert_self ON carrier_directory_messages
  FOR INSERT
  WITH CHECK (sender_user_id = auth.uid());

DROP POLICY IF EXISTS cdm_select_self ON carrier_directory_messages;
CREATE POLICY cdm_select_self ON carrier_directory_messages
  FOR SELECT
  USING (
    sender_user_id = auth.uid()
    OR directory_id IN (
      SELECT cd.id FROM carrier_directory cd
      JOIN carriers c ON c.id = cd.claimed_by_carrier_id
      WHERE c.owner_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

DROP POLICY IF EXISTS cdm_update_carrier_reply ON carrier_directory_messages;
CREATE POLICY cdm_update_carrier_reply ON carrier_directory_messages
  FOR UPDATE
  USING (
    directory_id IN (
      SELECT cd.id FROM carrier_directory cd
      JOIN carriers c ON c.id = cd.claimed_by_carrier_id
      WHERE c.owner_id = auth.uid()
    )
  );

-- carrier_directory_claims:
--   User can INSERT their own claim
--   User can SELECT their own claims
--   Admins full access

DROP POLICY IF EXISTS cdc_insert_self ON carrier_directory_claims;
CREATE POLICY cdc_insert_self ON carrier_directory_claims
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS cdc_select_self ON carrier_directory_claims;
CREATE POLICY cdc_select_self ON carrier_directory_claims
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

DROP POLICY IF EXISTS cdc_admin_update ON carrier_directory_claims;
CREATE POLICY cdc_admin_update ON carrier_directory_claims
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );
