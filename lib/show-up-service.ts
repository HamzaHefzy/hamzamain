import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { createCase } from "@/lib/case-service";
import { localDateString } from "@/lib/time";
import { sendNotification } from "@/lib/notifications";
import { ensureRecoveryEpisode, evaluateReturnPlans, getRecoverySettings } from "@/lib/recovery-service";
import { detectSessionIncidents, getSessionIncidents } from "@/lib/session-incidents";

const barriers = {
  technology: {
    label: "Technology / access",
    nextAction: "Restore device or connectivity access and provide an approved same-day fallback.",
    priority: "high" as const,
  },
  forgot: {
    label: "Routine / forgot",
    nextAction: "Confirm the next session, provide one-click access, and add a calendar/reminder plan.",
    priority: "medium" as const,
  },
  behind: {
    label: "Academic overwhelm",
    nextAction: "Create a minimum viable catch-up plan and a teacher check-in before the next session.",
    priority: "high" as const,
  },
  caregiving: {
    label: "Work / caregiving",
    nextAction: "Review the participation schedule and route an approved asynchronous or schedule-adjustment option.",
    priority: "high" as const,
  },
  motivation: {
    label: "Disengagement / belonging",
    nextAction: "Assign a named success contact for a short re-engagement conversation and next-step commitment.",
    priority: "high" as const,
  },
  health: {
    label: "Health / wellness",
    nextAction: "Route to the school’s approved attendance and support process without requesting sensitive details in Anchor.",
    priority: "high" as const,
  },
  other: {
    label: "Other participation barrier",
    nextAction: "Human follow-up is required to identify and resolve the barrier.",
    priority: "medium" as const,
  },
};

export type CheckinBarrier = keyof typeof barriers;

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createCheckinToken(input: {
  orgId: string;
  studentId: string;
  sessionId: string;
  caseId: string;
}) {
  const sql = db();
  const token = randomBytes(32).toString("base64url");
  await sql`
    insert into checkin_tokens (
      org_id, student_id, session_id, case_id, token_hash, expires_at
    )
    values (
      ${input.orgId}, ${input.studentId}, ${input.sessionId},
      ${input.caseId}, ${tokenHash(token)}, now() + interval '24 hours'
    )
  `;
  return token;
}

export async function getCheckinContext(token: string) {
  const sql = db();
  const [row] = await sql<{
    token_id: string;
    first_name: string;
    session_title: string | null;
    starts_at: Date | null;
    used_at: Date | null;
    expires_at: Date;
  }[]>`
    select ct.id as token_id, s.first_name,
           vs.title as session_title, vs.starts_at,
           ct.used_at, ct.expires_at
    from checkin_tokens ct
    join students s on s.id = ct.student_id
    left join virtual_sessions vs on vs.id = ct.session_id
    where ct.token_hash = ${tokenHash(token)}
    limit 1
  `;
  if (!row || row.expires_at < new Date()) return null;
  return {
    firstName: row.first_name,
    sessionTitle: row.session_title,
    startsAt: row.starts_at?.toISOString() ?? null,
    used: Boolean(row.used_at),
  };
}

