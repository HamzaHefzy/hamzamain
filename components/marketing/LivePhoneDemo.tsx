"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Logo from "@/components/Logo";

type DemoStep = {
  icon: string;
  title: string;
  detail: string;
  type: "work" | "approval" | "done";
};

type Scenario = {
  id: string;
  label: string;
  request: string;
  budget?: string;
  steps: DemoStep[];
};

const presets: Scenario[] = [
  {
    id: "dentist",
    label: "Book a dentist",
    request:
      "Find my dentist, get the earliest cleaning after 2 PM next week, keep it under $200, and put it on my calendar.",
    budget: "$200 max",
    steps: [
      {
        icon: "M",
        title: "Found Triangle Dental",
        detail: "Google Maps verified address, website, rating, and phone number.",
        type: "work",
      },
      {
        icon: "☎",
        title: "Called the office",
        detail: "Earliest match: Tuesday at 3:30 PM · estimated $165.",
        type: "work",
      },
      {
        icon: "!",
        title: "Ready to book",
        detail: "Yumna needs approval before committing to the appointment.",
        type: "approval",
      },
      {
        icon: "✓",
        title: "Booked + calendared",
        detail: "Confirmation saved and calendar updated.",
        type: "done",
      },
    ],
  },
  {
    id: "dinner",
    label: "Plan dinner",
    request:
      "Find a quiet Italian restaurant for four Friday at 7:30 near downtown, under $75 per person, and book the best option.",
    budget: "$300 max",
    steps: [
      {
        icon: "M",
        title: "Compared live options",
        detail: "Maps, ratings, distance, price level, and current availability.",
        type: "work",
      },
      {
        icon: "↗",
        title: "Best match found",
        detail: "Quiet room · 4.7★ · 0.8 mi away · 7:30 PM available.",
        type: "work",
      },
      {
        icon: "!",
        title: "Reservation ready",
        detail: "Yumna pauses before making the commitment.",
        type: "approval",
      },
      {
        icon: "✓",
        title: "Dinner handled",
        detail: "Reservation saved, party notified, calendar updated.",
        type: "done",
      },
    ],
  },
  {
    id: "cancel",
    label: "Cancel a service",
    request:
      "Cancel my gym membership, deal with the retention call, and make sure I get written confirmation.",
    steps: [
      {
        icon: "↗",
        title: "Account located",
        detail: "Yumna opened the provider workflow and prepared the cancellation.",
        type: "work",
      },
      {
        icon: "☎",
        title: "Handled the call",
        detail: "Waited on hold and declined the retention offer.",
        type: "work",
      },
      {
        icon: "↗",
        title: "Confirmation chased",
        detail: "Written cancellation receipt requested and tracked.",
        type: "work",
      },
      {
        icon: "✓",
        title: "Membership cancelled",
        detail: "Confirmation stored in your activity history.",
        type: "done",
      },
    ],
  },
];

