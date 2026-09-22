"use client";

import { useEffect, useMemo, useState } from "react";

type Scenario = {
  id: string;
  label: string;
  request: string;
  budget?: string;
  steps: Array<{
    icon: string;
    title: string;
    detail: string;
    type: "work" | "approval" | "done";
  }>;
};

const scenarios: Scenario[] = [
  {
    id: "dentist",
    label: "Book a dentist",
    request: "Find my dentist, get the earliest cleaning after 2 PM next week, keep it under $200, and put it on my calendar.",
    budget: "$200 max",
    steps: [
      { icon: "M", title: "Found Triangle Dental", detail: "Google Maps verified address, website, rating, and phone number.", type: "work" },
      { icon: "☎", title: "Called the office", detail: "Earliest match: Tuesday at 3:30 PM · estimated $165.", type: "work" },
      { icon: "!", title: "Ready to book", detail: "Yumna needs approval before committing to the appointment.", type: "approval" },
      { icon: "✓", title: "Booked + calendared", detail: "Confirmation saved and calendar updated.", type: "done" },
    ],
  },
  {
    id: "dinner",
    label: "Plan dinner",
    request: "Find a quiet Italian restaurant for four Friday at 7:30 near downtown, under $75 per person, and book the best option.",
    budget: "$300 max",
    steps: [
      { icon: "M", title: "Compared live options", detail: "Maps, ratings, distance, price level, and current availability.", type: "work" },
      { icon: "↗", title: "Best match found", detail: "Quiet room · 4.7★ · 0.8 mi away · 7:30 PM available.", type: "work" },
      { icon: "!", title: "Reservation ready", detail: "Yumna pauses before making the commitment.", type: "approval" },
      { icon: "✓", title: "Dinner handled", detail: "Reservation saved, party notified, calendar updated.", type: "done" },
    ],
  },
  {
    id: "cancel",
    label: "Cancel a service",
    request: "Cancel my gym membership, deal with the retention call, and make sure I get written confirmation.",
    steps: [
      { icon: "↗", title: "Account located", detail: "Yumna opened the provider workflow and prepared the cancellation.", type: "work" },
      { icon: "☎", title: "Handled the call", detail: "Waited on hold and declined the retention offer.", type: "work" },
      { icon: "↗", title: "Confirmation chased", detail: "Written cancellation receipt requested and tracked.", type: "work" },
      { icon: "✓", title: "Membership cancelled", detail: "Confirmation stored in your activity history.", type: "done" },
    ],
  },
];

export default function LivePhoneDemo({ large = false }: { large?: boolean }) {
  const [scenarioId, setScenarioId] = useState(scenarios[0].id);
  const [step, setStep] = useState(0);
  const [approved, setApproved] = useState(false);
  const [running, setRunning] = useState(true);

  const scenario = useMemo(
    () => scenarios.find((item) => item.id === scenarioId) ?? scenarios[0],
    [scenarioId],
  );

  useEffect(() => {
    setStep(0);
    setApproved(false);
    setRunning(true);
  }, [scenarioId]);

  useEffect(() => {
    if (!running) return;
    const current = scenario.steps[step];
    if (!current) return;
    if (current.type === "approval" && !approved) return;
    if (step >= scenario.steps.length - 1) {
      setRunning(false);
      return;
    }
    const timer = window.setTimeout(() => setStep((value) => value + 1), 1250);
    return () => window.clearTimeout(timer);
  }, [approved, running, scenario, step]);

  function restart() {
    setStep(0);
    setApproved(false);
    setRunning(true);
  }

  const visibleSteps = scenario.steps.slice(0, step + 1);
  const current = scenario.steps[step];

  return (
    <div className={"y-live-demo" + (large ? " large" : "")}>
      <div className="y-demo-scenarios" role="tablist" aria-label="Demo scenarios">
        {scenarios.map((item) => (
          <button
            key={item.id}
            className={item.id === scenario.id ? "active" : ""}
            onClick={() => setScenarioId(item.id)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="y-phone-shell">
        <div className="y-phone-hardware">
          <div className="y-phone-island" />
          <div className="y-phone-screen">
            <header className="y-phone-top">
              <div className="y-phone-mini-brand"><span>Y</span><strong>Yumna</strong></div>
              <span className="y-phone-live"><i /> live</span>
            </header>

            <div className="y-phone-thread">
              <div className="y-phone-user-message">
                <span>You</span>
                <p>{scenario.request}</p>
                {scenario.budget ? <small>{scenario.budget}</small> : null}
              </div>

              <div className="y-phone-assistant-head">
                <span>Y</span>
                <div><strong>On it.</strong><small>I’ll only interrupt when you need to decide.</small></div>
              </div>

              <div className="y-phone-steps">
                {visibleSteps.map((item, index) => {
                  const isCurrent = index === step;
                  const waiting = item.type === "approval" && !approved;
                  const done = index < step || item.type === "done" && !running;
                  return (
                    <article key={item.title} className={waiting ? "waiting" : done ? "done" : isCurrent ? "active" : ""}>
                      <span className="y-step-icon">{done ? "✓" : item.icon}</span>
                      <div>
                        <strong>{item.title}</strong>
                        <small>{item.detail}</small>
                      </div>
                      {isCurrent && item.type === "work" ? <span className="y-pulse-dots"><i /><i /><i /></span> : null}
                    </article>
                  );
                })}
              </div>

              {current?.type === "approval" && !approved ? (
                <div className="y-phone-approval">
                  <div><strong>Approve this step?</strong><small>Nothing is committed until you say yes.</small></div>
                  <div>
                    <button type="button" className="secondary" onClick={restart}>Not now</button>
                    <button type="button" onClick={() => { setApproved(true); setRunning(true); }}>Approve</button>
                  </div>
                </div>
              ) : null}

              {!running && step === scenario.steps.length - 1 ? (
                <div className="y-phone-complete">
                  <span>✓</span>
                  <div><strong>Done.</strong><small>Task activity and receipts are saved.</small></div>
                  <button type="button" onClick={restart}>Replay</button>
                </div>
              ) : null}
            </div>

            <div className="y-phone-home-indicator" />
          </div>
        </div>

        {large ? (
          <aside className="y-demo-sidecar">
            <span className="y-eyebrow">What is happening</span>
            <h2>One request becomes a governed workflow.</h2>
            <div className="y-demo-sidecar-list">
              <div><span>01</span><p><strong>Resolve context</strong>Private memory, contacts, home base, and connected apps.</p></div>
              <div><span>02</span><p><strong>Use the best execution path</strong>Maps/API first, then browser, voice, or human escalation.</p></div>
              <div><span>03</span><p><strong>Pause at real decisions</strong>Money, commitments, account changes, or anything outside your authority rules.</p></div>
              <div><span>04</span><p><strong>Keep ownership</strong>Callbacks, follow-up, notifications, audit trail, and completion.</p></div>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
