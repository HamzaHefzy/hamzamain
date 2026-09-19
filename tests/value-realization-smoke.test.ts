import { describe, expect, it } from "vitest";
import postgres from "postgres";
import { getValueRealizationSnapshot } from "../lib/value-realization";

const run = Boolean(process.env.DATABASE_URL);

describe.skipIf(!run)("value realization database snapshot", () => {
  it("executes against the migrated seeded organization", async () => {
    const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false });
    const [org] = await sql<{ id: string }[]>`
      select id from organizations order by created_at limit 1
    `;

    const snapshot = await getValueRealizationSnapshot(org.id);

    expect(snapshot.dashboard.enrollment).toBeGreaterThanOrEqual(0);
    expect(snapshot.value.resolvedCases90d).toBeGreaterThanOrEqual(0);
    expect(snapshot.value.verifiedCommitments90d).toBeGreaterThanOrEqual(0);
    expect(snapshot.value.reportingWindowDays).toBe(90);

    await sql.end();
  });
});
