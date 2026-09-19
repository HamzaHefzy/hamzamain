"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ApiKeyRow = {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  active: boolean;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  createdBy: string | null;
};

type CreatedKey = {
  id: string;
  token: string;
  prefix: string;
  scopes: string[];
  expiresAt: string | null;
};

export default function ApiKeyManager({ apiKeys }: { apiKeys: ApiKeyRow[] }) {
  const router = useRouter();
  const [created, setCreated] = useState<CreatedKey | null>(null);
  const [status, setStatus] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const curlExample = useMemo(() => {
    if (!created) return "";
    const origin = typeof window === "undefined"
      ? "https://your-anchor-domain.example"
      : window.location.origin;
    return [
      "curl -X POST " + origin + "/api/inbound/v1/virtual-evidence \\",
      "  -H 'Authorization: Bearer " + created.token + "' \\",
      "  -H 'Content-Type: application/json' \\",
      "  -d '{",
      '    "events": [{',
      '      "studentExternalId": "S10002",',
      '      "date": "2026-09-19",',
      '      "evidenceType": "lms_progress",',
      '      "occurredAt": "2026-09-19T14:10:00-05:00",',
      '      "source": "district-lms",',
      '      "sourceRef": "activity-884921",',
      '      "minutes": 24',
      "    }]",
      "  }'",
    ].join("\n");
  }, [created]);

  async function createKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Creating key…");
    setCreated(null);

    const form = new FormData(event.currentTarget);
    const expires = String(form.get("expiresAt") ?? "");
    const response = await fetch("/api/settings/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        expiresAt: expires ? new Date(expires).toISOString() : null,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error ?? "Unable to create API key.");
      return;
    }

    setCreated(payload);
    setStatus("Key created. Copy it now — Anchor will not show the plaintext secret again.");
    event.currentTarget.reset();
    router.refresh();
  }

  async function revoke(id: string, name: string) {
    if (!window.confirm("Revoke " + name + "? Existing clients using this key will stop working immediately.")) {
      return;
    }

    setBusyId(id);
    setStatus("Revoking key…");
    const response = await fetch("/api/settings/api-keys/" + id, {
      method: "DELETE",
    });
    const payload = await response.json();
    setBusyId(null);

    if (!response.ok) {
      setStatus(payload.error ?? "Unable to revoke API key.");
      return;
    }

    setStatus("API key revoked.");
    if (created?.id === id) setCreated(null);
    router.refresh();
  }

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setStatus(label + " copied.");
    } catch {
      setStatus("Clipboard access was unavailable. Select the text and copy it manually.");
    }
  }

  return (
    <div className="api-key-manager">
      <form className="panel case-editor api-key-create" onSubmit={createKey}>
        <div className="panel-heading">
          <div>
            <div className="eyebrow">Inbound evidence API</div>
            <h2>Create a server-to-server key</h2>
          </div>
        </div>
        <p className="muted-copy">
          This key can only submit virtual participation evidence. It cannot read student records,
          change official SIS attendance, manage users, or access finance data.
        </p>
        <div className="form-grid two">
          <label>
            <span>Key name</span>
            <input name="name" required maxLength={120} placeholder="Canvas participation feed" />
          </label>
          <label>
            <span>Expiration <small>Optional</small></span>
            <input name="expiresAt" type="datetime-local" />
          </label>
        </div>
        <button className="primary-link" type="submit">Create API key</button>

        {created ? (
          <div className="api-key-reveal">
            <div className="api-key-warning">
              <strong>Copy this secret now.</strong>
              <span>Only its hash is stored. Closing or refreshing this page permanently hides the plaintext key.</span>
            </div>
            <div className="secret-row">
              <code>{created.token}</code>
              <button type="button" className="case-action" onClick={() => copy(created.token, "API key")}>
                Copy key
              </button>
            </div>
            <div className="api-example-heading">
              <strong>Example request</strong>
              <button type="button" className="case-action" onClick={() => copy(curlExample, "Request example")}>
                Copy cURL
              </button>
            </div>
            <pre className="api-example"><code>{curlExample}</code></pre>
          </div>
        ) : null}
        {status ? <small className="editor-message">{status}</small> : null}
      </form>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">Credentials</div>
            <h2>Issued API keys</h2>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Prefix</th>
                <th>Status</th>
                <th>Last used</th>
                <th>Expires</th>
                <th>Created by</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {apiKeys.length ? apiKeys.map((key) => {
                const expired = key.expiresAt ? new Date(key.expiresAt) <= new Date() : false;
                const state = !key.active ? "revoked" : expired ? "expired" : "active";
                return (
                  <tr key={key.id}>
                    <td>{key.name}</td>
                    <td><code>{key.prefix}…</code></td>
                    <td>{state}</td>
                    <td>{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : "Never"}</td>
                    <td>{key.expiresAt ? new Date(key.expiresAt).toLocaleString() : "No expiry"}</td>
                    <td>{key.createdBy ?? "Unknown"}</td>
                    <td>
                      {key.active && !expired ? (
                        <button
                          type="button"
                          className="case-action danger-action"
                          disabled={busyId === key.id}
                          onClick={() => revoke(key.id, key.name)}
                        >
                          {busyId === key.id ? "Revoking…" : "Revoke"}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={7}>No inbound evidence API keys have been issued.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
