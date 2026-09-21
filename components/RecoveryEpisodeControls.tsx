"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Member = { id: string; name: string; role: string };

export default function RecoveryEpisodeControls(props: {
  episodeId: string;
  status: string;
  tier: string;
  ownerUserId: string | null;
  members: Member[];
  hasActivePlan: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Saving…");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/recovery/episodes/" + props.episodeId, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerUserId: form.get("ownerUserId") || null,
        tier: form.get("tier"),
        status: form.get("status"),
        note: form.get("note") || null,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? "Unable to update recovery episode.");
      return;
    }
    setMessage("Recovery episode updated.");
    router.refresh();
  }

  async function startPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Starting Return Plan…");
    const form = new FormData(event.currentTarget);
    const targetEvents = Number(form.get("targetEvents") || 5);
    const requiredSuccesses = Number(form.get("requiredSuccesses") || 4);

    const response = await fetch(
      "/api/recovery/episodes/" + props.episodeId + "/return-plan",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetEvents,
          requiredSuccesses,
          studentCommitment: form.get("studentCommitment") || undefined,
          schoolCommitment: form.get("schoolCommitment") || undefined,
          nextEvent: form.get("nextEvent") || undefined,
        }),
      },
    );
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? "Unable to start Return Plan.");
      return;
    }

    setMessage("Return Plan started. Recovery now depends on subsequent attendance.");
    router.refresh();
  }

  return (
    <div className="case-editor-stack">
      <form className="detail-card case-editor" onSubmit={update}>
        <div className="eyebrow">Episode control</div>
        <h2>Ownership and escalation</h2>
        <div className="form-grid two">
          <label>
            <span>Owner</span>
            <select name="ownerUserId" defaultValue={props.ownerUserId ?? ""}>
              <option value="">Unassigned</option>
              {props.members.map((member) => (
                <option key={member.id} value={member.id}>{member.name} · {member.role}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Tier</span>
            <select name="tier" defaultValue={props.tier}>
              <option value="automated">Automated</option>
              <option value="navigator">Navigator</option>
              <option value="multidisciplinary">Multidisciplinary</option>
            </select>
          </label>
          <label>
            <span>Status</span>
            <select name="status" defaultValue={props.status}>
              <option value="open">Open</option>
              <option value="stabilizing">Stabilizing</option>
              <option value="closed">Closed</option>
            </select>
          </label>
        </div>
        <label>
          <span>Operator note</span>
          <textarea name="note" rows={3} placeholder="What changed, and why?" />
        </label>
        <button className="primary-link" type="submit">Save episode</button>
      </form>

      <form className="detail-card case-editor" onSubmit={startPlan}>
        <div className="eyebrow">Return Plan</div>
        <h2>Define what stable attendance means</h2>
        {props.hasActivePlan ? (
          <div className="checkin-success">
            A Return Plan is already active. New attendance events will be evaluated automatically.
          </div>
        ) : (
          <>
            <div className="form-grid two">
              <label><span>Observe next events</span><input name="targetEvents" type="number" min="3" max="20" defaultValue="5" /></label>
              <label><span>Required successes</span><input name="requiredSuccesses" type="number" min="1" max="20" defaultValue="4" /></label>
            </div>
            <label><span>Student commitment</span><textarea name="studentCommitment" rows={2} placeholder="Example: Join Algebra before 8:30 for the next five sessions." /></label>
            <label><span>School commitment</span><textarea name="schoolCommitment" rows={2} placeholder="Example: Teacher sends a two-item re-entry plan before tomorrow morning." /></label>
            <label><span>Next instructional event</span><input name="nextEvent" placeholder="Example: Algebra · tomorrow 8:30 AM" /></label>
            <button className="secondary-link" type="submit">Start Return Plan</button>
          </>
        )}
      </form>
      {message ? <small className="editor-message">{message}</small> : null}
    </div>
  );
}
