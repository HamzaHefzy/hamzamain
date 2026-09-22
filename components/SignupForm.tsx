"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
          workspaceName: form.get("workspaceName") || undefined,
        }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to create account.");
      router.push("/assistant");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label><span>Your name</span><input name="name" autoComplete="name" required /></label>
      <label><span>Email</span><input name="email" type="email" autoComplete="email" required /></label>
      <label><span>Password <small>12+ characters</small></span><input name="password" type="password" minLength={12} autoComplete="new-password" required /></label>
      <label><span>Workspace name <small>Optional</small></span><input name="workspaceName" placeholder="e.g. Hamza's Operator" /></label>
      {error ? <div className="form-error" role="alert">{error}</div> : null}
      <button className="m-button dark auth-submit" type="submit" disabled={busy}>
        {busy ? "Creating workspace…" : "Create Operator workspace"}
      </button>
    </form>
  );
}
