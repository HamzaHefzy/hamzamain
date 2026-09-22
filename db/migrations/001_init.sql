CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  timezone text NOT NULL DEFAULT 'America/New_York',
  status text NOT NULL DEFAULT 'trial' CHECK (status IN ('trial','active','past_due','suspended','cancelled')),
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  password_hash text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','admin','member','viewer')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, org_id)
);
CREATE INDEX memberships_org_active_idx ON memberships(org_id, active);

CREATE TABLE password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (user_id, org_id) REFERENCES memberships(user_id, org_id)
);

CREATE TABLE audit_logs (
  id bigserial PRIMARY KEY,
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  ip_hash text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_org_created_idx ON audit_logs(org_id, created_at DESC);

CREATE TABLE rate_limits (
  key text NOT NULL,
  window_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 1,
  PRIMARY KEY (key, window_start)
);

CREATE TABLE operator_profiles (
  org_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  assistant_name text NOT NULL DEFAULT 'Operator',
  timezone text NOT NULL DEFAULT 'America/New_York',
  assistant_phone text,
  owner_phone text,
  assistant_email text,
  home_base text,
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX operator_profiles_owner_phone_unique ON operator_profiles(owner_phone) WHERE owner_phone IS NOT NULL;
CREATE UNIQUE INDEX operator_profiles_assistant_phone_unique ON operator_profiles(assistant_phone) WHERE assistant_phone IS NOT NULL;

CREATE TABLE operator_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL,
  request text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  status text NOT NULL DEFAULT 'ready' CHECK (status IN ('planning','ready','awaiting_approval','in_progress','waiting_external','completed','failed','cancelled')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  source text NOT NULL DEFAULT 'web' CHECK (source IN ('web','sms','email','voice','automation','api')),
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
CREATE INDEX operator_tasks_org_status_idx ON operator_tasks(org_id, status, created_at DESC);

CREATE TABLE operator_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES operator_tasks(id) ON DELETE CASCADE,
  sequence integer NOT NULL,
  kind text NOT NULL CHECK (kind IN ('research','api','browser','voice','email','calendar','payment','human')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','awaiting_approval','running','waiting_external','completed','failed','skipped')),
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
CREATE INDEX operator_steps_task_idx ON operator_steps(task_id, sequence);

CREATE TABLE operator_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES operator_tasks(id) ON DELETE CASCADE,
  step_id uuid REFERENCES operator_steps(id) ON DELETE CASCADE,
  approval_type text NOT NULL CHECK (approval_type IN ('spend','booking','communication','calendar','account_change','sensitive','other')),
  summary text NOT NULL,
  amount numeric(12,2),
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','expired')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX operator_approvals_org_status_idx ON operator_approvals(org_id, status, requested_at DESC);

CREATE TABLE operator_authority_rules (
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

CREATE TABLE operator_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  memory_key text NOT NULL,
  value jsonb NOT NULL,
  sensitivity text NOT NULL DEFAULT 'normal' CHECK (sensitivity IN ('normal','private','restricted')),
  source text NOT NULL DEFAULT 'user',
  confidence numeric(4,3) NOT NULL DEFAULT 1,
  last_confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, memory_key)
);

CREATE TABLE operator_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider text NOT NULL,
  status text NOT NULL DEFAULT 'disconnected' CHECK (status IN ('disconnected','connected','error','disabled')),
  capabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  public_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_verified_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, provider)
);

CREATE TABLE operator_events (
  id bigserial PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  task_id uuid REFERENCES operator_tasks(id) ON DELETE CASCADE,
  step_id uuid REFERENCES operator_steps(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  message text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX operator_events_org_created_idx ON operator_events(org_id, created_at DESC);

CREATE TABLE operator_subscriptions (
  org_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'stripe',
  customer_id text,
  subscription_id text,
  plan text NOT NULL DEFAULT 'trial' CHECK (plan IN ('trial','assistant','operator','concierge','private_office')),
  status text NOT NULL DEFAULT 'trialing',
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX operator_subscriptions_customer_idx ON operator_subscriptions(customer_id) WHERE customer_id IS NOT NULL;
CREATE UNIQUE INDEX operator_subscriptions_subscription_idx ON operator_subscriptions(subscription_id) WHERE subscription_id IS NOT NULL;

CREATE TABLE operator_billing_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);


CREATE TABLE operator_routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL,
  request text NOT NULL,
  cadence text NOT NULL CHECK (cadence IN ('daily','weekly')),
  next_run_at timestamptz NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  last_task_id uuid REFERENCES operator_tasks(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX operator_routines_due_idx
  ON operator_routines(enabled, next_run_at)
  WHERE enabled = true;


CREATE TABLE operator_callback_events (
  callback_id text PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES operator_tasks(id) ON DELETE CASCADE,
  step_id uuid NOT NULL REFERENCES operator_steps(id) ON DELETE CASCADE,
  state text NOT NULL CHECK (state IN ('completed','failed')),
  received_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX operator_callback_events_task_idx
  ON operator_callback_events(task_id, received_at DESC);
