"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
          organization: form.get("organization") || undefined,
        }),
      });

      const raw = await response.text();
      let payload: { error?: string; code?: string } = {};
      if (raw) {
        try {
          payload = JSON.parse(raw) as { error?: string; code?: string };
        } catch {
          payload = {};
        }
      }

      if (!response.ok) {
        setError(
          payload.code === "database_unavailable"
            ? "This Operator workspace has not been connected to its database yet. For local development, run npm run setup:local and refresh."
            : payload.error ?? "Unable to sign in.",
        );
        return;
      }

      const next = search.get("next");
      router.push(next && next.startsWith("/") ? next : "/assistant");
      router.refresh();
    } catch {
      setError("The sign-in service could not be reached. Confirm the Operator server is running and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label>
        <span>Email</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        <span>Password</span>
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      <label>
        <span>Workspace slug <small>Optional if your account belongs to one workspace</small></span>
        <input name="organization" autoComplete="organization" />
      </label>
      {error ? <div className="form-error" role="alert">{error}</div> : null}
      <button className="m-button dark auth-submit" type="submit" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
