CREATE TABLE IF NOT EXISTS operator_profiles (
  org_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  assistant_name text NOT NULL DEFAULT 'Operator',
  timezone text NOT NULL DEFAULT 'America/New_York',
  assistant_phone text,
  assistant_email text,
  home_base text,
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS operator_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL,
  request text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  status text NOT NULL DEFAULT 'ready'
    CHECK (status IN ('planning','ready','awaiting_approval','in_progress','waiting_external','completed','failed','cancelled')),
  priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high','urgent')),
  source text NOT NULL DEFAULT 'web'
    CHECK (source IN ('web','sms','email','voice','automation','api')),
  budget_limit numeric(12,2),
  actual_spend numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  plan jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  due_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS operator_tasks_org_status_idx
  ON operator_tasks(org_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS operator_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES operator_tasks(id) ON DELETE CASCADE,
  sequence integer NOT NULL,
  kind text NOT NULL
    CHECK (kind IN ('research','api','browser','voice','email','calendar','payment','human')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','awaiting_approval','running','waiting_external','completed','failed','skipped')),
  summary text NOT NULL,
  provider text,
  requires_approval boolean NOT NULL DEFAULT false,
  request jsonb NOT NULL DEFAULT '{}'::jsonb,
  response jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(task_id, sequence)
);
CREATE INDEX IF NOT EXISTS operator_steps_task_idx ON operator_steps(task_id, sequence);

CREATE TABLE IF NOT EXISTS operator_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES operator_tasks(id) ON DELETE CASCADE,
  step_id uuid REFERENCES operator_steps(id) ON DELETE CASCADE,
  approval_type text NOT NULL
    CHECK (approval_type IN ('spend','booking','communication','calendar','account_change','sensitive','other')),
  summary text NOT NULL,
  amount numeric(12,2),
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','expired')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS operator_approvals_org_status_idx
  ON operator_approvals(org_id, status, requested_at DESC);

CREATE TABLE IF NOT EXISTS operator_authority_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain text NOT NULL,
  action text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  policy jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, domain, action)
);

CREATE TABLE IF NOT EXISTS operator_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  memory_key text NOT NULL,
  value jsonb NOT NULL,
  sensitivity text NOT NULL DEFAULT 'normal'
    CHECK (sensitivity IN ('normal','private','restricted')),
  source text NOT NULL DEFAULT 'user',
  confidence numeric(4,3) NOT NULL DEFAULT 1,
  last_confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, memory_key)
);

CREATE TABLE IF NOT EXISTS operator_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider text NOT NULL,
  status text NOT NULL DEFAULT 'disconnected'
    CHECK (status IN ('disconnected','connected','error','disabled')),
  capabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  public_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_verified_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, provider)
);

CREATE TABLE IF NOT EXISTS operator_events (
  id bigserial PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  task_id uuid REFERENCES operator_tasks(id) ON DELETE CASCADE,
  step_id uuid REFERENCES operator_steps(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  message text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS operator_events_org_created_idx
  ON operator_events(org_id, created_at DESC);
