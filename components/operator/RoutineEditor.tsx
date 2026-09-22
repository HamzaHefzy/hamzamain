"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function RoutineEditor() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const local = String(form.get("firstRunAt") ?? "");

    try {
      const firstRunAt = new Date(local);
      if (!Number.isFinite(firstRunAt.getTime())) throw new Error("Choose a valid first run time.");
      const response = await fetch("/api/operator/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"),
          request: form.get("request"),
          cadence: form.get("cadence"),
          firstRunAt: firstRunAt.toISOString(),
        }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to create routine.");
      event.currentTarget.reset();
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create routine.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="operator-routine-form" onSubmit={submit}>
      <label><span>Name</span><input name="title" required maxLength={120} placeholder="Friday dinner plan" /></label>
      <label><span>Cadence</span><select name="cadence" defaultValue="weekly"><option value="daily">Daily</option><option value="weekly">Weekly</option></select></label>
      <label><span>First run</span><input name="firstRunAt" type="datetime-local" required /></label>
      <label className="wide"><span>What Operator should do</span><textarea name="request" required maxLength={4000} placeholder="Every Friday, find a good dinner option for two near home and prepare a reservation for 7:30 PM under $120 total." /></label>
      <button disabled={busy} type="submit">{busy ? "Creating…" : "Create routine"}</button>
      {error ? <div className="operator-error">{error}</div> : null}
    </form>
  );
}

export function RoutineActions({ id, enabled }: { id: string; enabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");

  async function toggle() {
    setBusy("toggle");
    const response = await fetch("/api/operator/routines/" + id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !enabled }),
    });
    if (response.ok) router.refresh();
    else setBusy("");
  }

  async function remove() {
    setBusy("delete");
    const response = await fetch("/api/operator/routines/" + id, { method: "DELETE" });
    if (response.ok) router.refresh();
    else setBusy("");
  }

  return (
    <div className="operator-inline-actions">
      <button className="ghost" type="button" disabled={Boolean(busy)} onClick={toggle}>{busy === "toggle" ? "Updating…" : enabled ? "Pause" : "Resume"}</button>
      <button className="ghost" type="button" disabled={Boolean(busy)} onClick={remove}>{busy === "delete" ? "Deleting…" : "Delete"}</button>
    </div>
  );
}
