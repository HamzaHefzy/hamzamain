import { db } from "@/lib/db";
import { toJson } from "@/lib/json";

export type RecoveryTier = "automated" | "navigator" | "multidisciplinary";
export type EpisodeStatus = "open" | "stabilizing" | "recovered" | "closed";

export type RecoverySettings = {
  dailyLaunchTime: string;
  preclassReminderMinutes: number;
  liveRescueMinutes: number;
  humanEscalationMinutes: number;
  stabilizationEvents: number;
  stabilizationRequiredSuccesses: number;
  incidentMinMissing: number;
  incidentMissingRate: number;
  managedResolveEnabled: boolean;
};

const defaults: RecoverySettings = {
  dailyLaunchTime: "07:00",
  preclassReminderMinutes: 30,
  liveRescueMinutes: 5,
  humanEscalationMinutes: 10,
  stabilizationEvents: 5,
  stabilizationRequiredSuccesses: 4,
  incidentMinMissing: 5,
  incidentMissingRate: 0.5,
  managedResolveEnabled: false,
};

export async function getRecoverySettings(orgId: string): Promise<RecoverySettings> {
  const sql = db();
  const [row] = await sql<{
    daily_launch_time: string;
    preclass_reminder_minutes: number;
    live_rescue_minutes: number;
    human_escalation_minutes: number;
    stabilization_events: number;
    stabilization_required_successes: number;
    incident_min_missing: number;
    incident_missing_rate: string;
    managed_resolve_enabled: boolean;
  }[]>`
    select daily_launch_time::text,
           preclass_reminder_minutes,
           live_rescue_minutes,
           human_escalation_minutes,
           stabilization_events,
           stabilization_required_successes,
           incident_min_missing,
           incident_missing_rate::text,
           managed_resolve_enabled
    from attendance_recovery_settings
    where org_id = ${orgId}
  `;

  if (!row) return defaults;

  return {
    dailyLaunchTime: row.daily_launch_time.slice(0, 5),
    preclassReminderMinutes: row.preclass_reminder_minutes,
    liveRescueMinutes: row.live_rescue_minutes,
    humanEscalationMinutes: row.human_escalation_minutes,
    stabilizationEvents: row.stabilization_events,
    stabilizationRequiredSuccesses: row.stabilization_required_successes,
    incidentMinMissing: row.incident_min_missing,
    incidentMissingRate: Number(row.incident_missing_rate),
    managedResolveEnabled: row.managed_resolve_enabled,
  };
}

async function leastLoadedNavigator(tx: ReturnType<typeof db>, orgId: string) {
  const [row] = await tx<{ user_id: string; active_episodes: string }[]>`
    select m.user_id,
           count(re.id) filter (
             where re.status in ('open','stabilizing')
           )::text as active_episodes
    from memberships m
    join users u on u.id = m.user_id and u.active = true
    left join recovery_episodes re
      on re.org_id = m.org_id
      and re.owner_user_id = m.user_id
      and re.status in ('open','stabilizing')
    where m.org_id = ${orgId}
      and m.active = true
      and m.role in ('attendance','support','admin','owner')
    group by m.user_id, u.name
    order by count(re.id) filter (
               where re.status in ('open','stabilizing')
             ) asc,
             u.name asc
    limit 1
  `;

  return row?.user_id ?? null;
}

export async function suggestNavigator(orgId: string) {
  const sql = db();
  return leastLoadedNavigator(sql, orgId);
}

