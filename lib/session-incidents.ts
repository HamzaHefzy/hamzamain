import { db } from "@/lib/db";
import { getRecoverySettings } from "@/lib/recovery-service";
import { toJson } from "@/lib/json";

export async function detectSessionIncidents(orgId: string) {
  const sql = db();
  const settings = await getRecoverySettings(orgId);

  const rows = await sql<{
    session_id: string;
    campus_id: string | null;
    title: string;
    scheduled_count: string;
    missing_count: string;
  }[]>`
    select vs.id as session_id, vs.campus_id, vs.title,
           count(sp.id)::text as scheduled_count,
           count(sp.id) filter (where sp.status = 'scheduled')::text as missing_count
    from virtual_sessions vs
    join session_participation sp
      on sp.org_id = vs.org_id and sp.session_id = vs.id
    where vs.org_id = ${orgId}
      and vs.required = true
      and vs.starts_at <= now() - (${settings.liveRescueMinutes} * interval '1 minute')
      and vs.ends_at > now()
      and vs.starts_at >= now() - interval '3 hours'
    group by vs.id, vs.campus_id, vs.title
  `;

  const incidentSessionIds = new Set<string>();
  let opened = 0;
  let resolved = 0;

  for (const row of rows) {
    const scheduled = Number(row.scheduled_count);
    const missing = Number(row.missing_count);
    const missingRate = scheduled > 0 ? missing / scheduled : 0;
    const qualifies =
      missing >= settings.incidentMinMissing &&
      missingRate >= settings.incidentMissingRate;

    const [existing] = await sql<{
      id: string;
      status: string;
    }[]>`
      select id, status
      from session_incidents
      where org_id = ${orgId}
        and session_id = ${row.session_id}
      limit 1
    `;

    if (qualifies) {
      incidentSessionIds.add(row.session_id);
      const result = await sql<{ id: string }[]>`
        insert into session_incidents (
          org_id, session_id, campus_id, status, incident_type,
          missing_count, scheduled_count, missing_rate, metadata
        )
        values (
          ${orgId}, ${row.session_id}, ${row.campus_id}, 'open',
          'mass_nonparticipation', ${missing}, ${scheduled}, ${missingRate},
          ${sql.json(toJson({ sessionTitle: row.title, detector: "show_up" }))}
        )
        on conflict (org_id, session_id) do update
          set missing_count = excluded.missing_count,
              scheduled_count = excluded.scheduled_count,
              missing_rate = excluded.missing_rate,
              status = case
                when session_incidents.status in ('resolved','dismissed')
                  then session_incidents.status
                else session_incidents.status
              end,
              updated_at = now()
        returning id
      `;
      if (!existing && result.length) opened += 1;
    } else if (existing && ["open","investigating"].includes(existing.status)) {
      await sql`
        update session_incidents
        set status = 'resolved',
            resolved_at = now(),
            resolution_note = coalesce(
              resolution_note,
              'Participation normalized below the configured incident threshold.'
            ),
            missing_count = ${missing},
            scheduled_count = ${scheduled},
            missing_rate = ${missingRate},
            updated_at = now()
        where id = ${existing.id}
          and org_id = ${orgId}
      `;
      resolved += 1;
    }
  }

  return { incidentSessionIds, opened, resolved };
}

export async function getSessionIncidents(orgId: string, limit = 50) {
  const sql = db();
  const rows = await sql<{
    id: string;
    session_id: string;
    session_title: string;
    campus_name: string | null;
    status: string;
    incident_type: string;
    missing_count: number;
    scheduled_count: number;
    missing_rate: string;
    owner_user_id: string | null;
    owner_name: string | null;
    starts_at: Date;
    ends_at: Date;
    detected_at: Date;
    resolved_at: Date | null;
    resolution_note: string | null;
  }[]>`
    select si.id, si.session_id, vs.title as session_title,
           c.name as campus_name, si.status, si.incident_type,
           si.missing_count, si.scheduled_count, si.missing_rate::text,
           si.owner_user_id, u.name as owner_name,
           vs.starts_at, vs.ends_at, si.detected_at, si.resolved_at,
           si.resolution_note
    from session_incidents si
    join virtual_sessions vs
      on vs.org_id = si.org_id and vs.id = si.session_id
    left join campuses c
      on c.org_id = si.org_id and c.id = si.campus_id
    left join users u on u.id = si.owner_user_id
    where si.org_id = ${orgId}
    order by
      case si.status when 'open' then 1 when 'investigating' then 2 else 3 end,
      si.detected_at desc
    limit ${limit}
  `;

  return rows.map((row) => ({
    id: row.id,
    sessionId: row.session_id,
    sessionTitle: row.session_title,
    campusName: row.campus_name,
    status: row.status,
    incidentType: row.incident_type,
    missingCount: row.missing_count,
    scheduledCount: row.scheduled_count,
    missingRate: Number(row.missing_rate),
    ownerUserId: row.owner_user_id,
    ownerName: row.owner_name,
    startsAt: row.starts_at.toISOString(),
    endsAt: row.ends_at.toISOString(),
    detectedAt: row.detected_at.toISOString(),
    resolvedAt: row.resolved_at?.toISOString() ?? null,
    resolutionNote: row.resolution_note,
  }));
}

export async function updateSessionIncident(input: {
  orgId: string;
  incidentId: string;
  actorUserId: string;
  status?: "open" | "investigating" | "resolved" | "dismissed";
  incidentType?: "mass_nonparticipation" | "link_failure" | "platform_outage" | "teacher_issue" | "unknown";
  ownerUserId?: string | null;
  resolutionNote?: string | null;
}) {
  const sql = db();

  const [current] = await sql<{ id: string; status: string }[]>`
    select id, status
    from session_incidents
    where id = ${input.incidentId} and org_id = ${input.orgId}
  `;
  if (!current) throw new Error("Session incident not found.");

  const status = input.status ?? current.status;

  const [updated] = await sql<{ id: string }[]>`
    update session_incidents
    set status = ${status},
        incident_type = coalesce(${input.incidentType ?? null}, incident_type),
        owner_user_id = case
          when ${input.ownerUserId === undefined} then owner_user_id
          else ${input.ownerUserId ?? null}
        end,
        resolution_note = case
          when ${input.resolutionNote === undefined} then resolution_note
          else ${input.resolutionNote ?? null}
        end,
        resolved_at = case
          when ${status} in ('resolved','dismissed') then coalesce(resolved_at, now())
          else null
        end,
        updated_at = now()
    where id = ${input.incidentId} and org_id = ${input.orgId}
    returning id
  `;

  await sql`
    insert into audit_logs (
      org_id, actor_user_id, action, entity_type, entity_id, metadata
    )
    values (
      ${input.orgId}, ${input.actorUserId}, 'session_incident.updated',
      'session_incident', ${input.incidentId},
      ${sql.json(toJson({
        status,
        incidentType: input.incidentType,
        ownerUserId: input.ownerUserId,
        resolutionNote: input.resolutionNote,
      }))}
    )
  `;

  return updated;
}
