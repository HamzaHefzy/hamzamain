import bcrypt from "bcryptjs";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required.");

const email = process.env.SEED_ADMIN_EMAIL;
const password = process.env.SEED_ADMIN_PASSWORD;
if (!email || !password || password.length < 12) {
  throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (12+ chars) are required.");
}

const orgName = process.env.SEED_ORG_NAME ?? "Anchor Demo District";
const orgSlug = process.env.SEED_ORG_SLUG ?? "anchor-demo";
const sql = postgres(url, { max: 1, prepare: false });
const passwordHash = await bcrypt.hash(password, 12);

await sql.begin(async (tx) => {
  const [org] = await tx<{ id: string }[]>`
    insert into organizations (name, slug, organization_type, state, status)
    values (${orgName}, ${orgSlug}, 'charter_network', 'TX', 'trial')
    on conflict (slug) do update set name = excluded.name
    returning id
  `;

  const [user] = await tx<{ id: string }[]>`
    insert into users (email, name, password_hash)
    values (${email.toLowerCase()}, 'Anchor Administrator', ${passwordHash})
    on conflict (email) do update
      set password_hash = excluded.password_hash,
          active = true
    returning id
  `;

  await tx`
    insert into memberships (user_id, org_id, role)
    values (${user.id}, ${org.id}, 'owner')
    on conflict (user_id, org_id) do update set role = 'owner'
  `;

  const campuses = [
    ["CENTRAL", "Central Prep", "in_person"],
    ["NORTH", "North Academy", "in_person"],
    ["VIRTUAL", "Anchor Virtual Academy", "virtual_program"],
  ] as const;

  for (const [code, name, model] of campuses) {
    await tx`
      insert into campuses (org_id, code, name, delivery_model)
      values (${org.id}, ${code}, ${name}, ${model})
      on conflict (org_id, code) do update
        set name = excluded.name,
            delivery_model = excluded.delivery_model
    `;
  }

  await tx`
    insert into funding_assumptions (
      org_id, school_year, model_type, basic_allotment, budgeted_attendance_rate
    )
    values (${org.id}, '2026-27', 'texas_ada', 6215, 0.94)
    on conflict (org_id) do update
      set school_year = excluded.school_year,
          basic_allotment = excluded.basic_allotment,
          budgeted_attendance_rate = excluded.budgeted_attendance_rate
  `;

  await tx`
    insert into attendance_policies (
      org_id, name, delivery_model, version, effective_from, config
    )
    values (
      ${org.id},
      'Default virtual participation',
      'virtual_program',
      1,
      '2026-08-01',
      ${tx.json({
        qualifyingEvidence: [
          "lms_progress",
          "teacher_interaction",
          "assignment_submission",
          "live_session",
          "approved_offline_work",
        ],
        minimumMinutes: 1,
        allowAnyQualifyingEvidence: true,
        dayCloseLocalTime: "23:59",
      })}
    )
    on conflict (org_id, name, version) do nothing
  `;

  const [virtualCampus] = await tx<{ id: string }[]>`
    select id from campuses where org_id = ${org.id} and code = 'VIRTUAL'
  `;
  const [centralCampus] = await tx<{ id: string }[]>`
    select id from campuses where org_id = ${org.id} and code = 'CENTRAL'
  `;

  const students = [
    ["SYN-1001", "Taylor", "Carter", "8", centralCampus.id],
    ["SYN-1002", "Jordan", "Mitchell", "9", centralCampus.id],
    ["VIR-2001", "Alex", "Lee", "10", virtualCampus.id],
    ["VIR-2002", "Morgan", "Reed", "11", virtualCampus.id],
  ] as const;

  for (const [externalId, first, last, grade, campusId] of students) {
    await tx`
      insert into students (
        org_id, campus_id, external_id, first_name, last_name, grade
      )
      values (
        ${org.id}, ${campusId}, ${externalId}, ${first}, ${last}, ${grade}
      )
      on conflict (org_id, external_id) do update
        set first_name = excluded.first_name,
            last_name = excluded.last_name,
            campus_id = excluded.campus_id,
            grade = excluded.grade
    `;
  }

  const [student] = await tx<{ id: string }[]>`
    select id
    from students
    where org_id = ${org.id} and external_id = 'SYN-1001'
  `;

  await tx`
    insert into cases (
      org_id, student_id, campus_id, case_number,
      barrier_code, barrier_label, status, queue,
      priority, owner_user_id, next_action, due_at
    )
    values (
      ${org.id}, ${student.id}, ${centralCampus.id}, 'CASE-1001',
      'transportation', 'Transportation', 'in_progress', 'do_now',
      'high', ${user.id}, 'Confirm approved morning transport',
      now() + interval '4 hours'
    )
    on conflict (org_id, case_number) do nothing
  `;

  const [virtualStudent] = await tx<{ id: string }[]>`
    select id
    from students
    where org_id = ${org.id} and external_id = 'VIR-2001'
  `;

  await tx`
    insert into virtual_evidence_events (
      org_id, student_id, evidence_date, evidence_type,
      occurred_at, source, source_ref, minutes, qualifies
    )
    values (
      ${org.id}, ${virtualStudent.id}, current_date, 'lms_progress',
      now() - interval '2 hours', 'seed', 'seed-virtual-evidence-1', 22, true
    )
    on conflict do nothing
  `;

  await tx`
    insert into attendance_daily (
      org_id, student_id, school_date, status, minutes,
      source, evidence_refs, decision_reason
    )
    values (
      ${org.id}, ${virtualStudent.id}, current_date, 'present', 22,
      'virtual_policy', '[]'::jsonb, 'Seeded qualifying LMS progress'
    )
    on conflict (org_id, student_id, school_date) do nothing
  `;
});

await sql.end();
console.log("Seed complete. Sign in as", email);
