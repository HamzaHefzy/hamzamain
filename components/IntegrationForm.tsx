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
    const provider = String(form.get("provider"));
    const baseUrl = String(form.get("baseUrl") ?? "");
    const token = String(form.get("token") ?? "");

    const response = await fetch("/api/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider,
        name: String(form.get("name")),
        publicConfig: baseUrl ? { baseUrl } : {},
        secrets: token ? { token } : undefined,
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setStatus(payload.error ?? "Unable to save integration.");
      return;
    }

    setStatus("Integration saved. Credentials are encrypted at rest.");
    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form className="integration-form" onSubmit={submit}>
      <label>
        <span>Provider</span>
        <select name="provider" defaultValue="csv">
          <option value="csv">Secure CSV / SFTP feed</option>
          <option value="canvas">Canvas</option>
          <option value="oneroster">OneRoster API</option>
          <option value="powerschool">PowerSchool</option>
          <option value="infinite_campus">Infinite Campus</option>
          <option value="skyward">Skyward</option>
        </select>
      </label>
      <label><span>Connection name</span><input name="name" required placeholder="District SIS production" /></label>
      <label><span>Base URL</span><input name="baseUrl" type="url" placeholder="https://..." /></label>
      <label><span>API token / secret</span><input name="token" type="password" autoComplete="off" /></label>
      <button className="secondary-link" type="submit">Save connection</button>
      {status ? <small>{status}</small> : null}
    </form>
  );
}
