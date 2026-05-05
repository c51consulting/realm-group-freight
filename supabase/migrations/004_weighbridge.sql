-- REALM Weighbridge Integration (Phase 1)
-- Tables for weighbridge sites, devices, tickets, and order linkage

-- Weighbridge sites
CREATE TABLE IF NOT EXISTS weighbridges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  operator TEXT,
  address TEXT,
  state TEXT,
  postcode TEXT,
  lat FLOAT,
  lng FLOAT,
  nmi_certified BOOLEAN DEFAULT false,
  nmi_cert_number TEXT,
  nmi_cert_expires DATE,
  provider TEXT,
  api_type TEXT DEFAULT 'webhook' CHECK (api_type IN ('webhook','polling','mqtt','manual')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Devices/integrations registered at a weighbridge (for auth)
CREATE TABLE IF NOT EXISTS weighbridge_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  weighbridge_id UUID NOT NULL REFERENCES weighbridges(id) ON DELETE CASCADE,
  device_serial TEXT,
  device_label TEXT,
  api_key_hash TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','revoked','suspended')),
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wb_devices_apikey ON weighbridge_devices(api_key_hash);

-- Canonical weighing event
CREATE TABLE IF NOT EXISTS weighbridge_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  weighbridge_id UUID NOT NULL REFERENCES weighbridges(id),
  device_id UUID REFERENCES weighbridge_devices(id),
  ticket_number TEXT,
  vehicle_rego TEXT,
  trailer_rego TEXT,
  driver_name TEXT,
  carrier_name TEXT,
  gross_kg DECIMAL(10,2),
  tare_kg DECIMAL(10,2),
  net_kg DECIMAL(10,2),
  moisture_pct DECIMAL(5,2),
  commodity_code TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  lat FLOAT,
  lng FLOAT,
  source TEXT DEFAULT 'webhook' CHECK (source IN ('webhook','manual','mqtt','import')),
  signature TEXT,
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wb_tickets_rego ON weighbridge_tickets(vehicle_rego);
CREATE INDEX IF NOT EXISTS idx_wb_tickets_recorded ON weighbridge_tickets(recorded_at DESC);

-- Linkage between weighbridge ticket and order/listing
CREATE TABLE IF NOT EXISTS order_weighbridge_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  ticket_id UUID NOT NULL REFERENCES weighbridge_tickets(id) ON DELETE CASCADE,
  direction TEXT CHECK (direction IN ('inbound','outbound','loaded','unloaded')),
  matched_by TEXT DEFAULT 'auto' CHECK (matched_by IN ('auto','driver','admin','manual')),
  confidence DECIMAL(4,3),
  variance_pct DECIMAL(6,3),
  flagged BOOLEAN DEFAULT false,
  verified_by_user_id UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_owe_order ON order_weighbridge_events(order_id);
CREATE INDEX IF NOT EXISTS idx_owe_ticket ON order_weighbridge_events(ticket_id);

ALTER TABLE weighbridges ENABLE ROW LEVEL SECURITY;
ALTER TABLE weighbridge_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE weighbridge_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_weighbridge_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "weighbridges_read_all" ON weighbridges;
CREATE POLICY "weighbridges_read_all" ON weighbridges FOR SELECT TO authenticated USING (active = true);

DROP POLICY IF EXISTS "wb_devices_admin" ON weighbridge_devices;
CREATE POLICY "wb_devices_admin" ON weighbridge_devices FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

DROP POLICY IF EXISTS "wb_tickets_read_party" ON weighbridge_tickets;
CREATE POLICY "wb_tickets_read_party" ON weighbridge_tickets FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM order_weighbridge_events owe
      JOIN orders o ON o.id = owe.order_id
      WHERE owe.ticket_id = weighbridge_tickets.id
        AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid() OR o.carrier_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

DROP POLICY IF EXISTS "owe_read_party" ON order_weighbridge_events;
CREATE POLICY "owe_read_party" ON order_weighbridge_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_weighbridge_events.order_id
        AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid() OR o.carrier_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE OR REPLACE VIEW order_weighbridge_summary AS
SELECT
  owe.order_id,
  COUNT(*) AS event_count,
  SUM(CASE WHEN owe.direction IN ('loaded','outbound') THEN t.net_kg ELSE 0 END) AS loaded_net_kg,
  SUM(CASE WHEN owe.direction IN ('unloaded','inbound') THEN t.net_kg ELSE 0 END) AS unloaded_net_kg,
  MAX(t.recorded_at) AS last_recorded_at,
  BOOL_OR(owe.flagged) AS any_flagged
FROM order_weighbridge_events owe
JOIN weighbridge_tickets t ON t.id = owe.ticket_id
GROUP BY owe.order_id;

GRANT SELECT ON order_weighbridge_summary TO authenticated;
