import { db } from "@/lib/db";

export type CasePatch = {
  status?: "open" | "in_progress" | "waiting" | "resolved" | "closed";
  queue?: "do_now" | "stuck" | "check_outcome" | "resolved";
  priority?: "low" | "medium" | "high" | "urgent";
  ownerUserId?: string | null;
  nextAction?: string | null;
  dueAt?: string | null;
  note?: string | null;
};

export async function createCase(input: {
  orgId: string;
  studentId: string;
  campusId?: string | null;
  barrierCode: string;
  barrierLabel: string;
  priority?: "low" | "medium" | "high" | "urgent";
  ownerUserId?: string | null;
  nextAction?: string | null;
  dueAt?: Date | null;
  actorUserId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const sql = db();

  return sql.begin(async (tx) => {
    const [created] = await tx<{ id: string; case_number: string }[]>`
      insert into cases (
        org_id, student_id, campus_id, case_number,
        barrier_code, barrier_label, priority,
        owner_user_id, next_action, due_at, metadata
      )
      values (
        ${input.orgId}, ${input.studentId}, ${input.campusId ?? null},
        concat('CASE-', upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
        ${input.barrierCode}, ${input.barrierLabel}, ${input.priority ?? "medium"},
        ${input.ownerUserId ?? null}, ${input.nextAction ?? null},
        ${input.dueAt ?? null}, ${tx.json(input.metadata ?? {})}
      )
      returning id, case_number
    `;

    await tx`
      insert into case_events (
        org_id, case_id, actor_user_id, event_type, note, to_status, metadata
      )
      values (
        ${input.orgId}, ${created.id}, ${input.actorUserId ?? null},
        'case_created', ${input.nextAction ?? null}, 'open',
        ${tx.json(input.metadata ?? {})}
      )
    `;

    return created;
  });
}

export async function updateCase(input: {
  orgId: string;
  caseId: string;
  actorUserId: string;
  patch: CasePatch;
}) {
  const sql = db();

  return sql.begin(async (tx) => {
    const [current] = await tx<{
      id: string;
      status: string;
      queue: string;
      priority: string;
      owner_user_id: string | null;
      next_action: string | null;
      due_at: Date | null;
    }[]>`
      select id, status, queue, priority, owner_user_id, next_action, due_at
      from cases
      where id = ${input.caseId} and org_id = ${input.orgId}
      for update
    `;

    if (!current) throw new Error("Case not found.");

    const status = input.patch.status ?? current.status;
    const queue = input.patch.queue ?? current.queue;
    const priority = input.patch.priority ?? current.priority;
    const owner = input.patch.ownerUserId === undefined
      ? current.owner_user_id
      : input.patch.ownerUserId;
    const nextAction = input.patch.nextAction === undefined
      ? current.next_action
      : input.patch.nextAction;
    const dueAt = input.patch.dueAt === undefined
      ? current.due_at
      : input.patch.dueAt
        ? new Date(input.patch.dueAt)
        : null;

    const [updated] = await tx<{ id: string; case_number: string }[]>`
      update cases
      set status = ${status},
          queue = ${queue},
          priority = ${priority},
          owner_user_id = ${owner},
          next_action = ${nextAction},
          due_at = ${dueAt},
          resolved_at = case
            when ${status} in ('resolved','closed') then coalesce(resolved_at, now())
            else null
          end,
          updated_at = now()
      where id = ${input.caseId} and org_id = ${input.orgId}
      returning id, case_number
    `;

    await tx`
      insert into case_events (
        org_id, case_id, actor_user_id, event_type,
        note, from_status, to_status, metadata
      )
      values (
        ${input.orgId}, ${input.caseId}, ${input.actorUserId},
        'case_updated', ${input.patch.note ?? null},
        ${current.status}, ${status},
        ${tx.json({
          queue,
          priority,
          ownerUserId: owner,
          nextAction,
          dueAt: dueAt?.toISOString() ?? null,
        })}
      )
    `;

    return updated;
  });
}

export async function addCommitment(input: {
  orgId: string;
  caseId: string;
  actorUserId: string;
  ownerUserId?: string | null;
  description: string;
  dueAt?: Date | null;
}) {
  const sql = db();

  return sql.begin(async (tx) => {
    const [caseRow] = await tx<{ id: string }[]>`
      select id from cases
      where id = ${input.caseId} and org_id = ${input.orgId}
    `;
    if (!caseRow) throw new Error("Case not found.");

    const [commitment] = await tx<{ id: string }[]>`
      insert into commitments (
        org_id, case_id, owner_user_id, description, due_at
      )
      values (
        ${input.orgId}, ${input.caseId}, ${input.ownerUserId ?? input.actorUserId},
        ${input.description}, ${input.dueAt ?? null}
      )
      returning id
    `;

    await tx`
      insert into case_events (
        org_id, case_id, actor_user_id, event_type, note,
        metadata
      )
      values (
        ${input.orgId}, ${input.caseId}, ${input.actorUserId},
        'commitment_created', ${input.description},
        ${tx.json({ commitmentId: commitment.id })}
      )
    `;

    return commitment;
  });
}

export async function verifyCommitment(input: {
  orgId: string;
  caseId: string;
  commitmentId: string;
  actorUserId: string;
  verificationNote: string;
}) {
  const sql = db();

  return sql.begin(async (tx) => {
    const [updated] = await tx<{ id: string }[]>`
      update commitments
      set status = 'completed',
          verified_at = now(),
          verification_note = ${input.verificationNote},
          updated_at = now()
      where id = ${input.commitmentId}
        and case_id = ${input.caseId}
        and org_id = ${input.orgId}
      returning id
    `;

    if (!updated) throw new Error("Commitment not found.");

    await tx`
      insert into case_events (
        org_id, case_id, actor_user_id, event_type, note, metadata
      )
      values (
        ${input.orgId}, ${input.caseId}, ${input.actorUserId},
        'commitment_verified', ${input.verificationNote},
        ${tx.json({ commitmentId: input.commitmentId })}
      )
    `;

    return updated;
  });
}
