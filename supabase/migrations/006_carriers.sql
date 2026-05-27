-- Phase 3: Carrier self-serve onboarding
-- Adds: carriers (company), carrier_vehicles, carrier_drivers, carrier-docs storage bucket, RLS.
-- Idempotent.

-- 1. carriers (one row per transport company, owned by a user)
CREATE TABLE IF NOT EXISTS carriers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  business_name TEXT NOT NULL,
  abn TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  base_address JSONB,
  gst_registered BOOLEAN DEFAULT false,
  nhvr_accreditation TEXT,
  insurance_provider TEXT,
  insurance_policy_number TEXT,
  insurance_expiry DATE,
  insurance_doc_url TEXT,
  fleet_size INTEGER DEFAULT 0,
  regions_served TEXT[] DEFAULT '{}',
  commodities_handled TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review','active','suspended','rejected')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  stripe_connect_id TEXT,
  rating FLOAT DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_carriers_owner ON carriers(owner_id);
CREATE INDEX IF NOT EXISTS idx_carriers_status ON carriers(status);

-- 2. carrier_vehicles
CREATE TABLE IF NOT EXISTS carrier_vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  carrier_id UUID NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
  rego TEXT NOT NULL,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('rigid','semi','b_double','b_triple','road_train','ute','tipper','livestock_crate','flatbed','other')),
  capacity_tonnes DECIMAL(8,2),
  make TEXT,
  model TEXT,
  year INTEGER,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (carrier_id, rego)
);

CREATE INDEX IF NOT EXISTS idx_carrier_vehicles_carrier ON carrier_vehicles(carrier_id);

-- 3. carrier_drivers
CREATE TABLE IF NOT EXISTS carrier_drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  carrier_id UUID NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  licence_number TEXT,
  licence_class TEXT,
  licence_expiry DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_carrier_drivers_carrier ON carrier_drivers(carrier_id);

-- 4. Storage bucket for compliance docs (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('carrier-docs','carrier-docs', false)
ON CONFLICT (id) DO NOTHING;

-- 5. RLS
ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE carrier_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE carrier_drivers ENABLE ROW LEVEL SECURITY;

-- carriers: owner can CRUD their own; admins can read/update all; anyone authenticated can read active carriers (for buyer/seller to see who's hauling their load)
DROP POLICY IF EXISTS carriers_select_own ON carriers;
CREATE POLICY carriers_select_own ON carriers FOR SELECT TO authenticated USING (
  owner_id = auth.uid()
  OR status = 'active'
  OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

DROP POLICY IF EXISTS carriers_insert_own ON carriers;
CREATE POLICY carriers_insert_own ON carriers FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS carriers_update_own_or_admin ON carriers;
CREATE POLICY carriers_update_own_or_admin ON carriers FOR UPDATE TO authenticated USING (
  owner_id = auth.uid()
  OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

DROP POLICY IF EXISTS carriers_delete_admin ON carriers;
CREATE POLICY carriers_delete_admin ON carriers FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

-- vehicles: owner of carrier can CRUD; admins read/update all; other authenticated read for active carriers' active vehicles
DROP POLICY IF EXISTS carrier_vehicles_select ON carrier_vehicles;
CREATE POLICY carrier_vehicles_select ON carrier_vehicles FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM carriers c WHERE c.id = carrier_vehicles.carrier_id AND (c.owner_id = auth.uid() OR c.status = 'active'))
  OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

DROP POLICY IF EXISTS carrier_vehicles_mutate_owner ON carrier_vehicles;
CREATE POLICY carrier_vehicles_mutate_owner ON carrier_vehicles FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM carriers c WHERE c.id = carrier_vehicles.carrier_id AND c.owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM carriers c WHERE c.id = carrier_vehicles.carrier_id AND c.owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

-- drivers: owner of carrier can CRUD; admins all; the linked driver user can read their own row
DROP POLICY IF EXISTS carrier_drivers_select ON carrier_drivers;
CREATE POLICY carrier_drivers_select ON carrier_drivers FOR SELECT TO authenticated USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM carriers c WHERE c.id = carrier_drivers.carrier_id AND c.owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

DROP POLICY IF EXISTS carrier_drivers_mutate_owner ON carrier_drivers;
CREATE POLICY carrier_drivers_mutate_owner ON carrier_drivers FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM carriers c WHERE c.id = carrier_drivers.carrier_id AND c.owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM carriers c WHERE c.id = carrier_drivers.carrier_id AND c.owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

-- 6. Storage policies for carrier-docs bucket
DROP POLICY IF EXISTS carrier_docs_upload ON storage.objects;
CREATE POLICY carrier_docs_upload ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'carrier-docs' AND auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS carrier_docs_select ON storage.objects;
CREATE POLICY carrier_docs_select ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'carrier-docs' AND (
    -- file path convention: <owner_id>/<filename>  -> only owner or admin can read
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  )
);

DROP POLICY IF EXISTS carrier_docs_delete ON storage.objects;
CREATE POLICY carrier_docs_delete ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'carrier-docs' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  )
);

-- 7. updated_at trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tg_carriers_updated_at ON carriers;
CREATE TRIGGER tg_carriers_updated_at BEFORE UPDATE ON carriers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS tg_carrier_vehicles_updated_at ON carrier_vehicles;
CREATE TRIGGER tg_carrier_vehicles_updated_at BEFORE UPDATE ON carrier_vehicles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS tg_carrier_drivers_updated_at ON carrier_drivers;
CREATE TRIGGER tg_carrier_drivers_updated_at BEFORE UPDATE ON carrier_drivers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 8. Verification
SELECT 'carriers' AS table, COUNT(*) FROM carriers
UNION ALL SELECT 'carrier_vehicles', COUNT(*) FROM carrier_vehicles
UNION ALL SELECT 'carrier_drivers', COUNT(*) FROM carrier_drivers;
