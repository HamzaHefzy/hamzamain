"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TaskActions({
  taskId,
  status,
  approvals,
}: {
  taskId: string;
  status: string;
  approvals: Array<{ id: string; status: string }>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function request(path: string, options?: RequestInit) {
    const response = await fetch(path, options);
    const payload = await response.json() as { error?: string };
    if (!response.ok) throw new Error(payload.error ?? "Request failed.");
    router.refresh();
  }

  async function run() {
    setBusy("run");
    setError("");
    try {
      await request("/api/operator/tasks/" + taskId + "/run", { method: "POST" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to run task.");
    } finally {
      setBusy("");
    }
  }

  async function cancel() {
    if (!window.confirm("Cancel this task? Any outside-world action already in flight may still finish, but Operator will ignore late callbacks and will not continue the workflow.")) {
      return;
    }
    setBusy("cancel");
    setError("");
    try {
      await request("/api/operator/tasks/" + taskId + "/cancel", { method: "POST" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to cancel task.");
    } finally {
      setBusy("");
    }
  }

  async function decide(approvalId: string, decision: "approved" | "rejected") {
    setBusy(approvalId + decision);
    setError("");
    try {
      await request("/api/operator/approvals/" + approvalId, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update approval.");
    } finally {
      setBusy("");
    }
  }

  const pending = approvals.filter((approval) => approval.status === "pending");
  const terminal = ["completed", "cancelled"].includes(status);

  return (
    <div className="operator-task-actions">
      {pending.map((approval) => (
        <div key={approval.id} className="operator-inline-actions">
          <button className="ghost" disabled={Boolean(busy)} onClick={() => decide(approval.id, "rejected")}>Decline</button>
          <button disabled={Boolean(busy)} onClick={() => decide(approval.id, "approved")}>Approve step</button>
        </div>
      ))}
      {["ready", "in_progress", "waiting_external", "failed"].includes(status) ? (
        <button disabled={Boolean(busy)} onClick={run}>{busy === "run" ? "Running…" : "Run / retry"}</button>
      ) : null}
      {!terminal ? (
        <button className="danger-ghost" disabled={Boolean(busy)} onClick={cancel}>
          {busy === "cancel" ? "Cancelling…" : "Cancel task"}
        </button>
      ) : null}
      {error ? <div className="operator-error">{error}</div> : null}
    </div>
  );
}
