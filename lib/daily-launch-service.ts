import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { localDateString, localTimeString } from "@/lib/time";
import { sendNotification } from "@/lib/notifications";
import { recoveryPlaybooks, type RecoveryBarrier } from "@/lib/recovery-playbooks";
import { ensureRecoveryEpisode, getRecoverySettings } from "@/lib/recovery-service";
import { createCase } from "@/lib/case-service";
import { toJson } from "@/lib/json";

export type DailyLaunchResponse = "ready" | RecoveryBarrier;

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function minutesOfDay(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

async function tryLaunchNotification(input: {
  orgId: string;
  studentId: string;
  phone: string | null;
  email: string | null;
  guardianPhone: string | null;
  guardianEmail: string | null;
  templateKey: string;
  body: string;
}) {
  try {
    if ((input.phone || input.guardianPhone) && process.env.TWILIO_ACCOUNT_SID) {
      await sendNotification({
        orgId: input.orgId,
        studentId: input.studentId,
        channel: "sms",
        recipient: input.phone ?? input.guardianPhone!,
        templateKey: input.templateKey,
        body: input.body,
      });
      return true;
    }

    if ((input.email || input.guardianEmail) && process.env.RESEND_API_KEY) {
      await sendNotification({
        orgId: input.orgId,
        studentId: input.studentId,
        channel: "email",
        recipient: input.email ?? input.guardianEmail!,
        templateKey: input.templateKey,
        subject: "Your school day with Anchor",
        body: input.body,
      });
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

export async function runDailyLaunch(
  orgId: string,
  options: { force?: boolean } = {},
) {
  const sql = db();
  const [org] = await sql<{
    timezone: string;
    name: string;
  }[]>`
    select timezone, name
    from organizations
    where id = ${orgId}
  `;
  if (!org) throw new Error("Organization not found.");

  const settings = await getRecoverySettings(orgId);
  const now = new Date();
  const schoolDate = localDateString(now, org.timezone);
  const localTime = localTimeString(now, org.timezone);
  const nowMinutes = minutesOfDay(localTime);
  const launchMinutes = minutesOfDay(settings.dailyLaunchTime);

  if (!options.force && (nowMinutes < launchMinutes || nowMinutes > launchMinutes + 90)) {
    return {
      skipped: true,
      reason: "outside_daily_launch_window",
      schoolDate,
      localTime,
      launchTime: settings.dailyLaunchTime,
      studentsEligible: 0,
      created: 0,
      sent: 0,
      deliveryFailed: 0,
    };
  }

  const rows = await sql<{
    student_id: string;
    first_name: string;
    email: string | null;
    phone: string | null;
    guardian_email: string | null;
    guardian_phone: string | null;
    session_id: string;
    title: string;
    starts_at: Date;
    ends_at: Date;
    live_url: string | null;
  }[]>`
    select s.id as student_id, s.first_name, s.email, s.phone,
           s.guardian_email, s.guardian_phone,
           vs.id as session_id, vs.title, vs.starts_at, vs.ends_at, vs.live_url
    from students s
    join campuses c
      on c.org_id = s.org_id and c.id = s.campus_id
    join session_participation sp
      on sp.org_id = s.org_id and sp.student_id = s.id
    join virtual_sessions vs
      on vs.org_id = sp.org_id and vs.id = sp.session_id
    where s.org_id = ${orgId}
      and s.active = true
      and c.delivery_model in ('virtual_program','virtual_campus','hybrid')
      and vs.required = true
      and (vs.starts_at at time zone ${org.timezone})::date = ${schoolDate}::date
      and vs.ends_at > now()
    order by s.id, vs.starts_at
  `;

  const byStudent = new Map<string, {
    studentId: string;
    firstName: string;
    email: string | null;
    phone: string | null;
    guardianEmail: string | null;
    guardianPhone: string | null;
    sessions: {
      id: string;
      title: string;
      startsAt: string;
      endsAt: string;
      liveUrl: string | null;
    }[];
  }>();

  for (const row of rows) {
    const current = byStudent.get(row.student_id) ?? {
      studentId: row.student_id,
      firstName: row.first_name,
      email: row.email,
      phone: row.phone,
      guardianEmail: row.guardian_email,
      guardianPhone: row.guardian_phone,
      sessions: [],
    };
    current.sessions.push({
      id: row.session_id,
      title: row.title,
      startsAt: row.starts_at.toISOString(),
      endsAt: row.ends_at.toISOString(),
      liveUrl: row.live_url,
    });
    byStudent.set(row.student_id, current);
  }

  let created = 0;
  let sent = 0;
  let deliveryFailed = 0;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

  for (const student of byStudent.values()) {
    const token = randomBytes(32).toString("base64url");
    const inserted = await sql<{ id: string }[]>`
      insert into daily_launches (
        org_id, student_id, school_date, token_hash, status,
        schedule_snapshot, expires_at
      )
      values (
        ${orgId}, ${student.studentId}, ${schoolDate}::date,
        ${tokenHash(token)}, 'pending',
        ${sql.json(toJson(student.sessions))},
        now() + interval '18 hours'
      )
      on conflict (org_id, student_id, school_date) do nothing
      returning id
    `;

    if (!inserted.length) continue;
    created += 1;

    const first = student.sessions[0];
    const firstTime = new Intl.DateTimeFormat("en-US", {
      timeZone: org.timezone,
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(first.startsAt));

    const link = siteUrl + "/launch/" + token;
    const body =
      "Good morning, " + student.firstName + ". Your first class is " +
      first.title + " at " + firstTime + ". See today's schedule or tell us now if something may stop you: " + link;

    const delivered = await tryLaunchNotification({
      orgId,
      studentId: student.studentId,
      phone: student.phone,
      email: student.email,
      guardianPhone: student.guardianPhone,
      guardianEmail: student.guardianEmail,
      templateKey: "daily_launch:" + schoolDate,
      body,
    });

    if (delivered) {
      sent += 1;
      await sql`
        update daily_launches
        set sent_at = now(), updated_at = now()
        where id = ${inserted[0].id}
      `;
    } else {
      deliveryFailed += 1;
    }
  }

  return {
    skipped: false,
    schoolDate,
    localTime,
    launchTime: settings.dailyLaunchTime,
    studentsEligible: byStudent.size,
    created,
    sent,
    deliveryFailed,
  };
}

export async function getDailyLaunchContext(token: string) {
  const sql = db();
  const [row] = await sql<{
    id: string;
    first_name: string;
    school_date: string;
    status: string;
    schedule_snapshot: {
      id: string;
      title: string;
      startsAt: string;
      endsAt: string;
      liveUrl: string | null;
    }[];
    responded_at: Date | null;
    expires_at: Date;
  }[]>`
    select dl.id, s.first_name, dl.school_date::text, dl.status,
           dl.schedule_snapshot, dl.responded_at, dl.expires_at
    from daily_launches dl
    join students s
      on s.org_id = dl.org_id and s.id = dl.student_id
    where dl.token_hash = ${tokenHash(token)}
    limit 1
  `;

  if (!row || row.expires_at < new Date()) return null;

  return {
    id: row.id,
    firstName: row.first_name,
    schoolDate: row.school_date,
    status: row.status,
    responded: Boolean(row.responded_at),
    schedule: row.schedule_snapshot,
  };
}

export async function submitDailyLaunch(input: {
  token: string;
  response: DailyLaunchResponse;
  note?: string | null;
}) {
  const sql = db();

  const [launch] = await sql<{
    id: string;
    org_id: string;
    student_id: string;
    campus_id: string | null;
    school_date: string;
    responded_at: Date | null;
    expires_at: Date;
  }[]>`
    select dl.id, dl.org_id, dl.student_id, s.campus_id,
           dl.school_date::text, dl.responded_at, dl.expires_at
    from daily_launches dl
    join students s
      on s.org_id = dl.org_id and s.id = dl.student_id
    where dl.token_hash = ${tokenHash(input.token)}
    limit 1
  `;

  if (!launch || launch.expires_at < new Date()) {
    throw new Error("This Daily Launch link is invalid or expired.");
  }
  if (launch.responded_at) {
    throw new Error("Today's Daily Launch has already been submitted.");
  }

  if (input.response === "ready") {
    await sql`
      update daily_launches
      set status = 'ready', responded_at = now(),
          note = ${input.note ?? null}, updated_at = now()
      where id = ${launch.id}
        and responded_at is null
    `;
    return { status: "ready" as const };
  }

  const playbook = recoveryPlaybooks[input.response];
  await sql`
    update daily_launches
    set status = 'help_requested',
        barrier_code = ${input.response},
        note = ${input.note ?? null},
        responded_at = now(),
        updated_at = now()
    where id = ${launch.id}
      and responded_at is null
  `;

  const episode = await ensureRecoveryEpisode({
    orgId: launch.org_id,
    studentId: launch.student_id,
    campusId: launch.campus_id,
    source: "daily_launch",
    barrierCode: input.response,
    barrierLabel: playbook.label,
    tier: "navigator",
    requireHumanOwner: true,
    metadata: {
      schoolDate: launch.school_date,
      dailyLaunchId: launch.id,
      note: input.note ?? null,
    },
  });

  const [existingCase] = await sql<{ id: string; case_number: string }[]>`
    select id, case_number
    from cases
    where org_id = ${launch.org_id}
      and recovery_episode_id = ${episode.id}
      and status not in ('resolved','closed')
    order by opened_at desc
    limit 1
  `;

  let caseRow = existingCase;
  if (!caseRow) {
    caseRow = await createCase({
      orgId: launch.org_id,
      studentId: launch.student_id,
      campusId: launch.campus_id,
      recoveryEpisodeId: episode.id,
      barrierCode: input.response,
      barrierLabel: playbook.label,
      priority: playbook.priority,
      ownerUserId: episode.owner_user_id,
      nextAction: playbook.nextAction,
      dueAt: new Date(Date.now() + 30 * 60 * 1000),
      metadata: {
        source: "daily_launch",
        dailyLaunchId: launch.id,
        schoolDate: launch.school_date,
      },
    });
  }

  return {
    status: "help_requested" as const,
    episodeNumber: episode.episode_number,
    caseNumber: caseRow.case_number,
    nextAction: playbook.nextAction,
  };
}

export async function getDailyLaunchSnapshot(orgId: string) {
  const sql = db();
  const [org] = await sql<{ timezone: string }[]>`
    select timezone from organizations where id = ${orgId}
  `;
  if (!org) throw new Error("Organization not found.");
  const schoolDate = localDateString(new Date(), org.timezone);

  const [metrics] = await sql<{
    total: string;
    sent: string;
    responded: string;
    ready: string;
    help_requested: string;
  }[]>`
    select
      count(*)::text as total,
      count(*) filter (where sent_at is not null)::text as sent,
      count(*) filter (where responded_at is not null)::text as responded,
      count(*) filter (where status = 'ready')::text as ready,
      count(*) filter (where status = 'help_requested')::text as help_requested
    from daily_launches
    where org_id = ${orgId}
      and school_date = ${schoolDate}::date
  `;

  const barriers = await sql<{ barrier_code: string; count: string }[]>`
    select barrier_code, count(*)::text as count
    from daily_launches
    where org_id = ${orgId}
      and school_date = ${schoolDate}::date
      and status = 'help_requested'
      and barrier_code is not null
    group by barrier_code
    order by count(*) desc, barrier_code
  `;

  return {
    schoolDate,
    total: Number(metrics?.total ?? 0),
    sent: Number(metrics?.sent ?? 0),
    responded: Number(metrics?.responded ?? 0),
    ready: Number(metrics?.ready ?? 0),
    helpRequested: Number(metrics?.help_requested ?? 0),
    barriers: barriers.map((row) => ({
      code: row.barrier_code,
      count: Number(row.count),
    })),
  };
}
