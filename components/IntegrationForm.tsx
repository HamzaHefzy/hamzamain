"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function IntegrationForm() {
  const router = useRouter();
  const [status, setStatus] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Saving…");
    const form = new FormData(event.currentTarget);

    const response = await fetch("/api/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "oneroster",
        name: String(form.get("name")),
        publicConfig: {
          baseUrl: String(form.get("baseUrl")),
          tokenUrl: String(form.get("tokenUrl")),
          scope: String(form.get("scope") ?? ""),
        },
        secrets: {
          clientId: String(form.get("clientId")),
          clientSecret: String(form.get("clientSecret")),
        },
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error ?? "Unable to save OneRoster connection.");
      return;
    }

    setStatus("OneRoster connection saved. Credentials are encrypted at rest.");
    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form className="integration-form" onSubmit={submit}>
      <div className="disclaimer">
        <strong>Enabled connector:</strong> OneRoster roster sync. CSV ingestion remains available under Attendance.
        PowerSchool, Infinite Campus, Skyward, and LMS-specific adapters are not marketed as live connectors until a tested adapter exists.
      </div>
      <label><span>Connection name</span><input name="name" required placeholder="District OneRoster production" /></label>
      <label><span>OneRoster base URL</span><input name="baseUrl" type="url" required placeholder="https://sis.example.org/ims/oneroster/rostering/v1p2" /></label>
      <label><span>OAuth token URL</span><input name="tokenUrl" type="url" required placeholder="https://sis.example.org/oauth/token" /></label>
      <label><span>OAuth scope <small>Optional if your provider does not require it</small></span><input name="scope" placeholder="oneroster.readonly" /></label>
      <label><span>Client ID</span><input name="clientId" required autoComplete="off" /></label>
      <label><span>Client secret</span><input name="clientSecret" type="password" required autoComplete="new-password" /></label>
      <button className="secondary-link" type="submit">Save OneRoster connection</button>
      {status ? <small>{status}</small> : null}
    </form>
  );
}
