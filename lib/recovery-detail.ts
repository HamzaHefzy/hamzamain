import { db } from "@/lib/db";
import { toJson } from "@/lib/json";
import type { EpisodeStatus, RecoveryTier } from "@/lib/recovery-service";

export async function getRecoveryEpisode(orgId: string, episodeId: string) {
  const sql = db();

  const [episode] = await sql<{
    id: string;
    episode_number: string;
    status: EpisodeStatus;
    tier: RecoveryTier;
    barrier_code: string | null;
    barrier_label: string | null;
    relapse_count: number;
    opened_at: Date;
    last_signal_at: Date;
    stabilized_at: Date | null;
    closed_at: Date | null;
    owner_user_id: string | null;
    owner_name: string | null;
    student_name: string;
    external_id: string;
    grade: string | null;
    campus_name: string | null;
    source: string;
  }[]>`
    select re.id, re.episode_number, re.status, re.tier,
           re.barrier_code, re.barrier_label, re.relapse_count,
           re.opened_at, re.last_signal_at, re.stabilized_at, re.closed_at,
           re.owner_user_id, u.name as owner_name,
           concat(s.first_name, ' ', s.last_name) as student_name,
           s.external_id, s.grade, c.name as campus_name, re.source
    from recovery_episodes re
    join students s on s.org_id = re.org_id and s.id = re.student_id
    left join campuses c on c.org_id = re.org_id and c.id = re.campus_id
    left join users u on u.id = re.owner_user_id
    where re.org_id = ${orgId} and re.id = ${episodeId}
    limit 1
  `;

  if (!episode) return null;

  const [cases, plans, events] = await Promise.all([
    sql<{
      id: string;
      case_number: string;
      barrier_label: string;
      priority: string;
      status: string;
      queue: string;
      next_action: string | null;
      due_at: Date | null;
      owner_name: string | null;
      opened_at: Date;
      resolved_at: Date | null;
    }[]>`
      select c.id, c.case_number, c.barrier_label, c.priority, c.status,
             c.queue, c.next_action, c.due_at, u.name as owner_name,
             c.opened_at, c.resolved_at
      from cases c
      left join users u on u.id = c.owner_user_id
      where c.org_id = ${orgId}
        and c.recovery_episode_id = ${episodeId}
      order by c.opened_at desc
    `,
    sql<{
      id: string;
      status: string;
      target_events: number;
      required_successes: number;
      observed_events: number;
      successful_events: number;
      consecutive_successes: number;
      started_at: Date;
      completed_at: Date | null;
      failed_at: Date | null;
      plan: Record<string, unknown>;
    }[]>`
      select id, status, target_events, required_successes,
             observed_events, successful_events, consecutive_successes,
             started_at, completed_at, failed_at, plan
      from return_plans
      where org_id = ${orgId}
        and episode_id = ${episodeId}
      order by started_at desc
    `,
    sql<{
      id: string;
      event_type: string;
      note: string | null;
      metadata: Record<string, unknown>;
      created_at: Date;
      actor_name: string | null;
    }[]>`
      select ree.id, ree.event_type, ree.note, ree.metadata,
             ree.created_at, u.name as actor_name
      from recovery_episode_events ree
      left join users u on u.id = ree.actor_user_id
      where ree.org_id = ${orgId}
        and ree.episode_id = ${episodeId}
      order by ree.created_at desc
      limit 200
    `,
  ]);

  const planIds = plans.map((plan) => plan.id);
  const observations = planIds.length
    ? await sql<{
        return_plan_id: string;
        event_type: string;
        source_id: string;
        occurred_at: Date;
        attended: boolean;
        attendance_status: string;
      }[]>`
        select return_plan_id, event_type, source_id, occurred_at,
               attended, attendance_status
        from return_plan_observations
        where org_id = ${orgId}
          and return_plan_id = any(${planIds}::uuid[])
        order by occurred_at
      `
    : [];

  return {
    id: episode.id,
    episodeNumber: episode.episode_number,
    status: episode.status,
    tier: episode.tier,
    barrierCode: episode.barrier_code,
    barrierLabel: episode.barrier_label,
    relapseCount: episode.relapse_count,
    openedAt: episode.opened_at.toISOString(),
    lastSignalAt: episode.last_signal_at.toISOString(),
    stabilizedAt: episode.stabilized_at?.toISOString() ?? null,
    closedAt: episode.closed_at?.toISOString() ?? null,
    ownerUserId: episode.owner_user_id,
    ownerName: episode.owner_name,
    studentName: episode.student_name,
    externalId: episode.external_id,
    grade: episode.grade,
    campusName: episode.campus_name,
    source: episode.source,
    cases: cases.map((item) => ({
      id: item.id,
      caseNumber: item.case_number,
      barrierLabel: item.barrier_label,
      priority: item.priority,
      status: item.status,
      queue: item.queue,
      nextAction: item.next_action,
      dueAt: item.due_at?.toISOString() ?? null,
      ownerName: item.owner_name,
      openedAt: item.opened_at.toISOString(),
      resolvedAt: item.resolved_at?.toISOString() ?? null,
    })),
    returnPlans: plans.map((plan) => ({
      id: plan.id,
      status: plan.status,
      targetEvents: plan.target_events,
      requiredSuccesses: plan.required_successes,
      observedEvents: plan.observed_events,
      successfulEvents: plan.successful_events,
      consecutiveSuccesses: plan.consecutive_successes,
      startedAt: plan.started_at.toISOString(),
      completedAt: plan.completed_at?.toISOString() ?? null,
      failedAt: plan.failed_at?.toISOString() ?? null,
      plan: plan.plan,
      observations: observations
        .filter((observation) => observation.return_plan_id === plan.id)
        .map((observation) => ({
          eventType: observation.event_type,
          sourceId: observation.source_id,
          occurredAt: observation.occurred_at.toISOString(),
          attended: observation.attended,
          attendanceStatus: observation.attendance_status,
        })),
    })),
    events: events.map((event) => ({
      id: event.id,
      eventType: event.event_type,
      note: event.note,
      metadata: event.metadata,
      createdAt: event.created_at.toISOString(),
      actorName: event.actor_name,
    })),
  };
}

