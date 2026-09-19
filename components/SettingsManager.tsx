"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Campus = {
  id: string;
  name: string;
  code: string;
  delivery_model: string;
  active: boolean;
};

type Policy = {
  name: string;
  version: number;
  effective_from: string;
  config: {
    qualifyingEvidence?: string[];
    minimumMinutes?: number;
    allowAnyQualifyingEvidence?: boolean;
    dayCloseLocalTime?: string;
  };
} | null;

const evidence = [
  ["lms_progress", "LMS progress"],
  ["teacher_interaction", "Teacher interaction"],
  ["assignment_submission", "Assignment submission"],
  ["live_session", "Live session"],
  ["approved_offline_work", "Approved offline work"],
] as const;

export default function SettingsManager(props: { campuses: Campus[]; policy: Policy }) {
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function createCampus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Creating campus…");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/settings/campuses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        code: form.get("code"),
        deliveryModel: form.get("deliveryModel"),
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? "Unable to create campus.");
      return;
    }
    setMessage("Campus created.");
    event.currentTarget.reset();
    router.refresh();
  }

  async function setCampusActive(campus: Campus, active: boolean) {
    setMessage((active ? "Activating " : "Deactivating ") + campus.name + "…");
    const response = await fetch("/api/settings/campuses/" + campus.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? "Unable to update campus.");
      return;
    }
    setMessage("Campus updated.");
    router.refresh();
  }

  async function savePolicy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Saving a new policy version…");
    const form = new FormData(event.currentTarget);
    const qualifyingEvidence = evidence
      .map(([value]) => value)
      .filter((value) => form.get(value) === "on");

    const response = await fetch("/api/settings/virtual-policy", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("policyName"),
        qualifyingEvidence,
        minimumMinutes: Number(form.get("minimumMinutes") || 0),
        allowAnyQualifyingEvidence: true,
        dayCloseLocalTime: form.get("dayCloseLocalTime"),
        effectiveFrom: form.get("effectiveFrom"),
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? "Unable to save virtual policy.");
      return;
    }
    setMessage("Virtual attendance policy version " + payload.version + " is active.");
    router.refresh();
  }

  const selected = new Set(props.policy?.config.qualifyingEvidence ?? [
    "lms_progress",
    "teacher_interaction",
    "assignment_submission",
    "live_session",
    "approved_offline_work",
  ]);

  return (
    <div className="page-stack">
      <section className="two-column">
        <article className="panel">
          <div className="panel-heading"><div><div className="eyebrow">Campuses</div><h2>Organization structure</h2></div></div>
          <div className="case-stack">
            {props.campuses.length ? props.campuses.map((campus) => (
              <div className="case-card" key={campus.id}>
                <div className="case-topline"><strong>{campus.code}</strong><span>{campus.active ? "active" : "inactive"}</span></div>
                <h3>{campus.name}</h3>
                <p>{campus.delivery_model.replaceAll("_", " ")}</p>
                <button className="case-action" type="button" onClick={() => setCampusActive(campus, !campus.active)}>
                  {campus.active ? "Deactivate" : "Activate"}
                </button>
              </div>
            )) : <p className="muted-copy">No campuses configured yet.</p>}
          </div>
        </article>

        <form className="panel case-editor" onSubmit={createCampus}>
          <div className="panel-heading"><div><div className="eyebrow">New campus</div><h2>Add an operating unit</h2></div></div>
          <label><span>Campus name</span><input name="name" required /></label>
          <label><span>Campus code</span><input name="code" required placeholder="NORTH" /></label>
          <label>
            <span>Delivery model</span>
            <select name="deliveryModel" defaultValue="in_person">
              <option value="in_person">In person</option>
              <option value="virtual_program">Virtual program</option>
              <option value="virtual_campus">Virtual campus</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </label>
          <button className="secondary-link" type="submit">Create campus</button>
        </form>
      </section>

      <form className="panel case-editor" onSubmit={savePolicy}>
        <div className="panel-heading">
          <div>
            <div className="eyebrow">Virtual attendance policy</div>
            <h2>Define what evidence can support participation.</h2>
          </div>
          <span className="data-badge">{props.policy ? "Version " + props.policy.version : "Not configured"}</span>
        </div>
        <p className="muted-copy">
          Each save creates a new version and deactivates the previous version. Configure this with your school’s approved attendance-accounting policy; Anchor preserves the evidence behind each decision.
        </p>
        <div className="form-grid two">
          <label><span>Policy name</span><input name="policyName" defaultValue={props.policy?.name ?? "Virtual participation policy"} required /></label>
          <label><span>Effective from</span><input name="effectiveFrom" type="date" defaultValue={props.policy?.effective_from ?? new Date().toISOString().slice(0,10)} required /></label>
          <label><span>Minimum qualifying minutes</span><input name="minimumMinutes" type="number" min="0" max="1440" defaultValue={props.policy?.config.minimumMinutes ?? 0} /></label>
          <label><span>Day-close local time</span><input name="dayCloseLocalTime" type="time" defaultValue={props.policy?.config.dayCloseLocalTime ?? "23:59"} required /></label>
        </div>
        <fieldset className="policy-checks">
          <legend>Approved evidence types</legend>
          {evidence.map(([value, label]) => (
            <label key={value}><input type="checkbox" name={value} defaultChecked={selected.has(value)} /><span>{label}</span></label>
          ))}
        </fieldset>
        <button className="primary-link" type="submit">Save new policy version</button>
      </form>

      {message ? <div className="disclaimer">{message}</div> : null}
    </div>
  );
}
