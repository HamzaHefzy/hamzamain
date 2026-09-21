"use client";

import { useState } from "react";

const barriers = [
  ["technology", "Technology or internet"],
  ["forgot", "I may forget or my schedule is confusing"],
  ["behind", "I’m behind or overwhelmed"],
  ["caregiving", "Work, caregiving, or a schedule conflict"],
  ["motivation", "I’m having trouble getting myself to attend"],
  ["health", "Health or wellness"],
  ["anxiety", "Anxiety or school avoidance"],
  ["transportation", "Transportation"],
  ["other", "Something else"],
] as const;

export default function DailyLaunchForm({ token }: { token: string }) {
  const [state, setState] = useState<"idle"|"busy"|"success"|"error">("idle");
  const [message, setMessage] = useState("");

  async function submit(responseValue: string, note?: string) {
    setState("busy");
    setMessage("");
    const response = await fetch("/api/launch/" + encodeURIComponent(token), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response: responseValue, note: note || undefined }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setState("error");
      setMessage(payload.error ?? "Unable to save your response.");
      return;
    }

    setState("success");
    setMessage(
      responseValue === "ready"
        ? "You’re set. Use the schedule above to enter class when it starts."
        : "Thanks. Your support team now has the barrier and a concrete next action.",
    );
  }

  if (state === "success") {
    return <div className="checkin-success">{message}</div>;
  }

  return (
    <div className="daily-launch-form">
      <button
        type="button"
        className="m-button dark daily-ready-button"
        disabled={state === "busy"}
        onClick={() => submit("ready")}
      >
        I’m ready for today
      </button>

      <details className="daily-help">
        <summary>I need help before class</summary>
        <form
          className="checkin-form"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            void submit(String(data.get("response")), String(data.get("note") ?? ""));
          }}
        >
          <fieldset>
            <legend>What could get in the way today?</legend>
            {barriers.map(([value, label]) => (
              <label className="checkin-option" key={value}>
                <input type="radio" name="response" value={value} required />
                <span>{label}</span>
              </label>
            ))}
          </fieldset>
          <label>
            <span>Anything useful for the support team? <small>Optional. Do not include private medical details.</small></span>
            <textarea name="note" rows={3} maxLength={1000} />
          </label>
          <button className="secondary-link" type="submit" disabled={state === "busy"}>
            {state === "busy" ? "Sending…" : "Ask for help"}
          </button>
        </form>
      </details>

      {state === "error" ? <div className="form-error">{message}</div> : null}
    </div>
  );
}
