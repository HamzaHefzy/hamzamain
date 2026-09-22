"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function PhoneIdentityForm({ ownerPhone, assistantPhone }: { ownerPhone: string | null; assistantPhone: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const raw = String(data.get("ownerPhone") ?? "").trim();

    try {
      const response = await fetch("/api/operator/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerPhone: raw || null }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to save phone identity.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save phone identity.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="operator-phone-form" onSubmit={submit}>
      <div>
        <span className="operator-kicker">Text-to-Operator identity</span>
        <h2>Link your phone</h2>
        <p>Only messages from this E.164 number can create tasks through the inbound SMS webhook.</p>
      </div>
      <label>
        <span>Your phone</span>
        <input name="ownerPhone" defaultValue={ownerPhone ?? ""} placeholder="+19195551234" pattern="\+[1-9][0-9]{7,14}" />
      </label>
      <label>
        <span>Operator number</span>
        <input value={assistantPhone ?? "Connect Twilio to assign"} readOnly />
      </label>
      <button type="submit" disabled={busy}>{busy ? "Saving…" : "Save identity"}</button>
      {error ? <div className="operator-error">{error}</div> : null}
    </form>
  );
}
