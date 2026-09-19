CREATE TABLE IF NOT EXISTS lead_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('email','webhook')),
  status text NOT NULL CHECK (status IN ('processing','sent','failed')),
  attempts integer NOT NULL DEFAULT 0,
  destination text,
  provider_ref text,
  error text,
  last_attempt_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lead_id, channel)
);

CREATE INDEX IF NOT EXISTS lead_deliveries_status_attempt_idx
  ON lead_deliveries(status, last_attempt_at);