export async function updateRecoveryEpisode(input: {
  orgId: string;
  episodeId: string;
  actorUserId: string;
  ownerUserId?: string | null;
  tier?: RecoveryTier;
  status?: "open" | "stabilizing" | "closed";
  note?: string | null;
}) {
  const sql = db();

  return sql.begin(async (tx) => {
    const [current] = await tx<{
      id: string;
      owner_user_id: string | null;
      tier: RecoveryTier;
      status: EpisodeStatus;
    }[]>`
      select id, owner_user_id, tier, status
      from recovery_episodes
      where org_id = ${input.orgId} and id = ${input.episodeId}
      for update
    `;

    if (!current) throw new Error("Recovery episode not found.");

    const owner = input.ownerUserId === undefined
      ? current.owner_user_id
      : input.ownerUserId;
    const tier = input.tier ?? current.tier;
    const status = input.status ?? current.status;

    await tx`
      update recovery_episodes
      set owner_user_id = ${owner},
          tier = ${tier},
          status = ${status},
          closed_at = case
            when ${status} = 'closed' then coalesce(closed_at, now())
            else null
          end,
          updated_at = now()
      where org_id = ${input.orgId} and id = ${input.episodeId}
    `;

    await tx`
      insert into recovery_episode_events (
        org_id, episode_id, actor_user_id, event_type, note, metadata
      )
      values (
        ${input.orgId}, ${input.episodeId}, ${input.actorUserId},
        'episode_updated', ${input.note ?? null},
        ${tx.json(toJson({
          from: {
            ownerUserId: current.owner_user_id,
            tier: current.tier,
            status: current.status,
          },
          to: { ownerUserId: owner, tier, status },
        }))}
      )
    `;

    return { id: input.episodeId, ownerUserId: owner, tier, status };
  });
}