export default function LivePhoneDemo({ large = false }: { large?: boolean }) {
  const [scenarioId, setScenarioId] = useState(presets[0].id);
  const [customScenario, setCustomScenario] = useState<Scenario | null>(null);
  const [step, setStep] = useState(0);
  const [approved, setApproved] = useState(false);
  const [running, setRunning] = useState(true);
  const [planning, setPlanning] = useState(false);
  const [demoError, setDemoError] = useState("");

  const scenario = useMemo(() => {
    if (scenarioId === "custom" && customScenario) return customScenario;
    return presets.find((item) => item.id === scenarioId) ?? presets[0];
  }, [customScenario, scenarioId]);

  useEffect(() => {
    setStep(0);
    setApproved(false);
    setRunning(true);
  }, [scenarioId, customScenario]);

  useEffect(() => {
    if (!running) return;
    const current = scenario.steps[step];
    if (!current) return;
    if (current.type === "approval" && !approved) return;
    if (step >= scenario.steps.length - 1) {
      setRunning(false);
      return;
    }

    const timer = window.setTimeout(
      () => setStep((value) => Math.min(value + 1, scenario.steps.length - 1)),
      current.type === "work" ? 1350 : 900,
    );
    return () => window.clearTimeout(timer);
  }, [approved, running, scenario, step]);

  function restart() {
    setStep(0);
    setApproved(false);
    setRunning(true);
  }

  async function planCustomTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const request = String(form.get("request") ?? "").trim();
    if (request.length < 4) return;

    setPlanning(true);
    setDemoError("");
    try {
      const response = await fetch("/api/demo/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request }),
      });
      const payload = await response.json() as {
        error?: string;
        request?: string;
        steps?: DemoStep[];
      };
      if (!response.ok || !payload.request || !payload.steps?.length) {
        throw new Error(payload.error ?? "Yumna could not plan that demo task.");
      }

      setCustomScenario({
        id: "custom",
        label: "Your task",
        request: payload.request,
        steps: payload.steps,
      });
      setScenarioId("custom");
    } catch (cause) {
      setDemoError(
        cause instanceof Error ? cause.message : "Yumna could not plan that demo task.",
      );
    } finally {
      setPlanning(false);
    }
  }

  const visibleSteps = scenario.steps.slice(0, step + 1);
  const current = scenario.steps[step];

  return (
    <div className={"y-live-demo" + (large ? " large" : "")}>
      <div className="y-demo-scenarios" role="tablist" aria-label="Demo scenarios">
        {presets.map((item) => (
          <button
            key={item.id}
            className={item.id === scenario.id ? "active" : ""}
            onClick={() => {
              setDemoError("");
              setScenarioId(item.id);
            }}
            type="button"
          >
            {item.label}
          </button>
        ))}
        {customScenario ? (
          <button
            className={scenario.id === "custom" ? "active custom" : "custom"}
            onClick={() => setScenarioId("custom")}
            type="button"
          >
            Your task
          </button>
        ) : null}
      </div>

      <div className="y-phone-shell">
        <div className="y-phone-hardware">
          <span className="y-phone-side-button top" />
          <span className="y-phone-side-button bottom" />
          <div className="y-phone-island" />
          <div className="y-phone-screen">
            <header className="y-phone-top">
              <div className="y-phone-mini-brand">
                <Logo markOnly className="y-phone-logo" />
                <strong>Yumna</strong>
              </div>
              <span className="y-phone-live"><i /> live</span>
            </header>

            <div className="y-phone-thread">
              <div className="y-phone-user-message">
                <span>You</span>
                <p>{scenario.request}</p>
                {scenario.budget ? <small>{scenario.budget}</small> : null}
              </div>

              <div className="y-phone-assistant-head">
                <Logo markOnly className="y-phone-logo assistant" />
                <div>
                  <strong>On it.</strong>
                  <small>I’ll only interrupt when you need to decide.</small>
                </div>
              </div>

              <div className="y-phone-steps" aria-live="polite">
                {visibleSteps.map((item, index) => {
                  const isCurrent = index === step;
                  const waiting = item.type === "approval" && !approved;
                  const done =
                    index < step ||
                    (item.type === "done" && !running && index === step);

                  return (
                    <article
                      key={item.title + index}
                      className={
                        waiting ? "waiting" : done ? "done" : isCurrent ? "active" : ""
                      }
                    >
                      <span className="y-step-icon">{done ? "✓" : item.icon}</span>
                      <div>
                        <strong>{item.title}</strong>
                        <small>{item.detail}</small>
                      </div>
                      {isCurrent && item.type === "work" ? (
                        <span className="y-pulse-dots" aria-label="Working">
                          <i /><i /><i />
                        </span>
                      ) : null}
                    </article>
                  );
                })}
              </div>

              {current?.type === "approval" && !approved ? (
                <div className="y-phone-approval">
                  <div>
                    <strong>Approve this step?</strong>
                    <small>Nothing is committed until you say yes.</small>
                  </div>
                  <div>
                    <button type="button" className="secondary" onClick={restart}>
                      Not now
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setApproved(true);
                        setRunning(true);
                      }}
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ) : null}

              {!running && step === scenario.steps.length - 1 ? (
                <div className="y-phone-complete">
                  <span>✓</span>
                  <div>
                    <strong>Done.</strong>
                    <small>Task activity and receipts are saved.</small>
                  </div>
                  <button type="button" onClick={restart}>Replay</button>
                </div>
              ) : null}
            </div>

            <form className="y-phone-compose" onSubmit={planCustomTask}>
              <input
                name="request"
                aria-label="Try your own task"
                placeholder="Try your own task…"
                maxLength={2000}
                disabled={planning}
              />
              <button type="submit" disabled={planning} aria-label="Plan this task">
                {planning ? <span className="y-compose-loader" /> : "↑"}
              </button>
            </form>
            {demoError ? <div className="y-phone-demo-error">{demoError}</div> : null}
            <div className="y-phone-home-indicator" />
          </div>
        </div>

        {large ? (
          <aside className="y-demo-sidecar">
            <span className="y-eyebrow">What is happening</span>
            <h2>One request becomes a governed workflow.</h2>
            <div className="y-demo-sidecar-list">
              <div>
                <span>01</span>
                <p><strong>Resolve context</strong>Private memory, contacts, home base, and connected apps.</p>
              </div>
              <div>
                <span>02</span>
                <p><strong>Use the best execution path</strong>Maps/API first, then browser, voice, or human escalation.</p>
              </div>
              <div>
                <span>03</span>
                <p><strong>Pause at real decisions</strong>Money, commitments, account changes, or anything outside your authority rules.</p>
              </div>
              <div>
                <span>04</span>
                <p><strong>Keep ownership</strong>Callbacks, follow-up, notifications, audit trail, and completion.</p>
              </div>
            </div>
            <div className="y-demo-live-note">
              <i />
              <div>
                <strong>The text box is live.</strong>
                <span>Type a task. The same safe deterministic planner used by the local product builds the workflow shown on the phone.</span>
              </div>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
