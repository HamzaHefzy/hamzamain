CREATE TABLE IF NOT EXISTS attendance_recovery_settings (
  org_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  daily_launch_time time NOT NULL DEFAULT '07:00',
  preclass_reminder_minutes integer NOT NULL DEFAULT 30 CHECK (preclass_reminder_minutes BETWEEN 5 AND 180),
  live_rescue_minutes integer NOT NULL DEFAULT 5 CHECK (live_rescue_minutes BETWEEN 1 AND 60),
  human_escalation_minutes integer NOT NULL DEFAULT 10 CHECK (human_escalation_minutes BETWEEN 1 AND 120),
  stabilization_events integer NOT NULL DEFAULT 5 CHECK (stabilization_events BETWEEN 3 AND 20),
  stabilization_required_successes integer NOT NULL DEFAULT 4 CHECK (stabilization_required_successes BETWEEN 1 AND 20),
  incident_min_missing integer NOT NULL DEFAULT 5 CHECK (incident_min_missing BETWEEN 2 AND 1000),
  incident_missing_rate numeric(5,4) NOT NULL DEFAULT 0.5000 CHECK (incident_missing_rate BETWEEN 0 AND 1),
  managed_resolve_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recovery_episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  campus_id uuid,
  episode_number text NOT NULL,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','stabilizing','recovered','closed')),
  tier text NOT NULL DEFAULT 'automated'
    CHECK (tier IN ('automated','navigator','multidisciplinary')),
  barrier_code text,
  barrier_label text,
  owner_user_id uuid,
  opened_at timestamptz NOT NULL DEFAULT now(),
  last_signal_at timestamptz NOT NULL DEFAULT now(),
  stabilized_at timestamptz,
  closed_at timestamptz,
  relapse_count integer NOT NULL DEFAULT 0 CHECK (relapse_count >= 0),
  source text NOT NULL DEFAULT 'attendance_signal',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, id),
  UNIQUE(org_id, episode_number),
  FOREIGN KEY (org_id, student_id) REFERENCES students(org_id, id),
  FOREIGN KEY (org_id, campus_id) REFERENCES campuses(org_id, id),
  FOREIGN KEY (owner_user_id, org_id) REFERENCES memberships(user_id, org_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS recovery_episodes_one_active_student_idx
  ON recovery_episodes(org_id, student_id)
  WHERE status IN ('open','stabilizing');
CREATE INDEX IF NOT EXISTS recovery_episodes_org_status_idx
  ON recovery_episodes(org_id, status, tier, last_signal_at DESC);

CREATE TABLE IF NOT EXISTS recovery_episode_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  episode_id uuid NOT NULL,
  actor_user_id uuid,
  event_type text NOT NULL,
  note text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (org_id, episode_id) REFERENCES recovery_episodes(org_id, id) ON DELETE CASCADE,
  FOREIGN KEY (actor_user_id, org_id) REFERENCES memberships(user_id, org_id)
);
CREATE INDEX IF NOT EXISTS recovery_episode_events_episode_idx
  ON recovery_episode_events(episode_id, created_at);

ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS recovery_episode_id uuid;

ALTER TABLE cases
  DROP CONSTRAINT IF EXISTS cases_recovery_episode_same_org_fk;
ALTER TABLE cases
  ADD CONSTRAINT cases_recovery_episode_same_org_fk
  FOREIGN KEY (org_id, recovery_episode_id)
  REFERENCES recovery_episodes(org_id, id);

CREATE TABLE IF NOT EXISTS return_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  episode_id uuid NOT NULL,
  student_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','completed','failed','paused','cancelled')),
  target_events integer NOT NULL DEFAULT 5 CHECK (target_events BETWEEN 3 AND 20),
  required_successes integer NOT NULL DEFAULT 4 CHECK (required_successes BETWEEN 1 AND 20),
  observed_events integer NOT NULL DEFAULT 0 CHECK (observed_events >= 0),
  successful_events integer NOT NULL DEFAULT 0 CHECK (successful_events >= 0),
  consecutive_successes integer NOT NULL DEFAULT 0 CHECK (consecutive_successes >= 0),
  plan jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  next_check_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, id),
  FOREIGN KEY (org_id, episode_id) REFERENCES recovery_episodes(org_id, id) ON DELETE CASCADE,
  FOREIGN KEY (org_id, student_id) REFERENCES students(org_id, id)
);
CREATE UNIQUE INDEX IF NOT EXISTS return_plans_one_active_episode_idx
  ON return_plans(org_id, episode_id)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS return_plans_org_status_idx
  ON return_plans(org_id, status, next_check_at);

CREATE TABLE IF NOT EXISTS return_plan_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  return_plan_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('virtual_session','attendance_day')),
  source_id text NOT NULL,
  occurred_at timestamptz NOT NULL,
  attended boolean NOT NULL,
  attendance_status text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (org_id, return_plan_id) REFERENCES return_plans(org_id, id) ON DELETE CASCADE,
  UNIQUE(org_id, return_plan_id, event_type, source_id)
);

CREATE TABLE IF NOT EXISTS session_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  campus_id uuid,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','investigating','resolved','dismissed')),
  incident_type text NOT NULL DEFAULT 'mass_nonparticipation'
    CHECK (incident_type IN ('mass_nonparticipation','link_failure','platform_outage','teacher_issue','unknown')),
  missing_count integer NOT NULL CHECK (missing_count >= 0),
  scheduled_count integer NOT NULL CHECK (scheduled_count >= 0),
  missing_rate numeric(6,5) NOT NULL CHECK (missing_rate BETWEEN 0 AND 1),
  owner_user_id uuid,
  detected_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolution_note text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, id),
  UNIQUE(org_id, session_id),
  FOREIGN KEY (org_id, session_id) REFERENCES virtual_sessions(org_id, id) ON DELETE CASCADE,
  FOREIGN KEY (org_id, campus_id) REFERENCES campuses(org_id, id),
  FOREIGN KEY (owner_user_id, org_id) REFERENCES memberships(user_id, org_id)
);
CREATE INDEX IF NOT EXISTS session_incidents_org_status_idx
  ON session_incidents(org_id, status, detected_at DESC);

CREATE TABLE IF NOT EXISTS daily_launches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  school_date date NOT NULL,
  token_hash text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','ready','help_requested','expired')),
  barrier_code text,
  note text,
  schedule_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  sent_at timestamptz,
  responded_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, student_id, school_date),
  FOREIGN KEY (org_id, student_id) REFERENCES students(org_id, id)
);
CREATE INDEX IF NOT EXISTS daily_launches_org_date_idx
  ON daily_launches(org_id, school_date, status);
