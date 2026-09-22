"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function ContactEditor() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const aliases = String(form.get("aliases") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    try {
      const response = await fetch("/api/operator/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: form.get("displayName"),
          organization: String(form.get("organization") ?? "").trim() || null,
          phone: String(form.get("phone") ?? "").trim() || null,
          email: String(form.get("email") ?? "").trim() || null,
          aliases,
          notes: String(form.get("notes") ?? "").trim() || null,
        }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to save contact.");
      event.currentTarget.reset();
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save contact.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="operator-contact-form" onSubmit={submit}>
      <label><span>Name</span><input name="displayName" required maxLength={120} placeholder="Dr. Lee" /></label>
      <label><span>Organization</span><input name="organization" maxLength={120} placeholder="Triangle Dental" /></label>
      <label><span>Phone</span><input name="phone" placeholder="+19195551234" pattern="\+[1-9][0-9]{7,14}" /></label>
      <label><span>Email</span><input name="email" type="email" maxLength={320} placeholder="office@example.com" /></label>
      <label className="wide"><span>Aliases</span><input name="aliases" maxLength={400} placeholder="dentist, dental office, Dr Lee" /></label>
      <label className="wide"><span>Private notes</span><textarea name="notes" maxLength={1000} placeholder="Front desk handles scheduling. Closed Fridays." /></label>
      <button disabled={busy} type="submit">{busy ? "Saving…" : "Add contact"}</button>
      {error ? <div className="operator-error">{error}</div> : null}
    </form>
  );
}

export function DeleteContactButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!window.confirm("Delete this private contact?")) return;
    setBusy(true);
    const response = await fetch("/api/operator/contacts/" + id, { method: "DELETE" });
    if (response.ok) router.refresh();
    else setBusy(false);
  }

  return (
    <button className="ghost" type="button" disabled={busy} onClick={remove}>
      {busy ? "Deleting…" : "Delete"}
    </button>
  );
}