export async function submitCheckin(input: {
  token: string;
  barrier: CheckinBarrier;
  note?: string | null;
}) {
  const sql = db();
  const config = barriers[input.barrier];

  return sql.begin(async (tx) => {
    const [tokenRow] = await tx<{
      id: string;
      org_id: string;
      student_id: string;
      session_id: string | null;
      case_id: string | null;
      used_at: Date | null;
      expires_at: Date;
    }[]>`
      select id, org_id, student_id, session_id, case_id, used_at, expires_at
      from checkin_tokens
      where token_hash = ${tokenHash(input.token)}
      for update
    `;

    if (!tokenRow || tokenRow.expires_at < new Date()) {
      throw new Error("This check-in link is invalid or expired.");
    }
    if (tokenRow.used_at) {
      throw new Error("This check-in has already been submitted.");
    }

    await tx`
      insert into checkin_responses (
        org_id, student_id, session_id, case_id,
        barrier_code, barrier_label, note
      )
      values (
        ${tokenRow.org_id}, ${tokenRow.student_id}, ${tokenRow.session_id},
        ${tokenRow.case_id}, ${input.barrier}, ${config.label}, ${input.note ?? null}
      )
    `;

    await tx`
      update checkin_tokens set used_at = now() where id = ${tokenRow.id}
    `;

    if (tokenRow.case_id) {
      await tx`
        update cases
        set barrier_code = ${input.barrier},
            barrier_label = ${config.label},
            priority = ${config.priority},
            status = 'in_progress',
            queue = 'do_now',
            next_action = ${config.nextAction},
            due_at = least(coalesce(due_at, now() + interval '2 hours'), now() + interval '2 hours'),
            updated_at = now()
        where id = ${tokenRow.case_id}
          and org_id = ${tokenRow.org_id}
      `;

      await tx`
        insert into case_events (
          org_id, case_id, event_type, note, to_status, metadata
        )
        values (
          ${tokenRow.org_id}, ${tokenRow.case_id}, 'student_checkin',
          ${input.note ?? null}, 'in_progress',
          ${tx.json({ barrier: input.barrier, barrierLabel: config.label })}
        )
      `;
    }

    return config;
  });
}

async function hasNotification(orgId: string, studentId: string, templateKey: string) {
  const sql = db();
  const [row] = await sql<{ id: string }[]>`
    select id from notifications
    where org_id = ${orgId}
      and student_id = ${studentId}
      and template_key = ${templateKey}
      and status in ('queued','sent','delivered')
    limit 1
  `;
  return Boolean(row);
}

