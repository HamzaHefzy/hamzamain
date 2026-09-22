import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres from "postgres";
import {
  createOperatorTask,
  getOperatorTask,
  resolveOperatorApproval,
  runOperatorTask,
} from "@/lib/operator/service";
import { plannerContext, upsertOperatorMemory } from "@/lib/operator/context";
import { createOperatorRoutine, runDueOperatorRoutines } from "@/lib/operator/routines";

const run = Boolean(process.env.DATABASE_URL);
const sql = run ? postgres(process.env.DATABASE_URL!, { max: 1, prepare: false }) : null;

describe.skipIf(!run)("Operator database lifecycle", () => {
  let orgId = "";
  let userId = "";

  beforeAll(async () => {
    process.env.OPERATOR_DEMO_MODE = "true";
    const [row] = await sql!<{
      org_id: string;
      user_id: string;
    }[]>`
      select m.org_id, m.user_id
      from memberships m
      join users u on u.id = m.user_id
      where m.role = 'owner' and m.active = true and u.active = true
      order by m.created_at
      limit 1
    `;
    orgId = row.org_id;
    userId = row.user_id;
  });

  afterAll(async () => {
    await sql?.end();
  });

  it("seeds only the Operator workspace primitives", async () => {
    const [snapshot] = await sql!<{
      organizations: number;
      owners: number;
      profiles: number;
      subscriptions: number;
    }[]>`
      select
        (select count(*)::int from organizations) as organizations,
        (select count(*)::int from memberships where role = 'owner') as owners,
        (select count(*)::int from operator_profiles) as profiles,
        (select count(*)::int from operator_subscriptions) as subscriptions
    `;

    expect(snapshot.organizations).toBeGreaterThan(0);
    expect(snapshot.owners).toBeGreaterThan(0);
    expect(snapshot.profiles).toBeGreaterThan(0);
    expect(snapshot.subscriptions).toBeGreaterThan(0);
  });

  it("runs a safe task end to end in demo mode", async () => {
    const task = await createOperatorTask({
      orgId,
      userId,
      request: "Find three good options for a birthday activity next Saturday",
    });

    const completed = await runOperatorTask(orgId, task.id);
    expect(completed?.status).toBe("completed");
    expect(completed?.steps.every((step) => step.status === "completed")).toBe(true);
  });

  it("pauses a consequential task for approval and resumes after approval", async () => {
    const task = await createOperatorTask({
      orgId,
      userId,
      request: "Book dinner for four Friday at 7 PM near downtown under $100 per person",
      budgetLimit: 400,
    });

    const paused = await runOperatorTask(orgId, task.id);
    expect(paused?.status).toBe("awaiting_approval");

    const pending = paused?.approvals.find((approval) => approval.status === "pending");
    expect(pending).toBeTruthy();

    await resolveOperatorApproval({
      orgId,
      userId,
      approvalId: pending!.id,
      decision: "approved",
    });

    const completed = await runOperatorTask(orgId, task.id);
    expect(completed?.status).toBe("completed");

    const loaded = await getOperatorTask(orgId, task.id);
    expect(loaded?.approvals.every((approval) => approval.status === "approved")).toBe(true);
  });

  it("scopes planner memory by sensitivity", async () => {
    await upsertOperatorMemory({
      orgId,
      key: "dining_preferences",
      value: "Quiet restaurants after 7 PM",
      sensitivity: "normal",
    });
    await upsertOperatorMemory({
      orgId,
      key: "private_note",
      value: "Do not send this to the planner by default",
      sensitivity: "restricted",
    });

    const context = await plannerContext(orgId);
    expect(context.memories.some((memory) => memory.key === "dining_preferences")).toBe(true);
    expect(context.memories.some((memory) => memory.key === "private_note")).toBe(false);
  });

  it("claims a due routine once and creates a normal Operator task", async () => {
    const routine = await createOperatorRoutine({
      orgId,
      userId,
      title: "Daily planning test",
      request: "Find three good options for an outdoor activity",
      cadence: "daily",
      firstRunAt: new Date(Date.now() + 60_000),
    });

    await sql!`
      update operator_routines
      set next_run_at = now() - interval '1 minute'
      where id = ${routine.id}
    `;

    const results = await runDueOperatorRoutines();
    const result = results.find((item) => item.routineId === routine.id);
    expect(result?.taskId).toBeTruthy();
    expect(result?.status).toBe("completed");

    const secondPass = await runDueOperatorRoutines();
    expect(secondPass.some((item) => item.routineId === routine.id)).toBe(false);
  });
});
