import { createHash, randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import postgres from "postgres";
import {
  ensureRecoveryEpisode,
  evaluateReturnPlans,
  getRecoveryDesk,
  startReturnPlan,
} from "../lib/recovery-service";
import { detectSessionIncidents } from "../lib/session-incidents";
import { submitDailyLaunch } from "../lib/daily-launch-service";

const run = Boolean(process.env.DATABASE_URL);

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

describe.skipIf(!run)("attendance recovery operations", () => {
  it("runs the recovery lifecycle against PostgreSQL", async () => {
    const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false });
    const suffix = randomUUID().slice(0, 8);

    const [org] = await sql<{ id: string }[]>`
      insert into organizations (name, slug, state, timezone, status)
      values (
        ${"Recovery Test " + suffix},
        ${"recovery-test-" + suffix},
        'TX',
        'America/Chicago',
        'trial'
      )
      returning id
    `;

    const [user] = await sql<{ id: string }[]>`
      insert into users (email, name, active)
      values (
        ${"navigator-" + suffix + "@example.invalid"},
        'Recovery Navigator',
        true
      )
      returning id
    `;

    await sql`
      insert into memberships (user_id, org_id, role, active)
      values (${user.id}, ${org.id}, 'attendance', true)
    `;

    const [campus] = await sql<{ id: string }[]>`
      insert into campuses (org_id, code, name, delivery_model)
      values (${org.id}, 'REC', 'Recovery Campus', 'in_person')
      returning id
    `;

    const [student] = await sql<{ id: string }[]>`
      insert into students (
        org_id, campus_id, external_id, first_name, last_name, grade, active
      )
      values (
        ${org.id}, ${campus.id}, 'REC-1001', 'Avery', 'Jordan', '9', true
      )
      returning id
    `;

    const first = await ensureRecoveryEpisode({
      orgId: org.id,
      studentId: student.id,
      campusId: campus.id,
      source: "test_signal",
      barrierCode: "forgot",
      barrierLabel: "Routine / schedule confusion",
      tier: "navigator",
      requireHumanOwner: true,
    });

    const reused = await ensureRecoveryEpisode({
      orgId: org.id,
      studentId: student.id,
      campusId: campus.id,
      source: "second_test_signal",
      barrierCode: "forgot",
      barrierLabel: "Routine / schedule confusion",
      requireHumanOwner: true,
    });

    expect(reused.id).toBe(first.id);
    expect(reused.owner_user_id).toBe(user.id);

    const plan = await startReturnPlan({
      orgId: org.id,
      episodeId: first.id,
      actorUserId: user.id,
      targetEvents: 3,
      requiredSuccesses: 2,
      plan: {
        studentCommitment: "Attend the next three school days.",
        schoolCommitment: "Navigator checks in each morning.",
      },
    });

    await sql`
      update return_plans
      set started_at = current_date - interval '2 days'
      where id = ${plan.id}
    `;

    await sql`
      insert into attendance_daily (
        org_id, student_id, school_date, status, source, evidence_refs
      )
      values
        (${org.id}, ${student.id}, current_date - 2, 'present', 'test', '[]'::jsonb),
        (${org.id}, ${student.id}, current_date - 1, 'absent', 'test', '[]'::jsonb),
        (${org.id}, ${student.id}, current_date, 'present', 'test', '[]'::jsonb)
    `;

    const evaluated = await evaluateReturnPlans(org.id);
    expect(evaluated.completed).toBe(1);

    const [recovered] = await sql<{ status: string }[]>`
      select status from recovery_episodes
      where id = ${first.id} and org_id = ${org.id}
    `;
    expect(recovered.status).toBe("recovered");

    const relapse = await ensureRecoveryEpisode({
      orgId: org.id,
      studentId: student.id,
      campusId: campus.id,
      source: "relapse_signal",
      barrierCode: "behind",
      barrierLabel: "Academic overwhelm",
      requireHumanOwner: true,
    });

    expect(relapse.id).toBe(first.id);
    expect(relapse.reopened).toBe(true);

    const [relapsed] = await sql<{ status: string; relapse_count: number }[]>`
      select status, relapse_count
      from recovery_episodes
      where id = ${first.id} and org_id = ${org.id}
    `;
    expect(relapsed.status).toBe("open");
    expect(relapsed.relapse_count).toBeGreaterThanOrEqual(1);

    const [virtualCampus] = await sql<{ id: string }[]>`
      insert into campuses (org_id, code, name, delivery_model)
      values (${org.id}, 'VIRT', 'Recovery Virtual', 'virtual_program')
      returning id
    `;

    const [virtualSession] = await sql<{ id: string }[]>`
      insert into virtual_sessions (
        org_id, campus_id, external_id, title, starts_at, ends_at, required, source
      )
      values (
        ${org.id}, ${virtualCampus.id}, 'SESSION-' || ${suffix},
        'Algebra Live', now() - interval '15 minutes',
        now() + interval '30 minutes', true, 'test'
      )
      returning id
    `;

    for (let index = 0; index < 5; index += 1) {
      const [virtualStudent] = await sql<{ id: string }[]>`
        insert into students (
          org_id, campus_id, external_id, first_name, last_name, grade, active
        )
        values (
          ${org.id}, ${virtualCampus.id},
          ${"VIRT-" + suffix + "-" + index},
          ${"Student" + index}, 'Virtual', '10', true
        )
        returning id
      `;

      await sql`
        insert into session_participation (
          org_id, session_id, student_id, status, source
        )
        values (
          ${org.id}, ${virtualSession.id}, ${virtualStudent.id},
          'scheduled', 'test'
        )
      `;
    }

    const incidents = await detectSessionIncidents(org.id);
    expect(incidents.incidentSessionIds.has(virtualSession.id)).toBe(true);
    expect(incidents.opened).toBe(1);

    const [launchStudent] = await sql<{ id: string }[]>`
      insert into students (
        org_id, campus_id, external_id, first_name, last_name, grade, active
      )
      values (
        ${org.id}, ${campus.id}, 'LAUNCH-' || ${suffix},
        'Riley', 'Launch', '8', true
      )
      returning id
    `;

    const rawToken = "daily-launch-" + suffix;
    await sql`
      insert into daily_launches (
        org_id, student_id, school_date, token_hash, status,
        schedule_snapshot, expires_at
      )
      values (
        ${org.id}, ${launchStudent.id}, current_date,
        ${hashToken(rawToken)}, 'pending', '[]'::jsonb,
        now() + interval '12 hours'
      )
    `;

    const help = await submitDailyLaunch({
      token: rawToken,
      response: "technology",
      note: "My school laptop will not connect.",
    });

    expect(help.status).toBe("help_requested");
    if (help.status !== "help_requested") {
      throw new Error("Expected Daily Launch help request to create recovery work.");
    }
    expect(help.episodeNumber).toMatch(/^REC-/);
    expect(help.caseNumber).toMatch(/^CASE-/);

    const [launchCase] = await sql<{
      recovery_episode_id: string | null;
      owner_user_id: string | null;
      priority: string;
    }[]>`
      select recovery_episode_id, owner_user_id, priority
      from cases
      where org_id = ${org.id}
        and case_number = ${help.caseNumber}
    `;

    expect(launchCase.recovery_episode_id).toBeTruthy();
    expect(launchCase.owner_user_id).toBe(user.id);
    expect(launchCase.priority).toBe("high");

    const desk = await getRecoveryDesk(org.id);
    expect(desk.metrics.active).toBeGreaterThanOrEqual(2);
    expect(desk.episodes.some((episode) => episode.id === first.id)).toBe(true);

    await sql`delete from organizations where id = ${org.id}`;
    await sql`delete from users where id = ${user.id}`;
    await sql.end();
  });
});
