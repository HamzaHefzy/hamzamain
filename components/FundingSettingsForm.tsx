"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function FundingSettingsForm(props: {
  schoolYear: string;
  basicAllotment: number | null;
  budgetedAttendanceRate: number | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Saving…");
    const form = new FormData(event.currentTarget);

    const response = await fetch("/api/funding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schoolYear: form.get("schoolYear"),
        modelType: "texas_ada",
        basicAllotment: form.get("basicAllotment") ? Number(form.get("basicAllotment")) : null,
        budgetedAttendanceRate: form.get("budgetedAttendanceRate")
          ? Number(form.get("budgetedAttendanceRate")) / 100
          : null,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error ?? "Save failed.");
      return;
    }
    setStatus("Saved.");
    router.refresh();
  }

  return (
    <form className="inline-settings-form" onSubmit={submit}>
      <label><span>School year</span><input name="schoolYear" defaultValue={props.schoolYear} required /></label>
      <label><span>Basic Allotment</span><input name="basicAllotment" type="number" step="0.01" defaultValue={props.basicAllotment ?? ""} /></label>
      <label><span>Budgeted attendance %</span><input name="budgetedAttendanceRate" type="number" step="0.01" min="0" max="100" defaultValue={props.budgetedAttendanceRate === null ? "" : (props.budgetedAttendanceRate * 100).toFixed(2)} /></label>
      <button className="secondary-link" type="submit">Save assumptions</button>
      <small>{status}</small>
    </form>
  );
}
