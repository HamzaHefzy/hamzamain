"use client";

import { FormEvent, useState } from "react";

export default function WorkspacePrivacyActions({ orgSlug }: { orgSlug: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/operator/privacy/delete-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: form.get("password"),
          confirmation: form.get("confirmation"),
        }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to delete workspace.");
      window.location.assign("/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to delete workspace.");
      setBusy(false);
    }
  }

  return (
    <>
      <section className="operator-section">
        <div className="operator-section-heading">
          <div>
            <span className="operator-kicker">Portability</span>
            <h2>Export your Operator data</h2>
          </div>
        </div>
        <p className="operator-privacy-copy">
          Download the workspace record as JSON, including tasks, contacts, memories,
          routines, approvals, activity, and billing metadata. Passwords, reset tokens,
          callback credentials, and provider secrets are never included.
        </p>
        <a className="operator-download-button" href="/api/operator/privacy/export">
          Download workspace export
        </a>
      </section>

      <section className="operator-section operator-danger-zone">
        <div className="operator-section-heading">
          <div>
            <span className="operator-kicker">Danger zone</span>
            <h2>Delete this workspace</h2>
          </div>
        </div>
        <p className="operator-privacy-copy">
          This permanently deletes the workspace and its operational history. If a Stripe
          subscription is active, Operator cancels it before deleting any data.
        </p>
        <form className="operator-delete-form" onSubmit={remove}>
          <label>
            <span>Type workspace slug</span>
            <input name="confirmation" required autoComplete="off" placeholder={orgSlug} />
            <small>{orgSlug}</small>
          </label>
          <label>
            <span>Current password</span>
            <input name="password" type="password" required autoComplete="current-password" />
          </label>
          <button type="submit" disabled={busy}>
            {busy ? "Deleting…" : "Permanently delete workspace"}
          </button>
          {error ? <div className="operator-error">{error}</div> : null}
        </form>
      </section>
    </>
  );
}
