"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OperationsPanel() {
  const router = useRouter();
  const [status, setStatus] = useState("");

  async function run(job: "daily-launch" | "show-up" | "virtual-day-close") {
    setStatus(job === "daily-launch" ? "Running Daily Launch…" : job === "show-up" ? "Running show-up automation…" : "Running virtual day close…");
    const response = await fetch("/api/operations/" + job, { method: "POST" });
    const payload = await response.json();

    if (!response.ok) {
      setStatus(payload.error ?? "Operation failed.");
      return;
    }

    const result = payload.result ?? {};
    setStatus(
      job === "daily-launch"
        ? "Daily Launch complete: " + (result.created ?? 0) + " launches created, " +
          (result.sent ?? 0) + " delivered, " + (result.deliveryFailed ?? 0) + " awaiting another delivery path."
        : job === "show-up"
        ? "Show-Up complete: " + (result.reminders ?? 0) + " pre-class reminders, " +
          (result.liveRescues ?? 0) + " live rescue messages, " +
          (result.liveCasesCreated ?? 0) + " urgent live cases, " +
          (result.misses ?? 0) + " completed misses."
        : "Day close complete: " + (result.adjudicated ?? 0) + " adjudicated, " +
          (result.unresolved ?? 0) + " unresolved.",
    );
    router.refresh();
  }

  return (
    <div className="operations-panel">
      <div>
        <strong>Run attendance operations</strong>
        <p>Run the organization-scoped jobs immediately. Scheduled production runs use the protected cron endpoints.</p>
      </div>
      <div className="operations-actions">
        <button className="secondary-link" type="button" onClick={() => run("daily-launch")}>Run Daily Launch</button>
        <button className="secondary-link" type="button" onClick={() => run("show-up")}>Run Show-Up</button>
        <button className="secondary-link" type="button" onClick={() => run("virtual-day-close")}>Run virtual day close</button>
      </div>
      {status ? <small>{status}</small> : null}
    </div>
  );
}
