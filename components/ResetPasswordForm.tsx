"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }

    setMessage("Updating password…");
    const response = await fetch("/api/auth/reset-password/" + encodeURIComponent(token), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to reset password.");
      return;
    }

    setMessage("Password updated. Redirecting to sign in…");
    setTimeout(() => router.push("/login"), 700);
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label><span>New password <small>At least 12 characters</small></span><input name="password" type="password" minLength={12} required /></label>
      <label><span>Confirm password</span><input name="confirm" type="password" minLength={12} required /></label>
      <button className="m-button dark auth-submit" type="submit">Reset password</button>
      {message ? <small>{message}</small> : null}
    </form>
  );
}
