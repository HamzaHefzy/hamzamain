"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function IntegrationSyncButton(props: { id: string; provider: string }) {
  const router = useRouter();
  const [status, setStatus] = useState("");

  async function sync() {
    setStatus("Syncing…");
    const response = await fetch("/api/integrations/" + props.id + "/sync", {
      method: "POST",
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error ?? "Sync failed.");
      return;
    }

    const stats = payload.stats ?? {};
    setStatus(
      props.provider === "oneroster"
        ? "Synced " + (stats.studentsUpserted ?? 0) + " students and " +
          (stats.campusesUpserted ?? 0) + " organizations."
        : "Sync complete.",
    );
    router.refresh();
  }

  return (
    <div className="integration-sync">
      <button className="case-action" type="button" onClick={sync}>Sync now</button>
      {status ? <small>{status}</small> : null}
    </div>
  );
}
