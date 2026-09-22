"use client";

import { useState } from "react";

type Plan = "assistant" | "operator" | "concierge";

export default function BillingButtons({ plan }: { plan: Plan }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function checkout() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const payload = await response.json() as { url?: string; error?: string };
      if (!response.ok || !payload.url) throw new Error(payload.error ?? "Unable to start checkout.");
      window.location.assign(payload.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start checkout.");
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={checkout} disabled={busy}>
        {busy ? "Opening checkout…" : "Choose plan"}
      </button>
      {error ? <div className="operator-error">{error}</div> : null}
    </div>
  );
}
