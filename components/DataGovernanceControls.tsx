"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function DataGovernanceControls() {
  const router = useRouter();
  const [message, setMessage] = useState("");

  function externalId(form: FormData) {
    return String(form.get("externalId") ?? "").trim();
  }

  function exportStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const id = externalId(form);
    if (!id) return;
    setMessage("Preparing audited export…");
    window.location.assign("/api/students/" + encodeURIComponent(id) + "/export");
  }

  async function setActive(event: FormEvent<HTMLFormElement>, active: boolean) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const id = externalId(form);
    if (!id) return;

    setMessage(active ? "Restoring student…" : "Removing student from active operations…");
    const response = await fetch("/api/students/" + encodeURIComponent(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to update student status.");
      return;
    }

    setMessage(active
      ? "Student restored to active operations."
      : "Student removed from active operations; historical records were preserved.");
    router.refresh();
  }

  return (
    <div className="governance-grid">
      <form className="panel case-editor" onSubmit={exportStudent}>
        <div className="panel-heading">
          <div><div className="eyebrow">Record export</div><h2>Export one student’s Anchor record</h2></div>
        </div>
        <p className="muted-copy">
          The export includes roster fields, daily attendance, attendance events, virtual evidence,
          session participation, cases, commitments, check-ins, and notification history.
        </p>
        <label><span>Student external ID</span><input name="externalId" required /></label>
        <button className="primary-link" type="submit">Export JSON</button>
      </form>

      <form className="panel case-editor" onSubmit={(event) => void setActive(event, false)}>
        <div className="panel-heading">
          <div><div className="eyebrow">Roster status</div><h2>Remove from active operations</h2></div>
        </div>
        <p className="muted-copy">
          Deactivation stops the student from active roster workflows while preserving historical
          attendance and audit records. It is reversible and is not a legal deletion.
        </p>
        <label><span>Student external ID</span><input name="externalId" required /></label>
        <div className="operations-actions">
          <button className="secondary-link" type="submit">Deactivate</button>
          <button
            className="case-action"
            type="button"
            onClick={(event) => {
              const form = event.currentTarget.closest("form");
              if (form) void setActive({ preventDefault() {}, currentTarget: form } as unknown as FormEvent<HTMLFormElement>, true);
            }}
          >
            Restore
          </button>
        </div>
      </form>

      {message ? <div className="disclaimer governance-message">{message}</div> : null}
    </div>
  );
}
