CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_prefix text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  scopes text[] NOT NULL,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  last_used_at timestamptz,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    cardinality(scopes) > 0
    AND scopes <@ ARRAY['virtual_evidence:write']::text[]
  )
);

CREATE INDEX IF NOT EXISTS api_keys_org_active_idx
  ON api_keys(org_id, active, created_at DESC);

ALTER TABLE api_keys
  ADD CONSTRAINT api_keys_creator_same_org_fk
  FOREIGN KEY (created_by, org_id)
  REFERENCES memberships(user_id, org_id);
