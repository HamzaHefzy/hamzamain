"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function PhoneIdentityForm({
  ownerPhone,
  assistantPhone,
  notifyEmail,
  notifySms,
  homeBase,
}: {
  ownerPhone: string | null;
  assistantPhone: string | null;
  notifyEmail: boolean;
  notifySms: boolean;
  homeBase: string | null;
}) {
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
        body: JSON.stringify({
          ownerPhone: raw || null,
          notifyEmail: data.get("notifyEmail") === "on",
          notifySms: data.get("notifySms") === "on",
          homeBase: String(data.get("homeBase") ?? "").trim() || null,
        }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to save Operator settings.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save Operator settings.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="operator-phone-form" onSubmit={submit}>
      <div>
        <span className="operator-kicker">Communications</span>
        <h2>Phone identity & alerts</h2>
        <p>Your linked phone secures text-to-Operator. Notifications tell you when a task needs approval, completes, or fails.</p>
      </div>
      <label>
        <span>Home base</span>
        <input name="homeBase" defaultValue={homeBase ?? ""} placeholder="Durham, NC or your neighborhood" />
      </label>
      <label>
        <span>Your phone</span>
        <input name="ownerPhone" defaultValue={ownerPhone ?? ""} placeholder="+19195551234" pattern="\+[1-9][0-9]{7,14}" />
      </label>
      <label>
        <span>Operator number</span>
        <input value={assistantPhone ?? "Connect Twilio to assign"} readOnly />
      </label>
      <div className="operator-notification-options">
        <label className="operator-check">
          <input name="notifyEmail" type="checkbox" defaultChecked={notifyEmail} />
          <span>Email task updates</span>
        </label>
        <label className="operator-check">
          <input name="notifySms" type="checkbox" defaultChecked={notifySms} />
          <span>SMS task updates</span>
        </label>
      </div>
      <button type="submit" disabled={busy}>{busy ? "Saving…" : "Save settings"}</button>
      {error ? <div className="operator-error">{error}</div> : null}
    </form>
  );
}
