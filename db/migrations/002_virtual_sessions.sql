ALTER TABLE students
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS guardian_phone text;

ALTER TABLE imports DROP CONSTRAINT IF EXISTS imports_kind_check;
ALTER TABLE imports
  ADD CONSTRAINT imports_kind_check
  CHECK (kind IN ('students','attendance','virtual_evidence','virtual_sessions'));

CREATE TABLE IF NOT EXISTS virtual_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campus_id uuid REFERENCES campuses(id) ON DELETE SET NULL,
  external_id text NOT NULL,
  title text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  required boolean NOT NULL DEFAULT true,
  live_url text,
  source text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, source, external_id)
);
CREATE INDEX IF NOT EXISTS virtual_sessions_org_start_idx ON virtual_sessions(org_id, starts_at);

CREATE TABLE IF NOT EXISTS session_participation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES virtual_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','joined','missed','recovered','excused')),
  joined_at timestamptz,
  left_at timestamptz,
  minutes integer,
  source text NOT NULL DEFAULT 'schedule',
  evidence_event_id uuid REFERENCES virtual_evidence_events(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, student_id)
);
CREATE INDEX IF NOT EXISTS session_participation_org_status_idx
  ON session_participation(org_id, status, updated_at);

CREATE TABLE IF NOT EXISTS checkin_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_id uuid REFERENCES virtual_sessions(id) ON DELETE CASCADE,
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS checkin_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_id uuid REFERENCES virtual_sessions(id) ON DELETE SET NULL,
  case_id uuid REFERENCES cases(id) ON DELETE SET NULL,
  barrier_code text NOT NULL,
  barrier_label text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS checkin_responses_org_created_idx
  ON checkin_responses(org_id, created_at DESC);
