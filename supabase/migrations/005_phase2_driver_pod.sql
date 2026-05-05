-- Phase 2: Driver check-in, Proof of Delivery, status auto-transitions

-- 1. driver_checkins
CREATE TABLE IF NOT EXISTS driver_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  driver_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  carrier_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  stage text NOT NULL CHECK (stage IN ('pre_load','post_load','pre_unload','post_unload')),
  vehicle_rego text NOT NULL,
  trailer_rego text,
  abn text,
  odometer_km numeric,
  seal_number text,
  photo_paths text[] NOT NULL DEFAULT '{}',
  lat numeric,
  lng numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_driver_checkins_order ON driver_checkins(order_id);
CREATE INDEX IF NOT EXISTS idx_driver_checkins_driver ON driver_checkins(driver_user_id);

-- 2. proofs_of_delivery
CREATE TABLE IF NOT EXISTS proofs_of_delivery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_name text,
  recipient_role text,
  recipient_company text,
  signature_path text,
  photo_paths text[] NOT NULL DEFAULT '{}',
  weighbridge_event_id uuid REFERENCES order_weighbridge_events(id) ON DELETE SET NULL,
  delivered_qty_kg numeric,
  lat numeric,
  lng numeric,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','disputed')),
  accepted_at timestamptz,
  disputed_at timestamptz,
  dispute_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pod_order ON proofs_of_delivery(order_id);
CREATE INDEX IF NOT EXISTS idx_pod_status ON proofs_of_delivery(status);

-- 3. order_status_transitions
CREATE TABLE IF NOT EXISTS order_status_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  trigger_source text NOT NULL CHECK (trigger_source IN ('manual','weighbridge_event','pod','system')),
  trigger_ref_id uuid,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ost_order ON order_status_transitions(order_id, created_at DESC);

-- 4. RLS
ALTER TABLE driver_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE proofs_of_delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_transitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dc_read_party ON driver_checkins;
CREATE POLICY dc_read_party ON driver_checkins FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = driver_checkins.order_id AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid() OR o.carrier_id = auth.uid()))
);
DROP POLICY IF EXISTS dc_insert_carrier ON driver_checkins;
CREATE POLICY dc_insert_carrier ON driver_checkins FOR INSERT TO authenticated WITH CHECK (
  driver_user_id = auth.uid() OR EXISTS (SELECT 1 FROM orders o WHERE o.id = driver_checkins.order_id AND o.carrier_id = auth.uid())
);

DROP POLICY IF EXISTS pod_read_party ON proofs_of_delivery;
CREATE POLICY pod_read_party ON proofs_of_delivery FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = proofs_of_delivery.order_id AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid() OR o.carrier_id = auth.uid()))
);
DROP POLICY IF EXISTS pod_insert_carrier ON proofs_of_delivery;
CREATE POLICY pod_insert_carrier ON proofs_of_delivery FOR INSERT TO authenticated WITH CHECK (
  recorded_by = auth.uid() AND EXISTS (SELECT 1 FROM orders o WHERE o.id = proofs_of_delivery.order_id AND o.carrier_id = auth.uid())
);
DROP POLICY IF EXISTS pod_update_buyer ON proofs_of_delivery;
CREATE POLICY pod_update_buyer ON proofs_of_delivery FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = proofs_of_delivery.order_id AND o.buyer_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = proofs_of_delivery.order_id AND o.buyer_id = auth.uid())
);

DROP POLICY IF EXISTS ost_read_party ON order_status_transitions;
CREATE POLICY ost_read_party ON order_status_transitions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = order_status_transitions.order_id AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid() OR o.carrier_id = auth.uid()))
);

-- 5. Trigger: auto-transition order status on weighbridge events
CREATE OR REPLACE FUNCTION fn_order_wb_event_status() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  cur_status text;
  new_status text;
BEGIN
  IF NEW.order_id IS NULL OR NEW.direction IS NULL THEN RETURN NEW; END IF;
  SELECT status INTO cur_status FROM orders WHERE id = NEW.order_id;
  IF cur_status IS NULL THEN RETURN NEW; END IF;

  IF NEW.direction = 'loaded' AND cur_status IN ('paid','accepted','pending') THEN
    new_status := 'in_transit';
  ELSIF NEW.direction = 'unloaded' AND cur_status IN ('in_transit','loading','unloading') THEN
    new_status := 'delivered';
  ELSE
    RETURN NEW;
  END IF;

  UPDATE orders SET status = new_status WHERE id = NEW.order_id;
  INSERT INTO order_status_transitions(order_id, from_status, to_status, trigger_source, trigger_ref_id, notes)
    VALUES (NEW.order_id, cur_status, new_status, 'weighbridge_event', NEW.id, 'auto from weighbridge ' || NEW.direction);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tg_order_wb_event_status ON order_weighbridge_events;
CREATE TRIGGER tg_order_wb_event_status AFTER INSERT ON order_weighbridge_events
FOR EACH ROW EXECUTE FUNCTION fn_order_wb_event_status();

-- 6. Storage buckets (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('driver-checkins','driver-checkins', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('pod-images','pod-images', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('pod-signatures','pod-signatures', false) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS dc_storage_read ON storage.objects;
CREATE POLICY dc_storage_read ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id IN ('driver-checkins','pod-images','pod-signatures') AND auth.uid() IS NOT NULL
);
DROP POLICY IF EXISTS dc_storage_write ON storage.objects;
CREATE POLICY dc_storage_write ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id IN ('driver-checkins','pod-images','pod-signatures') AND auth.uid() IS NOT NULL
);
