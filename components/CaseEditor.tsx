"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Member = { id: string; name: string; email: string; role: string };
type Commitment = {
  id: string;
  description: string;
  status: string;
  due_at: string | null;
  verified_at: string | null;
  verification_note: string | null;
  owner_name: string | null;
};

export default function CaseEditor(props: {
  caseId: string;
  caseNumber: string;
  status: string;
  queue: string;
  priority: string;
  ownerUserId: string | null;
  nextAction: string | null;
  dueAt: string | null;
  members: Member[];
  commitments: Commitment[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Saving…");
    const form = new FormData(event.currentTarget);
    const due = String(form.get("dueAt") ?? "");

    const response = await fetch("/api/cases/" + encodeURIComponent(props.caseNumber), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: form.get("status"),
        queue: form.get("queue"),
        priority: form.get("priority"),
        ownerUserId: form.get("ownerUserId") || null,
        nextAction: form.get("nextAction") || null,
        dueAt: due ? new Date(due).toISOString() : null,
        note: form.get("note") || null,
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error ?? "Update failed.");
      return;
    }
    setMessage("Saved.");
    router.refresh();
  }

  async function addCommitment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Adding commitment…");
    const form = new FormData(event.currentTarget);
    const due = String(form.get("commitmentDue") ?? "");

    const response = await fetch(
      "/api/cases/" + encodeURIComponent(props.caseNumber) + "/commitments",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: form.get("description"),
          ownerUserId: form.get("commitmentOwner") || undefined,
          dueAt: due ? new Date(due).toISOString() : undefined,
        }),
      },
    );
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? "Unable to add commitment.");
      return;
    }
    setMessage("Commitment added.");
    event.currentTarget.reset();
    router.refresh();
  }

  async function verify(commitmentId: string) {
    const note = window.prompt("What confirms this commitment was completed?");
    if (!note) return;
    setMessage("Verifying…");

    const response = await fetch(
      "/api/cases/" + encodeURIComponent(props.caseNumber) + "/commitments/" + commitmentId,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationNote: note }),
      },
    );
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? "Unable to verify commitment.");
      return;
    }
    setMessage("Commitment verified.");
    router.refresh();
  }

  const datetimeLocal = props.dueAt ? props.dueAt.slice(0, 16) : "";

  return (
    <div className="case-editor-stack">
      <form className="detail-card case-editor" onSubmit={update}>
        <div className="eyebrow">Case control</div>
        <h2>Ownership and next action</h2>
        <div className="form-grid two">
          <label><span>Status</span><select name="status" defaultValue={props.status}><option value="open">Open</option><option value="in_progress">In progress</option><option value="waiting">Waiting</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></label>
          <label><span>Queue</span><select name="queue" defaultValue={props.queue}><option value="do_now">Do now</option><option value="stuck">Stuck</option><option value="check_outcome">Check outcome</option><option value="resolved">Resolved</option></select></label>
          <label><span>Priority</span><select name="priority" defaultValue={props.priority}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
          <label><span>Owner</span><select name="ownerUserId" defaultValue={props.ownerUserId ?? ""}><option value="">Unassigned</option>{props.members.map((member) => <option key={member.id} value={member.id}>{member.name} · {member.role}</option>)}</select></label>
          <label><span>Due</span><input name="dueAt" type="datetime-local" defaultValue={datetimeLocal} /></label>
        </div>
        <label><span>Next action</span><textarea name="nextAction" rows={3} defaultValue={props.nextAction ?? ""} /></label>
        <label><span>Update note</span><textarea name="note" rows={2} placeholder="What changed?" /></label>
        <button className="primary-link" type="submit">Save case</button>
      </form>

      <form className="detail-card case-editor" onSubmit={addCommitment}>
        <div className="eyebrow">Commitment</div>
        <h2>Make the handoff explicit</h2>
        <label><span>What will happen?</span><textarea name="description" required rows={3} /></label>
        <div className="form-grid two">
          <label><span>Owner</span><select name="commitmentOwner" defaultValue={props.ownerUserId ?? ""}><option value="">Current user</option>{props.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
          <label><span>Due</span><input name="commitmentDue" type="datetime-local" /></label>
        </div>
        <button className="secondary-link" type="submit">Add commitment</button>
      </form>

      <section className="detail-card">
        <div className="eyebrow">Verification ledger</div>
        <h2>Commitments</h2>
        <div className="case-stack">
          {props.commitments.length ? props.commitments.map((commitment) => (
            <article className="case-card" key={commitment.id}>
              <div className="case-topline"><strong>{commitment.owner_name ?? "Unassigned"}</strong><span>{commitment.status}</span></div>
              <h3>{commitment.description}</h3>
              <p>{commitment.due_at ? "Due " + new Date(commitment.due_at).toLocaleString() : "No due date"}</p>
              {commitment.verification_note ? <p><strong>Verified:</strong> {commitment.verification_note}</p> : null}
              {commitment.status !== "completed" ? <button className="case-action" type="button" onClick={() => verify(commitment.id)}>Verify completion</button> : null}
            </article>
          )) : <p className="muted-copy">No commitments yet.</p>}
        </div>
      </section>
      {message ? <small className="editor-message">{message}</small> : null}
    </div>
  );
}
