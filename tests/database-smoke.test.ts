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
});
