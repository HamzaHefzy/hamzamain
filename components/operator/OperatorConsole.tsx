"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Task = {
  id: string;
  title: string;
  request: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  result?: Record<string, unknown>;
};

type Approval = {
  id: string;
  task_id: string;
  task_title: string;
  approval_type: string;
  summary: string;
  amount: string | null;
  currency: string;
};

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export default function OperatorConsole({
  tasks,
  approvals,
}: {
  tasks: Task[];
  approvals: Approval[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [approvalBusy, setApprovalBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const requestText = String(form.get("request") ?? "").trim();
    const budgetRaw = String(form.get("budget") ?? "").trim();

    try {
      const response = await fetch("/api/operator/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: requestText,
          priority: form.get("priority") || "normal",
          budgetLimit: budgetRaw ? Number(budgetRaw) : null,
          runImmediately: true,
        }),
      });
      const payload = await response.json() as { error?: string; task?: { id: string } };
      if (!response.ok) throw new Error(payload.error ?? "Unable to create task.");
      event.currentTarget.reset();
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create task.");
    } finally {
      setBusy(false);
    }
  }

  async function resolveApproval(id: string, decision: "approved" | "rejected") {
    setApprovalBusy(id + decision);
    setError("");
    try {
      const response = await fetch("/api/operator/approvals/" + id, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to resolve approval.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to resolve approval.");
    } finally {
      setApprovalBusy(null);
    }
  }

  return (
    <>
      <section className="operator-command">
        <div>
          <span className="operator-kicker">Delegate anything</span>
          <h2>What do you want off your plate?</h2>
          <p>Give Operator the outcome. It builds the plan, asks only when authority is missing, and keeps ownership until the task is finished.</p>
        </div>
        <form onSubmit={createTask}>
          <textarea
            name="request"
            required
            minLength={4}
            maxLength={4000}
            placeholder="Call my dentist, find the earliest cleaning after 2 PM next week, book it if it is under $200, and add it to my calendar."
          />
          <div className="operator-command-row">
            <label>
              <span>Priority</span>
              <select name="priority" defaultValue="normal">
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
            <label>
              <span>Budget ceiling</span>
              <div className="operator-money-input"><b>$</b><input name="budget" inputMode="decimal" placeholder="Optional" /></div>
            </label>
            <button disabled={busy} type="submit">{busy ? "Handing it over…" : "Handle it"}</button>
          </div>
          {error ? <div className="operator-error" role="alert">{error}</div> : null}
        </form>
      </section>

      {approvals.length ? (
        <section className="operator-section">
          <div className="operator-section-heading">
            <div><span className="operator-kicker">Needs your call</span><h2>Approvals</h2></div>
            <span className="operator-count">{approvals.length}</span>
          </div>
          <div className="operator-approval-list">
            {approvals.map((approval) => (
              <article key={approval.id} className="operator-approval">
                <div>
                  <span>{approval.approval_type.replaceAll("_", " ")}</span>
                  <strong>{approval.summary}</strong>
                  <small>{approval.task_title}{approval.amount ? ` · up to ${approval.currency} ${Number(approval.amount).toFixed(2)}` : ""}</small>
                </div>
                <div className="operator-approval-actions">
                  <button className="ghost" disabled={approvalBusy !== null} onClick={() => resolveApproval(approval.id, "rejected")}>Decline</button>
                  <button disabled={approvalBusy !== null} onClick={() => resolveApproval(approval.id, "approved")}>{approvalBusy === approval.id + "approved" ? "Approving…" : "Approve"}</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="operator-section">
        <div className="operator-section-heading">
          <div><span className="operator-kicker">Owned by Operator</span><h2>Current work</h2></div>
          <Link href="/assistant/activity">View activity</Link>
        </div>
        <div className="operator-task-list">
          {tasks.length ? tasks.map((task) => (
            <Link href={`/assistant/tasks/${task.id}`} className="operator-task" key={task.id}>
              <div className={`operator-status-dot status-${task.status}`} />
              <div className="operator-task-copy"><strong>{task.title}</strong><span>{task.category} · {task.priority} priority</span></div>
              <div className="operator-task-state"><span>{statusLabel(task.status)}</span><small>{new Date(task.created_at).toLocaleDateString()}</small></div>
              <span className="operator-chevron">→</span>
            </Link>
          )) : <div className="operator-empty"><strong>Your queue is clear.</strong><span>Delegate the first thing you have been putting off.</span></div>}
        </div>
      </section>
    </>
  );
}