async function tryNotify(input: {
  orgId: string;
  studentId: string;
  caseId?: string | null;
  templateKey: string;
  phone?: string | null;
  email?: string | null;
  subject?: string;
  body: string;
}) {
  try {
    if (input.phone && process.env.TWILIO_ACCOUNT_SID) {
      await sendNotification({
        orgId: input.orgId,
        studentId: input.studentId,
        caseId: input.caseId,
        channel: "sms",
        recipient: input.phone,
        templateKey: input.templateKey,
        body: input.body,
      });
      return true;
    }
    if (input.email && process.env.RESEND_API_KEY) {
      await sendNotification({
        orgId: input.orgId,
        studentId: input.studentId,
        caseId: input.caseId,
        channel: "email",
        recipient: input.email,
        templateKey: input.templateKey,
        subject: input.subject,
        body: input.body,
      });
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export async function runShowUpAutomation(orgId: string) {
  const sql = db();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const settings = await getRecoverySettings(orgId);
  const incidentDetection = await detectSessionIncidents(orgId);

  let reminders = 0;
  let liveRescues = 0;
  let liveCasesCreated = 0;
  let misses = 0;
  let casesCreated = 0;
  let checkinsSent = 0;

  const upcoming = await sql<{
    session_id: string;
    session_title: string;
    starts_at: Date;
    live_url: string | null;
    student_id: string;
    first_name: string;
    email: string | null;
    phone: string | null;
    guardian_email: string | null;
    guardian_phone: string | null;
  }[]>`
    select vs.id as session_id, vs.title as session_title,
           vs.starts_at, vs.live_url,
           s.id as student_id, s.first_name, s.email, s.phone,
           s.guardian_email, s.guardian_phone
    from session_participation sp
    join virtual_sessions vs
      on vs.org_id = sp.org_id and vs.id = sp.session_id
    join students s
      on s.org_id = sp.org_id and s.id = sp.student_id
    where sp.org_id = ${orgId}
      and sp.status = 'scheduled'
      and vs.required = true
      and vs.starts_at > now()
      and vs.starts_at <= now() + (${settings.preclassReminderMinutes} * interval '1 minute')
  `;

  for (const item of upcoming) {
    const key = "virtual_pre_session:" + item.session_id;
    if (await hasNotification(orgId, item.student_id, key)) continue;

    const body =
      item.first_name + ", " + item.session_title + " starts soon." +
      (item.live_url ? " Join: " + item.live_url : "") +
      " If something may stop you, use your Anchor check-in or contact your school support team.";

    const sent = await tryNotify({
      orgId,
      studentId: item.student_id,
      templateKey: key,
      phone: item.phone ?? item.guardian_phone,
      email: item.email ?? item.guardian_email,
      subject: "Upcoming class: " + item.session_title,
      body,
    });
    if (sent) reminders += 1;
  }

  const liveMissing = await sql<{
    session_id: string;
    session_title: string;
    starts_at: Date;
    ends_at: Date;
    live_url: string | null;
    student_id: string;
    campus_id: string | null;
    first_name: string;
    email: string | null;
    phone: string | null;
    guardian_email: string | null;
    guardian_phone: string | null;
  }[]>`
    select vs.id as session_id, vs.title as session_title,
           vs.starts_at, vs.ends_at, vs.live_url,
           s.id as student_id, s.campus_id, s.first_name, s.email, s.phone,
           s.guardian_email, s.guardian_phone
    from session_participation sp
    join virtual_sessions vs
      on vs.org_id = sp.org_id and vs.id = sp.session_id
    join students s
      on s.org_id = sp.org_id and s.id = sp.student_id
    where sp.org_id = ${orgId}
      and sp.status = 'scheduled'
      and vs.required = true
      and vs.starts_at <= now() - (${settings.liveRescueMinutes} * interval '1 minute')
      and vs.ends_at > now()
      and vs.starts_at >= now() - interval '3 hours'
  `;

  for (const item of liveMissing) {
    if (incidentDetection.incidentSessionIds.has(item.session_id)) continue;

    const elapsedMinutes = Math.max(
      0,
      Math.floor((Date.now() - item.starts_at.getTime()) / 60000),
    );

    const [existing] = await sql<{ id: string }[]>`
      select id
      from cases
      where org_id = ${orgId}
        and student_id = ${item.student_id}
        and status not in ('resolved','closed')
        and metadata ->> 'sessionId' = ${item.session_id}
      limit 1
    `;

    let caseId = existing?.id ?? null;

    if (!caseId && elapsedMinutes >= settings.humanEscalationMinutes) {
      const episode = await ensureRecoveryEpisode({
        orgId,
        studentId: item.student_id,
        campusId: item.campus_id,
        source: "show_up_live_rescue",
        barrierCode: "virtual_live_rescue",
        barrierLabel: "Student has not joined live class",
        tier: "navigator",
        requireHumanOwner: true,
        metadata: {
          sessionId: item.session_id,
          sessionEndsAt: item.ends_at.toISOString(),
          elapsedMinutes,
        },
      });

      const created = await createCase({
        orgId,
        studentId: item.student_id,
        campusId: item.campus_id,
        recoveryEpisodeId: episode.id,
        ownerUserId: episode.owner_user_id,
        barrierCode: "virtual_live_rescue",
        barrierLabel: "Student has not joined live class",
        priority: "urgent",
        nextAction:
          "Attempt live contact now. Help the student enter the current class or identify the barrier before the instructional window closes.",
        dueAt: new Date(Date.now() + 15 * 60 * 1000),
        metadata: {
          sessionId: item.session_id,
          source: "show_up_live_rescue",
          sessionEndsAt: item.ends_at.toISOString(),
          episodeNumber: episode.episode_number,
        },
      });
      caseId = created.id;
      liveCasesCreated += 1;
    }

    const key = "virtual_live_rescue:" + item.session_id;
    if (!(await hasNotification(orgId, item.student_id, key))) {
      const token = await createCheckinToken({
        orgId,
        studentId: item.student_id,
        sessionId: item.session_id,
        caseId,
      });
      const helpLink = siteUrl.replace(/\/$/, "") + "/check-in/" + token;
      const body =
        item.first_name + ", " + item.session_title + " is happening now." +
        (item.live_url ? " Join now: " + item.live_url : "") +
        " If something is stopping you, tell us here: " + helpLink;

      const sent = await tryNotify({
        orgId,
        studentId: item.student_id,
        caseId,
        templateKey: key,
        phone: item.phone ?? item.guardian_phone,
        email: item.email ?? item.guardian_email,
        subject: "Join " + item.session_title + " now",
        body,
      });
      if (sent) liveRescues += 1;
    }
  }

  const missed = await sql<{
    participation_id: string;
    session_id: string;
    session_title: string;
    student_id: string;
    campus_id: string | null;
    first_name: string;
    email: string | null;
    phone: string | null;
    guardian_email: string | null;
    guardian_phone: string | null;
  }[]>`
    select sp.id as participation_id, vs.id as session_id,
           vs.title as session_title, s.id as student_id,
           s.campus_id, s.first_name, s.email, s.phone,
           s.guardian_email, s.guardian_phone
    from session_participation sp
    join virtual_sessions vs
      on vs.org_id = sp.org_id and vs.id = sp.session_id
    join students s
      on s.org_id = sp.org_id and s.id = sp.student_id
    where sp.org_id = ${orgId}
      and sp.status = 'scheduled'
      and vs.required = true
      and vs.ends_at <= now() - interval '10 minutes'
      and vs.ends_at >= now() - interval '8 hours'
  `;

  for (const item of missed) {
    await sql`
      update session_participation
      set status = 'missed', updated_at = now()
      where id = ${item.participation_id} and status = 'scheduled'
    `;
    misses += 1;

    if (incidentDetection.incidentSessionIds.has(item.session_id)) continue;

    const episode = await ensureRecoveryEpisode({
      orgId,
      studentId: item.student_id,
      campusId: item.campus_id,
      source: "show_up_missed_session",
      barrierCode: "virtual_missed_session",
      barrierLabel: "Missed required virtual session",
      tier: "navigator",
      requireHumanOwner: true,
      metadata: { sessionId: item.session_id },
    });

    const [existing] = await sql<{ id: string }[]>`
      select id
      from cases
      where org_id = ${orgId}
        and student_id = ${item.student_id}
        and status not in ('resolved','closed')
        and metadata ->> 'sessionId' = ${item.session_id}
      limit 1
    `;

    let caseId = existing?.id ?? null;
    if (!caseId) {
      const created = await createCase({
        orgId,
        studentId: item.student_id,
        campusId: item.campus_id,
        recoveryEpisodeId: episode.id,
        ownerUserId: episode.owner_user_id,
        barrierCode: "virtual_missed_session",
        barrierLabel: "Missed required virtual session",
        priority: "high",
        nextAction:
          "Identify what prevented participation and route the smallest intervention that can restore the next instructional event.",
        dueAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        metadata: {
          sessionId: item.session_id,
          source: "show_up_automation",
          episodeNumber: episode.episode_number,
        },
      });
      caseId = created.id;
      casesCreated += 1;
    }

    const key = "virtual_missed_session:" + item.session_id;
    if (!(await hasNotification(orgId, item.student_id, key))) {
      const token = await createCheckinToken({
        orgId,
        studentId: item.student_id,
        sessionId: item.session_id,
        caseId,
      });
      const link = siteUrl.replace(/\/$/, "") + "/check-in/" + token;
      const body =
        "We missed you in " + item.session_title +
        ". Tell us what got in the way so we can help: " + link;

      const sent = await tryNotify({
        orgId,
        studentId: item.student_id,
        caseId,
        templateKey: key,
        phone: item.phone ?? item.guardian_phone,
        email: item.email ?? item.guardian_email,
        subject: "What got in the way today?",
        body,
      });
      if (sent) checkinsSent += 1;
    }
  }

  const returnPlans = await evaluateReturnPlans(orgId);

  return {
    reminders,
    liveRescues,
    liveCasesCreated,
    misses,
    casesCreated,
    checkinsSent,
    incidentsOpened: incidentDetection.opened,
    incidentsResolved: incidentDetection.resolved,
    returnPlans,
  };
}

export async function getShowUpSnapshot(orgId: string) {
  const sql = db();
  const [org] = await sql<{ timezone: string }[]>`
    select timezone from organizations where id = ${orgId}
  `;
  if (!org) throw new Error("Organization not found.");
  const schoolDate = localDateString(new Date(), org.timezone);
  const incidents = await getSessionIncidents(orgId, 20);

  const [metrics] = await sql<{
    upcoming: string;
    missed_today: string;
    recovered_today: string;
    live_rescue_now: string;
    human_due: string;
  }[]>`
    select
      (
        select count(*)::text
        from session_participation sp
        join virtual_sessions vs on vs.id = sp.session_id
        where sp.org_id = ${orgId}
          and sp.status = 'scheduled'
          and vs.starts_at between now() and now() + interval '2 hours'
      ) as upcoming,
      (
        select count(*)::text
        from session_participation sp
        where sp.org_id = ${orgId}
          and sp.status = 'missed'
          and (sp.updated_at at time zone ${org.timezone})::date = ${schoolDate}::date
      ) as missed_today,
      (
        select count(*)::text
        from session_participation sp
        where sp.org_id = ${orgId}
          and sp.status = 'recovered'
          and (sp.updated_at at time zone ${org.timezone})::date = ${schoolDate}::date
      ) as recovered_today,
      (
        select count(*)::text
        from cases c
        join session_participation sp
          on sp.org_id = c.org_id and sp.student_id = c.student_id
        join virtual_sessions vs
          on vs.org_id = sp.org_id and vs.id = sp.session_id
        where c.org_id = ${orgId}
          and c.barrier_code = 'virtual_live_rescue'
          and c.status not in ('resolved','closed')
          and c.metadata ->> 'sessionId' = vs.id::text
          and vs.starts_at <= now()
          and vs.ends_at > now()
      ) as live_rescue_now,
      (
        select count(*)::text
        from cases c
        where c.org_id = ${orgId}
          and c.barrier_code in (
            'virtual_live_rescue','virtual_missed_session','virtual_nonparticipation'
          )
          and c.status not in ('resolved','closed')
          and c.due_at <= now()
      ) as human_due
  `;

  const queue = await sql<{
    case_number: string;
    episode_number: string | null;
    external_id: string;
    student_name: string;
    grade: string | null;
    barrier_label: string;
    priority: string;
    next_action: string | null;
    due_at: Date | null;
    status: string;
  }[]>`
    select c.case_number, re.episode_number, s.external_id,
           concat(s.first_name, ' ', s.last_name) as student_name,
           s.grade, c.barrier_label, c.priority,
           c.next_action, c.due_at, c.status
    from cases c
    join students s on s.id = c.student_id
    left join recovery_episodes re
      on re.org_id = c.org_id and re.id = c.recovery_episode_id
    where c.org_id = ${orgId}
      and c.barrier_code in (
        'virtual_live_rescue','virtual_missed_session','virtual_nonparticipation',
        'technology','forgot','behind','caregiving','motivation','health','anxiety','other'
      )
      and c.status not in ('resolved','closed')
    order by c.due_at nulls last, c.opened_at
    limit 50
  `;

  return {
    upcoming: Number(metrics?.upcoming ?? 0),
    missedToday: Number(metrics?.missed_today ?? 0),
    recoveredToday: Number(metrics?.recovered_today ?? 0),
    liveRescueNow: Number(metrics?.live_rescue_now ?? 0),
    humanDue: Number(metrics?.human_due ?? 0),
    openIncidents: incidents.filter((item) =>
      item.status === "open" || item.status === "investigating"
    ).length,
    incidents,
    queue: queue.map((row) => ({
      caseNumber: row.case_number,
      episodeNumber: row.episode_number,
      externalId: row.external_id,
      studentName: row.student_name,
      grade: row.grade,
      barrierLabel: row.barrier_label,
      priority: row.priority,
      nextAction: row.next_action,
      dueAt: row.due_at?.toISOString() ?? null,
      status: row.status,
    })),
  };
}
