"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthorityEditor() {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); const form = new FormData(event.currentTarget); const maxSpend = String(form.get("maxSpend") ?? "").trim();
    try {
      const response = await fetch("/api/operator/authority", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domain: form.get("domain"), action: form.get("action"), enabled: true, policy: { mode: "allow", ...(maxSpend ? { maxSpend: Number(maxSpend), currency: "USD" } : {}) } }) });
      const payload = await response.json() as { error?: string }; if (!response.ok) throw new Error(payload.error ?? "Unable to save rule."); event.currentTarget.reset(); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save rule."); } finally { setBusy(false); }
  }
  return <form className="operator-authority-form" onSubmit={submit}>
    <label><span>Area</span><select name="domain" defaultValue="dining"><option value="dining">Dining</option><option value="appointments">Appointments</option><option value="travel">Travel</option><option value="administration">Administration</option><option value="calendar">Calendar</option><option value="communications">Communications</option><option value="general">General</option></select></label>
    <label><span>Action</span><select name="action" defaultValue="spend"><option value="spend">Spend / book</option><option value="call">Make calls</option><option value="write">Change calendar</option><option value="send">Send messages</option><option value="execute">Execute task</option></select></label>
    <label><span>Optional spend cap</span><div className="operator-money-input"><b>$</b><input name="maxSpend" inputMode="decimal" placeholder="e.g. 150" /></div></label>
    <button disabled={busy} type="submit">{busy ? "Saving…" : "Add authority"}</button>{error ? <div className="operator-error">{error}</div> : null}
  </form>;
}
