CREATE TABLE IF NOT EXISTS lead_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('email','webhook')),
  status text NOT NULL CHECK (status IN ('sent','failed')),
  destination text,
  provider_ref text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_deliveries_lead_created_idx
  ON lead_deliveries(lead_id, created_at DESC);
