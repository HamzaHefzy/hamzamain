"use client";

import { FormEvent, useState } from "react";

const options = [
  ["technology", "Technology or internet"],
  ["forgot", "I forgot / schedule confusion"],
  ["behind", "I’m too far behind or overwhelmed"],
  ["caregiving", "Work, caregiving, or schedule conflict"],
  ["motivation", "I didn’t feel able or motivated to join"],
  ["health", "Health or wellness"],
  ["other", "Something else"],
] as const;

export default function CheckinForm({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "busy" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("busy");
    setMessage("");
    const form = new FormData(event.currentTarget);

    const response = await fetch("/api/check-in/" + encodeURIComponent(token), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        barrier: form.get("barrier"),
        note: form.get("note") || undefined,
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setState("error");
      setMessage(payload.error ?? "Unable to submit your check-in.");
      return;
    }

    setState("success");
    setMessage("Thanks. Your school support team now has a specific next step instead of just an absence record.");
  }

  if (state === "success") {
    return <div className="checkin-success">{message}</div>;
  }

  return (
    <form className="checkin-form" onSubmit={submit}>
      <fieldset>
        <legend>What got in the way?</legend>
        {options.map(([value, label]) => (
          <label className="checkin-option" key={value}>
            <input type="radio" name="barrier" value={value} required />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>
      <label>
        <span>Anything else your school should know? <small>Optional. Do not include private medical details.</small></span>
        <textarea name="note" rows={4} maxLength={1000} />
      </label>
      {message ? <div className="form-error">{message}</div> : null}
      <button className="m-button dark" type="submit" disabled={state === "busy"}>
        {state === "busy" ? "Submitting…" : "Send check-in"}
      </button>
    </form>
  );
}
