"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TaskActions({ taskId, status, approvals }: { taskId: string; status: string; approvals: Array<{ id: string; status: string }> }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function run() {
    setBusy("run"); setError("");
    try {
      const response = await fetch(`/api/operator/tasks/${taskId}/run`, { method: "POST" });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to run task.");
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to run task."); }
    finally { setBusy(""); }
  }

  async function decide(approvalId: string, decision: "approved" | "rejected") {
    setBusy(approvalId + decision); setError("");
    try {
      const response = await fetch(`/api/operator/approvals/${approvalId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to update approval.");
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update approval."); }
    finally { setBusy(""); }
  }

  const pending = approvals.filter((approval) => approval.status === "pending");
  return <div className="operator-task-actions">
    {pending.map((approval) => <div key={approval.id} className="operator-inline-actions"><button className="ghost" disabled={Boolean(busy)} onClick={() => decide(approval.id, "rejected")}>Decline</button><button disabled={Boolean(busy)} onClick={() => decide(approval.id, "approved")}>Approve step</button></div>)}
    {["ready","in_progress","waiting_external","failed"].includes(status) ? <button disabled={Boolean(busy)} onClick={run}>{busy === "run" ? "Running…" : "Run / retry"}</button> : null}
    {error ? <div className="operator-error">{error}</div> : null}
  </div>;
}
