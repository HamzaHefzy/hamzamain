ALTER TABLE funding_assumptions
  ADD COLUMN IF NOT EXISTS annual_anchor_cost numeric(12,2);

COMMENT ON COLUMN funding_assumptions.annual_anchor_cost IS
  'Customer annual Anchor contract cost used for value-realization efficiency reporting. Not a student-level value.';
