"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCaseForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Creating…");
    const form = new FormData(event.currentTarget);

    const dueRaw = String(form.get("dueAt") ?? "");
    const response = await fetch("/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentExternalId: form.get("studentExternalId"),
        barrierCode: form.get("barrierCode"),
        barrierLabel: form.get("barrierLabel"),
        priority: form.get("priority"),
        nextAction: form.get("nextAction") || undefined,
        dueAt: dueRaw ? new Date(dueRaw).toISOString() : undefined,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error ?? "Unable to create case.");
      return;
    }

    setStatus("");
    setOpen(false);
    router.push("/cases/" + payload.case_number);
    router.refresh();
  }

  if (!open) {
    return <button className="primary-link" type="button" onClick={() => setOpen(true)}>Create case</button>;
  }

  return (
    <form className="case-create-form panel" onSubmit={submit}>
      <div className="panel-heading">
        <div><div className="eyebrow">New ResolutionOS case</div><h2>Create from a known student record</h2></div>
        <button className="text-link button-link" type="button" onClick={() => setOpen(false)}>Cancel</button>
      </div>
      <div className="form-grid two">
        <label><span>Student external ID</span><input name="studentExternalId" required /></label>
        <label><span>Priority</span><select name="priority" defaultValue="medium"><option>low</option><option>medium</option><option>high</option><option>urgent</option></select></label>
        <label><span>Barrier code</span><input name="barrierCode" required placeholder="transportation" /></label>
        <label><span>Barrier label</span><input name="barrierLabel" required placeholder="Transportation" /></label>
        <label><span>Due</span><input name="dueAt" type="datetime-local" /></label>
      </div>
      <label><span>Next action</span><textarea name="nextAction" rows={3} /></label>
      {status ? <small>{status}</small> : null}
      <button className="primary-link" type="submit">Create and open case</button>
    </form>
  );
}
