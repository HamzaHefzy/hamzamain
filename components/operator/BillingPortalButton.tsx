"use client";

import { useState } from "react";

export default function BillingPortalButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function openPortal() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const payload = await response.json() as { url?: string; error?: string };
      if (!response.ok || !payload.url) throw new Error(payload.error ?? "Unable to open billing.");
      window.location.assign(payload.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to open billing.");
      setBusy(false);
    }
  }

  return (
    <div>
      <button className="ghost" type="button" onClick={openPortal} disabled={busy}>
        {busy ? "Opening…" : "Manage billing"}
      </button>
      {error ? <div className="operator-error">{error}</div> : null}
    </div>
  );
}
