"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const examples = [
  "Find a highly rated dentist near me and get the phone number",
  "Call my internet provider and cancel the old plan",
  "Find dinner for four Friday around 7 PM",
  "Send a follow-up from my connected Gmail",
];

export default function QuickCommand() {
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const requestText = draft.trim();
    if (requestText.length < 4) return;

    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/operator/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: requestText,
          priority: "normal",
          budgetLimit: null,
          runImmediately: true,
        }),
      });
      const payload = await response.json() as { error?: string; task?: { id: string } };
      if (!response.ok) throw new Error(payload.error ?? "Unable to start task.");
      setOpen(false);
      setDraft("");
      if (payload.task?.id) router.push("/assistant/tasks/" + payload.task.id);
      else router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start task.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="app-command-trigger"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
        <span>Ask Yumna to handle something</span>
        <kbd>⌘K</kbd>
      </button>

      {open ? (
        <div className="app-command-layer" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}>
          <section className="app-command-dialog" role="dialog" aria-modal="true" aria-label="Quick task">
            <header>
              <div>
                <span className="operator-kicker">Quick delegation</span>
                <strong>What should Yumna take off your plate?</strong>
              </div>
              <button type="button" className="app-command-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
            </header>

            <form onSubmit={submit}>
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                minLength={4}
                maxLength={4000}
                placeholder="Describe the outcome. Yumna will plan the steps."
                aria-label="Task request"
              />
              <div className="app-command-examples">
                {examples.map((example) => (
                  <button key={example} type="button" onClick={() => setDraft(example)}>
                    {example}
                  </button>
                ))}
              </div>
              {error ? <div className="operator-error" role="alert">{error}</div> : null}
              <footer>
                <span>Consequential actions still follow your authority rules.</span>
                <button type="submit" disabled={busy || draft.trim().length < 4}>
                  {busy ? "Handing it over…" : "Start task"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
