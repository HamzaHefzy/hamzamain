"use client";

import { useState } from "react";

export default function VerificationBanner({ email }: { email: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function resend() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/resend-verification", { method: "POST" });
      const payload = await response.json() as {
        error?: string;
        verificationUrl?: string | null;
      };
      if (!response.ok) throw new Error(payload.error ?? "Unable to send verification email.");
      setMessage(
        payload.verificationUrl
          ? "Verification sent. Development link: " + payload.verificationUrl
          : "Verification email sent.",
      );
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unable to send verification email.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="operator-verification-banner" role="status">
      <div>
        <strong>Verify {email} to unlock execution.</strong>
        <span>You can browse the workspace, but Operator will not execute tasks or change authority until the email is verified.</span>
        {message ? <small>{message}</small> : null}
      </div>
      <button type="button" onClick={resend} disabled={busy}>
        {busy ? "Sending…" : "Resend verification"}
      </button>
    </div>
  );
}
