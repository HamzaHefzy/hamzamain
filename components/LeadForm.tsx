"use client";

import { FormEvent, useState } from "react";

export default function LeadForm() {
  const [state, setState] = useState<"idle" | "busy" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("busy");
    setMessage("");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        organization: form.get("organization"),
        role: form.get("role") || undefined,
        enrollment: form.get("enrollment") || undefined,
        state: form.get("state") || undefined,
        interest: form.get("interest"),
        message: form.get("message") || undefined,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setState("error");
      setMessage(payload.error ?? "Unable to submit request.");
      return;
    }

    setState("success");
    setMessage("Thanks — your request is in. We’ll use the information you shared to prepare a focused attendance workflow review.");
    event.currentTarget.reset();
  }

  return (
    <form className="lead-form" onSubmit={submit}>
      <div className="form-grid two">
        <label><span>Name</span><input name="name" required /></label>
        <label><span>Work email</span><input name="email" type="email" required /></label>
        <label><span>School system / organization</span><input name="organization" required /></label>
        <label><span>Role</span><input name="role" placeholder="CFO, Attendance Director, COO…" /></label>
        <label><span>Enrollment</span><input name="enrollment" type="number" min="0" /></label>
        <label><span>State</span><input name="state" placeholder="TX" /></label>
      </div>
      <label>
        <span>Primary need</span>
        <select name="interest" defaultValue="pilot">
          <option value="pilot">Attendance-resolution pilot</option>
          <option value="district_attendance">District attendance operations</option>
          <option value="virtual_schools">Virtual school participation</option>
          <option value="funding">Attendance-linked funding visibility</option>
          <option value="resolutionos">Barrier resolution / ResolutionOS</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label>
        <span>What is breaking today?</span>
        <textarea name="message" rows={5} placeholder="Example: we have attendance data, but cases are managed across spreadsheets and follow-up is inconsistent." />
      </label>
      {message ? <div className={state === "success" ? "form-success" : "form-error"}>{message}</div> : null}
      <button className="m-button dark" type="submit" disabled={state === "busy"}>
        {state === "busy" ? "Submitting…" : "Request a working session"}
      </button>
    </form>
  );
}
