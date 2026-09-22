CREATE TABLE IF NOT EXISTS operator_subscriptions (
  org_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'stripe',
  customer_id text,
  subscription_id text,
  plan text NOT NULL DEFAULT 'trial'
    CHECK (plan IN ('trial','assistant','operator','concierge','private_office')),
  status text NOT NULL DEFAULT 'trialing',
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS operator_subscriptions_customer_idx
  ON operator_subscriptions(customer_id)
  WHERE customer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS operator_subscriptions_subscription_idx
  ON operator_subscriptions(subscription_id)
  WHERE subscription_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS operator_billing_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);
