"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Account = { id: string; app: string; name: string };

const featured = [
  ["gmail", "Gmail"],
  ["google_calendar", "Google Calendar"],
  ["google_drive", "Google Drive"],
  ["google_sheets", "Google Sheets"],
  ["google_docs", "Google Docs"],
  ["slack", "Slack"],
  ["notion", "Notion"],
  ["todoist", "Todoist"],
  ["microsoft_outlook", "Outlook"],
  ["microsoft_onedrive", "OneDrive"],
  ["microsoft_teams", "Microsoft Teams"],
  ["dropbox", "Dropbox"],
  ["github", "GitHub"],
  ["airtable", "Airtable"],
  ["spotify", "Spotify"],
] as const;

export default function IntegrationHub({
  connected,
}: {
  connected: Account[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function connect(app: string) {
    setBusy("connect:" + app);
    setError("");
    try {
      const response = await fetch("/api/operator/integrations/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app }),
      });
      const payload = await response.json() as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Unable to open app connection.");
      }
      window.location.assign(payload.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to open app connection.");
      setBusy("");
    }
  }

  async function customConnect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const app = String(form.get("app") ?? "").trim();
    if (app) await connect(app);
  }

  async function disconnect(account: Account) {
    if (!window.confirm("Disconnect " + account.name + " from the assistant?")) return;
    setBusy("delete:" + account.id);
    setError("");
    try {
      const response = await fetch(
        "/api/operator/integrations/accounts?id=" + encodeURIComponent(account.id),
        { method: "DELETE" },
      );
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to disconnect app.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to disconnect app.");
    } finally {
      setBusy("");
    }
  }

  const connectedApps = new Set(connected.map((account) => account.app));

  return (
    <div className="operator-integration-hub">
      <div className="operator-featured-apps">
        {featured.map(([slug, name]) => (
          <button
            type="button"
            key={slug}
            className={connectedApps.has(slug) ? "connected" : ""}
            disabled={Boolean(busy)}
            onClick={() => connect(slug)}
          >
            <span>{name}</span>
            <small>{connectedApps.has(slug) ? "Connected" : "Connect"}</small>
          </button>
        ))}
      </div>

      <form className="operator-custom-app" onSubmit={customConnect}>
        <div>
          <strong>Connect another Pipedream app</strong>
          <span>Use any app slug from Pipedream’s integration catalog.</span>
        </div>
        <input name="app" required pattern="[a-z0-9_-]+" placeholder="e.g. hubspot" />
        <button type="submit" disabled={Boolean(busy)}>
          {busy.startsWith("connect:") ? "Opening…" : "Connect"}
        </button>
      </form>

      {connected.length ? (
        <div className="operator-connected-accounts">
          {connected.map((account) => (
            <article key={account.id}>
              <div>
                <strong>{account.name}</strong>
                <span>{account.app}</span>
              </div>
              <button
                type="button"
                className="ghost"
                disabled={Boolean(busy)}
                onClick={() => disconnect(account)}
              >
                {busy === "delete:" + account.id ? "Disconnecting…" : "Disconnect"}
              </button>
            </article>
          ))}
        </div>
      ) : null}

      {error ? <div className="operator-error">{error}</div> : null}
    </div>
  );
}
