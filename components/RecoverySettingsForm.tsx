"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { RecoverySettings } from "@/lib/recovery-service";

export default function RecoverySettingsForm({ settings }: { settings: RecoverySettings }) {
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Saving recovery settings…");
    const form = new FormData(event.currentTarget);

    const response = await fetch("/api/settings/recovery", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dailyLaunchTime: form.get("dailyLaunchTime"),
        preclassReminderMinutes: Number(form.get("preclassReminderMinutes")),
        liveRescueMinutes: Number(form.get("liveRescueMinutes")),
        humanEscalationMinutes: Number(form.get("humanEscalationMinutes")),
        stabilizationEvents: Number(form.get("stabilizationEvents")),
        stabilizationRequiredSuccesses: Number(form.get("stabilizationRequiredSuccesses")),
        incidentMinMissing: Number(form.get("incidentMinMissing")),
        incidentMissingRate: Number(form.get("incidentMissingRate")) / 100,
        managedResolveEnabled: form.get("managedResolveEnabled") === "on",
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to save recovery settings.");
      return;
    }

    setMessage("Recovery settings saved.");
    router.refresh();
  }

  return (
    <form className="panel case-editor" onSubmit={submit}>
      <div className="panel-heading">
        <div>
          <div className="eyebrow">Attendance Recovery</div>
          <h2>Set the intervention clock.</h2>
        </div>
      </div>
      <p className="muted-copy">
        These settings control when Anchor acts, when a human takes over, how long recovery must remain stable, and when a class-wide pattern is treated as a school-side incident.
      </p>
      <div className="form-grid two">
        <label><span>Daily Launch time</span><input name="dailyLaunchTime" type="time" defaultValue={settings.dailyLaunchTime} required /></label>
        <label><span>Pre-class reminder · minutes</span><input name="preclassReminderMinutes" type="number" min="5" max="180" defaultValue={settings.preclassReminderMinutes} required /></label>
        <label><span>Live rescue after class starts · minutes</span><input name="liveRescueMinutes" type="number" min="1" max="60" defaultValue={settings.liveRescueMinutes} required /></label>
        <label><span>Human escalation after class starts · minutes</span><input name="humanEscalationMinutes" type="number" min="1" max="120" defaultValue={settings.humanEscalationMinutes} required /></label>
        <label><span>Return Plan events observed</span><input name="stabilizationEvents" type="number" min="3" max="20" defaultValue={settings.stabilizationEvents} required /></label>
        <label><span>Successful events required</span><input name="stabilizationRequiredSuccesses" type="number" min="1" max="20" defaultValue={settings.stabilizationRequiredSuccesses} required /></label>
        <label><span>Incident minimum missing students</span><input name="incidentMinMissing" type="number" min="2" max="1000" defaultValue={settings.incidentMinMissing} required /></label>
        <label><span>Incident missing-rate threshold %</span><input name="incidentMissingRate" type="number" min="10" max="100" step="1" defaultValue={Math.round(settings.incidentMissingRate * 100)} required /></label>
      </div>
      <label className="settings-check">
        <input name="managedResolveEnabled" type="checkbox" defaultChecked={settings.managedResolveEnabled} />
        <span>Managed Anchor Resolve coverage is enabled for this organization</span>
      </label>
      <button className="primary-link" type="submit">Save recovery settings</button>
      {message ? <small>{message}</small> : null}
    </form>
  );
}
