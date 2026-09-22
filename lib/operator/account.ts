import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { fetchWithTimeout } from "@/lib/http";

async function cancelStripeSubscription(subscriptionId: string) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "This workspace has an active Stripe subscription but STRIPE_SECRET_KEY is not configured. Cancel billing before deleting the workspace.",
    );
  }

  const response = await fetchWithTimeout(
    "https://api.stripe.com/v1/subscriptions/" + encodeURIComponent(subscriptionId),
    {
      method: "DELETE",
      headers: { Authorization: "Bearer " + key },
    },
  );
  const payload = await response.json().catch(() => ({})) as {
    status?: string;
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(
      payload.error?.message ?? "Stripe subscription cancellation failed. Workspace deletion was stopped.",
    );
  }
  return payload.status ?? "canceled";
}

export async function exportOperatorWorkspace(orgId: string) {
  const sql = db();

  const [organization] = await sql`
    select id, name, slug, timezone, status, settings, created_at, updated_at
    from organizations
    where id = ${orgId}
    limit 1
  `;
  if (!organization) throw new Error("Workspace not found.");

  const [
    profile,
    members,
    tasks,
    steps,
    approvals,
    authorityRules,
    memories,
    contacts,
    connections,
    routines,
    events,
    subscription,
    notifications,
    auditLogs,
  ] = await Promise.all([
    sql`
      select assistant_name, timezone, assistant_phone, owner_phone,
             assistant_email, home_base, preferences, created_at, updated_at
      from operator_profiles where org_id = ${orgId}
    `,
    sql`
      select u.name, u.email, u.email_verified_at, m.role, m.active, m.created_at
      from memberships m
      join users u on u.id = m.user_id
      where m.org_id = ${orgId}
      order by m.created_at
    `,
    sql`
      select id, created_by, title, request, category, status, priority, source,
             budget_limit, actual_spend, currency, plan, result, error,
             due_at, started_at, completed_at, created_at, updated_at
      from operator_tasks where org_id = ${orgId}
      order by created_at
    `,
    sql`
      select id, task_id, sequence, kind, status, summary, provider,
             requires_approval, request, response, error,
             started_at, completed_at, created_at
      from operator_steps where org_id = ${orgId}
      order by task_id, sequence
    `,
    sql`
      select id, task_id, step_id, approval_type, summary, amount, currency,
             status, requested_at, resolved_at, resolved_by
      from operator_approvals where org_id = ${orgId}
      order by requested_at
    `,
    sql`
      select id, domain, action, enabled, policy, created_at, updated_at
      from operator_authority_rules where org_id = ${orgId}
      order by domain, action
    `,
    sql`
      select id, memory_key, value, sensitivity, source, confidence,
             last_confirmed_at, created_at, updated_at
      from operator_memories where org_id = ${orgId}
      order by memory_key
    `,
    sql`
      select id, display_name, organization, phone, email, aliases, notes,
             created_at, updated_at
      from operator_contacts where org_id = ${orgId}
      order by lower(display_name)
    `,
    sql`
      select id, provider, status, capabilities, public_config,
             last_verified_at, last_error, created_at, updated_at
      from operator_connections where org_id = ${orgId}
      order by provider
    `,
    sql`
      select id, created_by, title, request, cadence, next_run_at, enabled,
             last_run_at, last_task_id, created_at, updated_at
      from operator_routines where org_id = ${orgId}
      order by created_at
    `,
    sql`
      select id, task_id, step_id, event_type, message, metadata, created_at
      from operator_events where org_id = ${orgId}
      order by created_at
    `,
    sql`
      select provider, customer_id, subscription_id, plan, status,
             current_period_end, created_at, updated_at
      from operator_subscriptions where org_id = ${orgId}
    `,
    sql`
      select task_id, event_key, channel, status, provider_id, error,
             created_at, sent_at
      from operator_notification_events where org_id = ${orgId}
      order by created_at
    `,
    sql`
      select actor_user_id, action, entity_type, entity_id, ip_hash,
             metadata, created_at
      from audit_logs where org_id = ${orgId}
      order by created_at
    `,
  ]);

  return {
    format: "operator-workspace-export",
    version: 1,
    exportedAt: new Date().toISOString(),
    organization,
    profile,
    members,
    tasks,
    steps,
    approvals,
    authorityRules,
    memories,
    contacts,
    connections,
    routines,
    events,
    subscription,
    notifications,
    auditLogs,
  };
}

export async function deleteOperatorWorkspace(input: {
  orgId: string;
  userId: string;
  password: string;
}) {
  const sql = db();

  const [account] = await sql<{
    password_hash: string;
    subscription_id: string | null;
    subscription_status: string | null;
  }[]>`
    select u.password_hash,
           s.subscription_id,
           s.status as subscription_status
    from users u
    join memberships m on m.user_id = u.id
    left join operator_subscriptions s on s.org_id = m.org_id
    where u.id = ${input.userId}
      and m.org_id = ${input.orgId}
      and m.role = 'owner'
      and m.active = true
    limit 1
  `;
  if (!account) throw new Error("Only the workspace owner can delete this workspace.");
  if (!(await bcrypt.compare(input.password, account.password_hash))) {
    throw new Error("Current password is incorrect.");
  }

  const terminalBillingStatuses = new Set([
    "canceled",
    "cancelled",
    "incomplete_expired",
  ]);
  if (
    account.subscription_id &&
    !terminalBillingStatuses.has(account.subscription_status ?? "")
  ) {
    await cancelStripeSubscription(account.subscription_id);
  }

  await sql.begin(async (tx) => {
    await tx`delete from organizations where id = ${input.orgId}`;
    const [remaining] = await tx<{ count: number }[]>`
      select count(*)::int as count
      from memberships
      where user_id = ${input.userId}
    `;
    if ((remaining?.count ?? 0) === 0) {
      await tx`delete from users where id = ${input.userId}`;
    }
  });

  return { ok: true };
}
