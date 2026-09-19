"use client";

import { FormEvent, useState } from "react";

export default function ForgotPasswordForm() {
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Sending…");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email") }),
    });
    const payload = await response.json();
    setMessage(
      payload.resetUrl
        ? "Development reset link: " + payload.resetUrl
        : "If that account exists, a reset link has been sent.",
    );
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label><span>Work email</span><input name="email" type="email" required /></label>
      <button className="m-button dark auth-submit" type="submit">Send reset link</button>
      {message ? <small>{message}</small> : null}
    </form>
  );
}
