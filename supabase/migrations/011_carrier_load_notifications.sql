-- Private carrier network load alerts.
-- Carriers are matched in the backend and notified directly; buyers/sellers do not browse public carrier listings.

CREATE TABLE IF NOT EXISTS carrier_load_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  carrier_id UUID NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
  carrier_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sms_sent','accepted','rejected','expired','failed')),
  channel TEXT NOT NULL DEFAULT 'sms' CHECK (channel IN ('sms','email','in_app')),
  sent_to TEXT,
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (order_id, carrier_id)
);

CREATE INDEX IF NOT EXISTS idx_cln_order ON carrier_load_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_cln_carrier ON carrier_load_notifications(carrier_id);
CREATE INDEX IF NOT EXISTS idx_cln_owner_status ON carrier_load_notifications(carrier_owner_id, status);

ALTER TABLE carrier_load_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cln_select_owner_or_admin ON carrier_load_notifications;
CREATE POLICY cln_select_owner_or_admin ON carrier_load_notifications
  FOR SELECT TO authenticated
  USING (
    carrier_owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

DROP POLICY IF EXISTS cln_update_owner_response ON carrier_load_notifications;
CREATE POLICY cln_update_owner_response ON carrier_load_notifications
  FOR UPDATE TO authenticated
  USING (
    carrier_owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  )
  WITH CHECK (
    carrier_owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

DROP POLICY IF EXISTS cln_admin_all ON carrier_load_notifications;
CREATE POLICY cln_admin_all ON carrier_load_notifications
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'));

DROP TRIGGER IF EXISTS tg_carrier_load_notifications_updated_at ON carrier_load_notifications;
CREATE TRIGGER tg_carrier_load_notifications_updated_at BEFORE UPDATE ON carrier_load_notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP POLICY IF EXISTS orders_select_notified_carrier ON orders;
CREATE POLICY orders_select_notified_carrier ON orders
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM carrier_load_notifications n
      WHERE n.order_id = orders.id
        AND n.carrier_owner_id = auth.uid()
        AND n.status IN ('pending','sms_sent','accepted')
    )
  );

DROP POLICY IF EXISTS orders_claim_notified_carrier ON orders;
CREATE POLICY orders_claim_notified_carrier ON orders
  FOR UPDATE TO authenticated
  USING (
    carrier_id IS NULL
    AND status = 'paid'
    AND EXISTS (
      SELECT 1
      FROM carrier_load_notifications n
      WHERE n.order_id = orders.id
        AND n.carrier_owner_id = auth.uid()
        AND n.status IN ('pending','sms_sent')
    )
  )
  WITH CHECK (
    carrier_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM carrier_load_notifications n
      WHERE n.order_id = orders.id
        AND n.carrier_owner_id = auth.uid()
        AND n.status IN ('pending','sms_sent','accepted')
    )
  );
