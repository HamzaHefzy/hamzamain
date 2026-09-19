ALTER TABLE memberships
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS memberships_org_active_idx
  ON memberships(org_id, active);
