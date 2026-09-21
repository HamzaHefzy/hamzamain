"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Member = { id: string; name: string; role: string };

export default function IncidentActions(props: {
  incidentId: string;
  status: string;
  incidentType: string;
  ownerUserId: string | null;
  members: Member[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Saving…");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/recovery/incidents/" + props.incidentId, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: form.get("status"),
        incidentType: form.get("incidentType"),
        ownerUserId: form.get("ownerUserId") || null,
        resolutionNote: form.get("resolutionNote") || null,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? "Unable to update incident.");
      return;
    }
    setMessage("Incident updated.");
    router.refresh();
  }

  return (
    <form className="incident-actions" onSubmit={submit}>
      <select name="incidentType" defaultValue={props.incidentType} aria-label="Incident type">
        <option value="mass_nonparticipation">Mass nonparticipation</option>
        <option value="link_failure">Broken class link</option>
        <option value="platform_outage">Platform outage</option>
        <option value="teacher_issue">Teacher / session issue</option>
        <option value="unknown">Unknown</option>
      </select>
      <select name="status" defaultValue={props.status} aria-label="Incident status">
        <option value="open">Open</option>
        <option value="investigating">Investigating</option>
        <option value="resolved">Resolved</option>
        <option value="dismissed">Dismissed</option>
      </select>
      <select name="ownerUserId" defaultValue={props.ownerUserId ?? ""} aria-label="Incident owner">
        <option value="">Unassigned</option>
        {props.members.map((member) => (
          <option key={member.id} value={member.id}>{member.name}</option>
        ))}
      </select>
      <input name="resolutionNote" placeholder="Resolution / investigation note" />
      <button className="case-action" type="submit">Save</button>
      {message ? <small>{message}</small> : null}
    </form>
  );
}