export async function appendEpisodeEvent(input: {
  orgId: string;
  episodeId: string;
  eventType: string;
  note?: string | null;
  actorUserId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const sql = db();
  await sql`
    insert into recovery_episode_events (
      org_id, episode_id, actor_user_id, event_type, note, metadata
    )
    values (
      ${input.orgId}, ${input.episodeId}, ${input.actorUserId ?? null},
      ${input.eventType}, ${input.note ?? null},
      ${sql.json(toJson(input.metadata ?? {}))}
    )
  `;
}

export async function ensureRecoveryEpisode(input: {
  orgId: string;
  studentId: string;
  campusId?: string | null;
  source: string;
  barrierCode?: string | null;
  barrierLabel?: string | null;
  tier?: RecoveryTier;
  requireHumanOwner?: boolean;
  metadata?: Record<string, unknown>;
}) {
  const sql = db();

  return sql.begin(async (tx) => {
    const [active] = await tx<{
      id: string;
      episode_number: string;
      status: EpisodeStatus;
      tier: RecoveryTier;
      owner_user_id: string | null;
    }[]>`
      select id, episode_number, status, tier, owner_user_id
      from recovery_episodes
      where org_id = ${input.orgId}
        and student_id = ${input.studentId}
        and status in ('open','stabilizing')
      order by opened_at desc
      limit 1
      for update
    `;

    if (active) {
      const relapse = active.status === "stabilizing";
      if (relapse) {
        await tx`
          update return_plans
          set status = 'failed',
              failed_at = now(),
              updated_at = now()
          where org_id = ${input.orgId}
            and episode_id = ${active.id}
            and status = 'active'
        `;
      }

      const owner = input.requireHumanOwner && !active.owner_user_id
        ? await leastLoadedNavigator(tx, input.orgId)
        : active.owner_user_id;
      const nextTier: RecoveryTier =
        input.requireHumanOwner && active.tier === "automated"
          ? "navigator"
          : active.tier;

      await tx`
        update recovery_episodes
        set last_signal_at = now(),
            barrier_code = coalesce(${input.barrierCode ?? null}, barrier_code),
            barrier_label = coalesce(${input.barrierLabel ?? null}, barrier_label),
            owner_user_id = ${owner},
            tier = ${nextTier},
            status = case when status = 'stabilizing' then 'open' else status end,
            relapse_count = relapse_count + ${relapse ? 1 : 0},
            metadata = metadata || ${tx.json(toJson(input.metadata ?? {}))},
            updated_at = now()
        where id = ${active.id} and org_id = ${input.orgId}
      `;

      await tx`
        insert into recovery_episode_events (
          org_id, episode_id, event_type, note, metadata
        )
        values (
          ${input.orgId}, ${active.id}, ${relapse ? "relapse" : "attendance_signal"},
          ${relapse ? "Attendance broke down during the active Return Plan." : input.barrierLabel ?? input.source},
          ${tx.json(toJson({ source: input.source, ...input.metadata }))}
        )
      `;

      return { ...active, owner_user_id: owner, tier: nextTier, reopened: false };
    }

    const [recent] = await tx<{
      id: string;
      episode_number: string;
      tier: RecoveryTier;
      owner_user_id: string | null;
      relapse_count: number;
    }[]>`
      select id, episode_number, tier, owner_user_id, relapse_count
      from recovery_episodes
      where org_id = ${input.orgId}
        and student_id = ${input.studentId}
        and status = 'recovered'
        and stabilized_at >= now() - interval '14 days'
      order by stabilized_at desc
      limit 1
      for update
    `;

    if (recent) {
      const owner = recent.owner_user_id ?? await leastLoadedNavigator(tx, input.orgId);
      const nextTier: RecoveryTier =
        recent.tier === "automated" ? "navigator" : recent.tier;

      await tx`
        update recovery_episodes
        set status = 'open',
            tier = ${nextTier},
            owner_user_id = ${owner},
            barrier_code = coalesce(${input.barrierCode ?? null}, barrier_code),
            barrier_label = coalesce(${input.barrierLabel ?? null}, barrier_label),
            relapse_count = relapse_count + 1,
            stabilized_at = null,
            closed_at = null,
            last_signal_at = now(),
            metadata = metadata || ${tx.json(toJson(input.metadata ?? {}))},
            updated_at = now()
        where id = ${recent.id} and org_id = ${input.orgId}
      `;

      await tx`
        insert into recovery_episode_events (
          org_id, episode_id, event_type, note, metadata
        )
        values (
          ${input.orgId}, ${recent.id}, 'relapse',
          'Attendance broke down again during the stabilization window.',
          ${tx.json(toJson({ source: input.source, ...input.metadata }))}
        )
      `;

      return {
        id: recent.id,
        episode_number: recent.episode_number,
        status: "open" as const,
        tier: nextTier,
        owner_user_id: owner,
        reopened: true,
      };
    }

    const requireOwner = Boolean(input.requireHumanOwner || input.tier === "navigator" || input.tier === "multidisciplinary");
    const owner = requireOwner ? await leastLoadedNavigator(tx, input.orgId) : null;
    const tier: RecoveryTier = input.tier ?? (requireOwner ? "navigator" : "automated");

    const [created] = await tx<{
      id: string;
      episode_number: string;
      status: EpisodeStatus;
      tier: RecoveryTier;
      owner_user_id: string | null;
    }[]>`
      insert into recovery_episodes (
        org_id, student_id, campus_id, episode_number,
        status, tier, barrier_code, barrier_label,
        owner_user_id, source, metadata
      )
      values (
        ${input.orgId}, ${input.studentId}, ${input.campusId ?? null},
        concat('REC-', upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
        'open', ${tier}, ${input.barrierCode ?? null}, ${input.barrierLabel ?? null},
        ${owner}, ${input.source}, ${tx.json(toJson(input.metadata ?? {}))}
      )
      returning id, episode_number, status, tier, owner_user_id
    `;

    await tx`
      insert into recovery_episode_events (
        org_id, episode_id, event_type, note, metadata
      )
      values (
        ${input.orgId}, ${created.id}, 'episode_opened',
        ${input.barrierLabel ?? 'Attendance recovery episode opened'},
        ${tx.json(toJson({ source: input.source, ...input.metadata }))}
      )
    `;

    return { ...created, reopened: false };
  });
}

export async function startReturnPlan(input: {
  orgId: string;
  episodeId: string;
  actorUserId?: string | null;
  plan?: Record<string, unknown>;
  targetEvents?: number;
  requiredSuccesses?: number;
}) {
  const sql = db();
  const settings = await getRecoverySettings(input.orgId);

  return sql.begin(async (tx) => {
    const [episode] = await tx<{ id: string; student_id: string }[]>`
      select id, student_id
      from recovery_episodes
      where id = ${input.episodeId}
        and org_id = ${input.orgId}
        and status in ('open','stabilizing')
      for update
    `;
    if (!episode) throw new Error("Recovery episode not found.");

    const target = input.targetEvents ?? settings.stabilizationEvents;
    const required = input.requiredSuccesses ?? settings.stabilizationRequiredSuccesses;
    if (required > target) throw new Error("Required successes cannot exceed target events.");

    const [existing] = await tx<{ id: string }[]>`
      select id
      from return_plans
      where org_id = ${input.orgId}
        and episode_id = ${input.episodeId}
        and status = 'active'
      limit 1
    `;
    if (existing) return existing;

    const [plan] = await tx<{ id: string }[]>`
      insert into return_plans (
        org_id, episode_id, student_id, target_events,
        required_successes, plan, next_check_at
      )
      values (
        ${input.orgId}, ${input.episodeId}, ${episode.student_id},
        ${target}, ${required},
        ${tx.json(toJson(input.plan ?? {}))},
        now()
      )
      returning id
    `;

    await tx`
      update recovery_episodes
      set status = 'stabilizing', updated_at = now()
      where id = ${input.episodeId} and org_id = ${input.orgId}
    `;

    await tx`
      insert into recovery_episode_events (
        org_id, episode_id, actor_user_id, event_type, note, metadata
      )
      values (
        ${input.orgId}, ${input.episodeId}, ${input.actorUserId ?? null},
        'return_plan_started',
        'Return plan started; recovery will be verified against subsequent attendance.',
        ${tx.json(toJson({ targetEvents: target, requiredSuccesses: required, plan: input.plan ?? {} }))}
      )
    `;

    return plan;
  });
}

function nextTier(current: RecoveryTier): RecoveryTier {
  if (current === "automated") return "navigator";
  return "multidisciplinary";
}

export async function evaluateReturnPlans(orgId: string) {
  const sql = db();
  const plans = await sql<{
    id: string;
    episode_id: string;
    student_id: string;
    target_events: number;
    required_successes: number;
    started_at: Date;
    tier: RecoveryTier;
    delivery_model: string | null;
  }[]>`
    select rp.id, rp.episode_id, rp.student_id, rp.target_events,
           rp.required_successes, rp.started_at, re.tier,
           c.delivery_model
    from return_plans rp
    join recovery_episodes re
      on re.org_id = rp.org_id and re.id = rp.episode_id
    left join campuses c
      on c.org_id = re.org_id and c.id = re.campus_id
    where rp.org_id = ${orgId}
      and rp.status = 'active'
    order by rp.started_at
  `;

  let completed = 0;
  let failed = 0;
  let observationsAdded = 0;

  for (const plan of plans) {
    const isVirtual = ["virtual_program","virtual_campus","hybrid"].includes(plan.delivery_model ?? "");

    if (isVirtual) {
      const rows = await sql<{
        session_id: string;
        ends_at: Date;
        status: string;
      }[]>`
        select vs.id as session_id, vs.ends_at, sp.status
        from virtual_sessions vs
        join session_participation sp
          on sp.org_id = vs.org_id
          and sp.session_id = vs.id
          and sp.student_id = ${plan.student_id}
        where vs.org_id = ${orgId}
          and vs.required = true
          and vs.ends_at >= ${plan.started_at}
          and vs.ends_at <= now()
        order by vs.ends_at
        limit ${plan.target_events}
      `;

      for (const row of rows) {
        const attended = row.status === "joined" || row.status === "recovered";
        const inserted = await sql<{ id: string }[]>`
          insert into return_plan_observations (
            org_id, return_plan_id, event_type, source_id,
            occurred_at, attended, attendance_status
          )
          values (
            ${orgId}, ${plan.id}, 'virtual_session', ${row.session_id},
            ${row.ends_at}, ${attended}, ${row.status}
          )
          on conflict (org_id, return_plan_id, event_type, source_id) do nothing
          returning id
        `;
        observationsAdded += inserted.length;
      }
    } else {
      const rows = await sql<{
        school_date: string;
        status: string;
      }[]>`
        select school_date::text, status
        from attendance_daily
        where org_id = ${orgId}
          and student_id = ${plan.student_id}
          and school_date >= (${plan.started_at} at time zone 'UTC')::date
          and school_date <= current_date
        order by school_date
        limit ${plan.target_events}
      `;

      for (const row of rows) {
        const attended = row.status === "present" || row.status === "partial";
        const occurredAt = new Date(row.school_date + "T12:00:00Z");
        const inserted = await sql<{ id: string }[]>`
          insert into return_plan_observations (
            org_id, return_plan_id, event_type, source_id,
            occurred_at, attended, attendance_status
          )
          values (
            ${orgId}, ${plan.id}, 'attendance_day', ${row.school_date},
            ${occurredAt}, ${attended}, ${row.status}
          )
          on conflict (org_id, return_plan_id, event_type, source_id) do nothing
          returning id
        `;
        observationsAdded += inserted.length;
      }
    }

    const observations = await sql<{ attended: boolean }[]>`
      select attended
      from return_plan_observations
      where org_id = ${orgId}
        and return_plan_id = ${plan.id}
      order by occurred_at, created_at
      limit ${plan.target_events}
    `;

    const observed = observations.length;
    const successful = observations.filter((row) => row.attended).length;
    let consecutive = 0;
    for (const row of observations) {
      consecutive = row.attended ? consecutive + 1 : 0;
    }

    await sql`
      update return_plans
      set observed_events = ${observed},
          successful_events = ${successful},
          consecutive_successes = ${consecutive},
          next_check_at = now() + interval '30 minutes',
          updated_at = now()
      where id = ${plan.id} and org_id = ${orgId}
    `;

    if (observed < plan.target_events) continue;

    if (successful >= plan.required_successes) {
      await sql.begin(async (tx) => {
        await tx`
          update return_plans
          set status = 'completed', completed_at = now(), updated_at = now()
          where id = ${plan.id} and org_id = ${orgId}
        `;
        await tx`
          update recovery_episodes
          set status = 'recovered', stabilized_at = now(), updated_at = now()
          where id = ${plan.episode_id} and org_id = ${orgId}
        `;
        await tx`
          insert into recovery_episode_events (
            org_id, episode_id, event_type, note, metadata
          )
          values (
            ${orgId}, ${plan.episode_id}, 'recovery_verified',
            'Return plan completed with sufficient subsequent attendance.',
            ${tx.json(toJson({ observed, successful, target: plan.target_events }))}
          )
        `;
      });
      completed += 1;
    } else {
      const escalatedTier = nextTier(plan.tier);
      await sql.begin(async (tx) => {
        const owner = await leastLoadedNavigator(tx, orgId);
        await tx`
          update return_plans
          set status = 'failed', failed_at = now(), updated_at = now()
          where id = ${plan.id} and org_id = ${orgId}
        `;
        await tx`
          update recovery_episodes
          set status = 'open',
              tier = ${escalatedTier},
              owner_user_id = coalesce(owner_user_id, ${owner}),
              relapse_count = relapse_count + 1,
              updated_at = now()
          where id = ${plan.episode_id} and org_id = ${orgId}
        `;
        await tx`
          insert into recovery_episode_events (
            org_id, episode_id, event_type, note, metadata
          )
          values (
            ${orgId}, ${plan.episode_id}, 'return_plan_failed',
            'Attendance did not stabilize; episode escalated.',
            ${tx.json(toJson({ observed, successful, target: plan.target_events, tier: escalatedTier }))}
          )
        `;
      });
      failed += 1;
    }
  }

  return { plansChecked: plans.length, observationsAdded, completed, failed };
}

export async function getRecoveryDesk(orgId: string) {
  const sql = db();

  const episodes = await sql<{
    id: string;
    episode_number: string;
    status: EpisodeStatus;
    tier: RecoveryTier;
    barrier_label: string | null;
    relapse_count: number;
    last_signal_at: Date;
    owner_user_id: string | null;
    owner_name: string | null;
    student_name: string;
    external_id: string;
    campus_name: string | null;
    plan_status: string | null;
    observed_events: number | null;
    successful_events: number | null;
    target_events: number | null;
    required_successes: number | null;
  }[]>`
    select re.id, re.episode_number, re.status, re.tier, re.barrier_label,
           re.relapse_count, re.last_signal_at, re.owner_user_id,
           u.name as owner_name,
           concat(s.first_name, ' ', s.last_name) as student_name,
           s.external_id,
           c.name as campus_name,
           rp.status as plan_status, rp.observed_events, rp.successful_events,
           rp.target_events, rp.required_successes
    from recovery_episodes re
    join students s on s.org_id = re.org_id and s.id = re.student_id
    left join campuses c on c.org_id = re.org_id and c.id = re.campus_id
    left join users u on u.id = re.owner_user_id
    left join lateral (
      select status, observed_events, successful_events,
             target_events, required_successes
      from return_plans
      where org_id = re.org_id and episode_id = re.id
      order by started_at desc
      limit 1
    ) rp on true
    where re.org_id = ${orgId}
      and re.status in ('open','stabilizing')
    order by
      case re.tier
        when 'multidisciplinary' then 1
        when 'navigator' then 2
        else 3
      end,
      re.last_signal_at desc
  `;

  const navigators = await sql<{
    user_id: string;
    name: string;
    role: string;
    active_episodes: string;
    urgent_cases: string;
  }[]>`
    select m.user_id, u.name, m.role,
           count(distinct re.id) filter (
             where re.status in ('open','stabilizing')
           )::text as active_episodes,
           count(distinct c.id) filter (
             where c.priority = 'urgent'
               and c.status not in ('resolved','closed')
           )::text as urgent_cases
    from memberships m
    join users u on u.id = m.user_id
    left join recovery_episodes re
      on re.org_id = m.org_id and re.owner_user_id = m.user_id
    left join cases c
      on c.org_id = m.org_id and c.owner_user_id = m.user_id
    where m.org_id = ${orgId}
      and m.active = true
      and u.active = true
      and m.role in ('attendance','support','admin','owner')
    group by m.user_id, u.name, m.role
    order by count(distinct re.id) filter (
               where re.status in ('open','stabilizing')
             ), u.name
  `;

  const [metrics] = await sql<{
    active: string;
    stabilizing: string;
    navigator_tier: string;
    multidisciplinary: string;
    unassigned: string;
    relapsed: string;
  }[]>`
    select
      count(*) filter (where status in ('open','stabilizing'))::text as active,
      count(*) filter (where status = 'stabilizing')::text as stabilizing,
      count(*) filter (where status in ('open','stabilizing') and tier = 'navigator')::text as navigator_tier,
      count(*) filter (where status in ('open','stabilizing') and tier = 'multidisciplinary')::text as multidisciplinary,
      count(*) filter (where status in ('open','stabilizing') and owner_user_id is null)::text as unassigned,
      count(*) filter (where status in ('open','stabilizing') and relapse_count > 0)::text as relapsed
    from recovery_episodes
    where org_id = ${orgId}
  `;

  return {
    metrics: {
      active: Number(metrics?.active ?? 0),
      stabilizing: Number(metrics?.stabilizing ?? 0),
      navigatorTier: Number(metrics?.navigator_tier ?? 0),
      multidisciplinary: Number(metrics?.multidisciplinary ?? 0),
      unassigned: Number(metrics?.unassigned ?? 0),
      relapsed: Number(metrics?.relapsed ?? 0),
    },
    episodes: episodes.map((row) => ({
      id: row.id,
      episodeNumber: row.episode_number,
      status: row.status,
      tier: row.tier,
      barrierLabel: row.barrier_label,
      relapseCount: row.relapse_count,
      lastSignalAt: row.last_signal_at.toISOString(),
      ownerUserId: row.owner_user_id,
      ownerName: row.owner_name,
      studentName: row.student_name,
      externalId: row.external_id,
      campusName: row.campus_name,
      returnPlan: row.plan_status ? {
        status: row.plan_status,
        observedEvents: row.observed_events ?? 0,
        successfulEvents: row.successful_events ?? 0,
        targetEvents: row.target_events ?? 0,
        requiredSuccesses: row.required_successes ?? 0,
      } : null,
    })),
    navigators: navigators.map((row) => ({
      userId: row.user_id,
      name: row.name,
      role: row.role,
      activeEpisodes: Number(row.active_episodes),
      urgentCases: Number(row.urgent_cases),
    })),
  };
}
