import { describe, expect, it } from "vitest";
import postgres from "postgres";
import { getEvidenceSnapshot } from "../lib/evidence";

const run = Boolean(process.env.DATABASE_URL);

describe.skipIf(!run)("evidence analytics", () => {
  it("executes the production evidence query against the migrated seeded database", async () => {
    const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false });
    const [org] = await sql<{ id: string }[]>`
      select id from organizations order by created_at limit 1
    `;
    expect(org?.id).toBeTruthy();

    const snapshot = await getEvidenceSnapshot(org.id);

    expect(snapshot.resolvedCases90d).toBeGreaterThanOrEqual(0);
    expect(snapshot.overdueCommitments).toBeGreaterThanOrEqual(0);
    expect(snapshot.stuckOpenCases).toBeGreaterThanOrEqual(0);
    expect(snapshot.openCasesPastDue).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(snapshot.barrierPerformance)).toBe(true);
    expect(Array.isArray(snapshot.campusPerformance)).toBe(true);
    expect(Array.isArray(snapshot.cohorts)).toBe(true);

    await sql.end();
  });
});
