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
import { cancelOperatorTask } from "@/lib/operator/cancellation";
import { acceptSafeOperatorCallback } from "@/lib/operator/callbacks";
import { resolveOperatorDestination, saveOperatorContact } from "@/lib/operator/contacts";

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

  it("enforces plan capability boundaries", async () => {
    await sql!`
      update operator_subscriptions
      set plan = 'assistant', status = 'active', updated_at = now()
      where org_id = ${orgId}
    `;

    await expect(createOperatorTask({
      orgId,
      userId,
      request: "Call my dentist and schedule the first available appointment",
    })).rejects.toThrow(/Operator/);

    const browserTask = await createOperatorTask({
      orgId,
      userId,
      request: "Find three restaurants near downtown",
    });
    expect(browserTask.id).toBeTruthy();

    await sql!`
      update operator_subscriptions
      set plan = 'trial', status = 'trialing', updated_at = now()
      where org_id = ${orgId}
    `;
  });

  it("cancels in-flight work and ignores duplicate late callbacks", async () => {
    const [task] = await sql!<{ id: string }[]>`
      insert into operator_tasks (
        org_id, created_by, title, request, category, status, source
      )
      values (
        ${orgId}, ${userId}, 'Callback cancellation test',
        'Test a cancelled external action', 'general', 'waiting_external', 'api'
      )
      returning id
    `;
    const [step] = await sql!<{ id: string }[]>`
      insert into operator_steps (
        org_id, task_id, sequence, kind, status, summary, provider
      )
      values (
        ${orgId}, ${task.id}, 1, 'browser', 'waiting_external',
        'External action in flight', 'test-runner'
      )
      returning id
    `;

    const cancelled = await cancelOperatorTask({ orgId, userId, taskId: task.id });
    expect(cancelled?.status).toBe("cancelled");
    expect(cancelled?.steps[0]?.status).toBe("skipped");

    const callback = {
      callbackId: "test-callback-" + task.id,
      taskId: task.id,
      stepId: step.id,
      state: "completed" as const,
      message: "Provider says it completed.",
    };
    const afterLateCallback = await acceptSafeOperatorCallback(callback);
    expect(afterLateCallback?.status).toBe("cancelled");

    const duplicate = await acceptSafeOperatorCallback(callback);
    expect(duplicate?.status).toBe("cancelled");

    const [ledger] = await sql!<{ count: number }[]>`
      select count(*)::int as count
      from operator_callback_events
      where callback_id = ${callback.callbackId}
    `;
    expect(ledger.count).toBe(1);
  });

  it("pauses new execution when billing is delinquent", async () => {
    await sql!`
      update operator_subscriptions
      set plan = 'operator', status = 'past_due', updated_at = now()
      where org_id = ${orgId}
    `;

    await expect(createOperatorTask({
      orgId,
      userId,
      request: "Find three coffee shops near downtown",
    })).rejects.toThrow(/billing|subscription|past_due/i);

    await sql!`
      update operator_subscriptions
      set plan = 'trial', status = 'trialing', updated_at = now()
      where org_id = ${orgId}
    `;
  });

  it("retries connector-blocked steps but does not duplicate dispatched work", async () => {
    const [blockedTask] = await sql!<{ id: string }[]>`
      insert into operator_tasks (
        org_id, created_by, title, request, category, status, source
      )
      values (
        ${orgId}, ${userId}, 'Blocked connector test',
        'Test connector retry', 'general', 'waiting_external', 'api'
      )
      returning id
    `;
    await sql!`
      insert into operator_steps (
        org_id, task_id, sequence, kind, status, summary, provider, response
      )
      values (
        ${orgId}, ${blockedTask.id}, 1, 'browser', 'waiting_external',
        'Waiting for connector', 'action-runner', '{"noDispatch":true}'::jsonb
      )
    `;

    const retried = await runOperatorTask(orgId, blockedTask.id);
    expect(retried?.status).toBe("completed");

    const [dispatchedTask] = await sql!<{ id: string }[]>`
      insert into operator_tasks (
        org_id, created_by, title, request, category, status, source
      )
      values (
        ${orgId}, ${userId}, 'Dispatched provider test',
        'Test provider wait', 'general', 'waiting_external', 'api'
      )
      returning id
    `;
    await sql!`
      insert into operator_steps (
        org_id, task_id, sequence, kind, status, summary, provider, response
      )
      values (
        ${orgId}, ${dispatchedTask.id}, 1, 'browser', 'waiting_external',
        'Already dispatched', 'action-runner', '{"providerJob":"abc"}'::jsonb
      )
    `;

    const stillWaiting = await runOperatorTask(orgId, dispatchedTask.id);
    expect(stillWaiting?.status).toBe("waiting_external");
    expect(stillWaiting?.steps[0]?.status).toBe("waiting_external");
  });

  it("dispatches a pending step only once under concurrent run requests", async () => {
    const [task] = await sql!<{ id: string }[]>`
      insert into operator_tasks (
        org_id, created_by, title, request, category, status, source
      )
      values (
        ${orgId}, ${userId}, 'Concurrency test',
        'Research one option safely', 'general', 'ready', 'api'
      )
      returning id
    `;
    const [step] = await sql!<{ id: string }[]>`
      insert into operator_steps (
        org_id, task_id, sequence, kind, status, summary, request
      )
      values (
        ${orgId}, ${task.id}, 1, 'browser', 'pending',
        'Run exactly once', '{"objective":"concurrency test"}'::jsonb
      )
      returning id
    `;

    const results = await Promise.all([
      runOperatorTask(orgId, task.id),
      runOperatorTask(orgId, task.id),
    ]);
    expect(results.some((result) => result?.status === "completed")).toBe(true);

    const finalTask = await getOperatorTask(orgId, task.id);
    expect(finalTask?.status).toBe("completed");
    expect(finalTask?.steps[0]?.status).toBe("completed");

    const [events] = await sql!<{ count: number }[]>`
      select count(*)::int as count
      from operator_events
      where task_id = ${task.id}
        and step_id = ${step.id}
        and event_type = 'step.completed'
    `;
    expect(events.count).toBe(1);
  });

  it("resolves private contact destinations and refuses ambiguous matches", async () => {
    const primary = await saveOperatorContact({
      orgId,
      displayName: "Dr. Lee",
      organization: "Triangle Dental",
      phone: "+19195550111",
      email: "office@triangle-dental.example",
      aliases: ["dentist"],
    });

    const resolved = await resolveOperatorDestination({
      orgId,
      kind: "voice",
      taskRequest: "Call Dr. Lee and ask for the earliest cleaning next week",
      request: {},
    });
    expect(resolved.to).toBe(primary.phone);
    expect(resolved.contactName).toBe("Dr. Lee");

    await saveOperatorContact({
      orgId,
      displayName: "Dr. Smith",
      organization: "Downtown Dental",
      phone: "+19195550222",
      aliases: ["dentist"],
    });

    const ambiguous = await resolveOperatorDestination({
      orgId,
      kind: "voice",
      taskRequest: "Call my dentist",
      request: {},
    });
    expect(ambiguous.to).toBeUndefined();
    expect(String(ambiguous.contactResolutionError)).toMatch(/more than one/i);
  });

});
