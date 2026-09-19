import { describe, expect, it } from "vitest";
import postgres from "postgres";

const run = Boolean(process.env.DATABASE_URL);

describe.skipIf(!run)("database migration and seed", () => {
  it("creates required customer workspace records", async () => {
    const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false });
    const rows = await sql.unsafe<{
      organizations: string;
      owners: string;
      campuses: string;
      policies: string;
      assumptions: string;
    }[]>([
      "select",
      "(select count(*) from organizations)::text as organizations,",
      "(select count(*) from memberships where role='owner')::text as owners,",
      "(select count(*) from campuses)::text as campuses,",
      "(select count(*) from attendance_policies)::text as policies,",
      "(select count(*) from funding_assumptions)::text as assumptions",
    ].join(" "));
    const snapshot = rows[0];

    expect(Number(snapshot.organizations)).toBeGreaterThan(0);
    expect(Number(snapshot.owners)).toBeGreaterThan(0);
    expect(Number(snapshot.campuses)).toBeGreaterThanOrEqual(3);
    expect(Number(snapshot.policies)).toBeGreaterThan(0);
    expect(Number(snapshot.assumptions)).toBeGreaterThan(0);
    await sql.end();
  });

  it("rejects cross-organization student-to-campus relationships", async () => {
    const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false });

    const [orgA] = await sql<{ id: string }[]>`
      insert into organizations (name, slug, state, timezone)
      values ('Tenant A', 'tenant-a-test', 'TX', 'America/Chicago')
      returning id
    `;
    const [orgB] = await sql<{ id: string }[]>`
      insert into organizations (name, slug, state, timezone)
      values ('Tenant B', 'tenant-b-test', 'TX', 'America/Chicago')
      returning id
    `;
    const [campusB] = await sql<{ id: string }[]>`
      insert into campuses (org_id, name, code)
      values (${orgB.id}, 'Tenant B Campus', 'B-CAMPUS')
      returning id
    `;

    await expect(
      sql`
        insert into students (
          org_id, campus_id, external_id, first_name, last_name
        )
        values (
          ${orgA.id}, ${campusB.id}, 'CROSS-TENANT-STUDENT', 'Cross', 'Tenant'
        )
      `,
    ).rejects.toThrow();

    await sql`delete from organizations where id in (${orgA.id}, ${orgB.id})`;
    await sql.end();
  });
});
