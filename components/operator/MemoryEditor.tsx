"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function MemoryEditor() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/operator/memories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: form.get("key"),
          value: form.get("value"),
          sensitivity: form.get("sensitivity"),
        }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to save memory.");
      event.currentTarget.reset();
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save memory.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="operator-memory-form" onSubmit={submit}>
      <label>
        <span>Memory key</span>
        <input name="key" required maxLength={80} placeholder="dining_preferences" pattern="[A-Za-z0-9][A-Za-z0-9_-]*" />
      </label>
      <label className="wide">
        <span>What Operator should remember</span>
        <textarea name="value" required maxLength={2000} placeholder="I prefer quieter restaurants, outdoor seating when weather is good, and reservations after 7 PM." />
      </label>
      <label>
        <span>Privacy</span>
        <select name="sensitivity" defaultValue="normal">
          <option value="normal">Normal — may inform planner</option>
          <option value="private">Private — local by default</option>
          <option value="restricted">Restricted — never sent to planner</option>
        </select>
      </label>
      <button disabled={busy} type="submit">{busy ? "Saving…" : "Remember this"}</button>
      {error ? <div className="operator-error">{error}</div> : null}
    </form>
  );
}

export function DeleteMemoryButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    const response = await fetch("/api/operator/memories/" + id, { method: "DELETE" });
    if (response.ok) router.refresh();
    else setBusy(false);
  }

  return <button className="ghost" type="button" disabled={busy} onClick={remove}>{busy ? "Removing…" : "Forget"}</button>;
}
