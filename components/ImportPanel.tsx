"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Kind = "students" | "attendance" | "virtual_evidence" | "virtual_sessions";

const labels: Record<Kind, { title: string; description: string }> = {
  students: {
    title: "Student roster",
    description: "CSV columns: external_id, first_name, last_name, grade, campus_code, email, guardian_email",
  },
  attendance: {
    title: "Official attendance",
    description: "CSV columns: student_external_id, date, status, source, occurred_at, minutes, external_event_id",
  },
  virtual_evidence: {
    title: "Virtual participation evidence",
    description: "CSV columns: student_external_id, date, evidence_type, occurred_at, source, source_ref, minutes",
  },
  virtual_sessions: {
    title: "Virtual class schedule / participation",
    description: "CSV columns: student_external_id, session_external_id, title, starts_at, ends_at, source, live_url, required, participation_status, joined_at, left_at, minutes",
  },
};

export default function ImportPanel({ kind }: { kind: Kind }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string>("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setResult("");

    const form = new FormData(event.currentTarget);
    form.set("kind", kind);

    const response = await fetch("/api/imports", { method: "POST", body: form });
    const payload = await response.json();
    setBusy(false);

    if (!response.ok) {
      setResult(payload.error ?? "Import failed.");
      return;
    }

    setResult(
      "Imported " + payload.rowsSucceeded + " of " + payload.rowsTotal +
      " rows" + (payload.rowsFailed ? "; " + payload.rowsFailed + " rows need review." : "."),
    );
    formRef.current?.reset();
    router.refresh();
  }

  const copy = labels[kind];

  return (
    <form className="import-card" ref={formRef} onSubmit={submit}>
      <div>
        <strong>{copy.title}</strong>
        <p>{copy.description}</p>
      </div>
      <input name="file" type="file" accept=".csv,text/csv" required />
      <button className="secondary-link" type="submit" disabled={busy}>
        {busy ? "Importing…" : "Import CSV"}
      </button>
      {result ? <small className="import-result">{result}</small> : null}
    </form>
  );
}
