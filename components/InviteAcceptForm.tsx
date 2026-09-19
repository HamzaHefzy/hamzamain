"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function InviteAcceptForm(props: { token: string; existingUser: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Activating your account…");
    const form = new FormData(event.currentTarget);

    const response = await fetch("/api/invite/" + encodeURIComponent(props.token), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        password: form.get("password"),
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? "Unable to accept invitation.");
      return;
    }

    setMessage(payload.message ?? "Invitation accepted.");
    setTimeout(() => router.push("/login"), 700);
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label><span>Your name</span><input name="name" required /></label>
      {!props.existingUser ? (
        <label><span>Create password <small>At least 12 characters</small></span><input name="password" type="password" minLength={12} required /></label>
      ) : (
        <input type="hidden" name="password" value="ExistingPasswordUnused123!" />
      )}
      <button className="m-button dark auth-submit" type="submit">Accept invitation</button>
      {message ? <small>{message}</small> : null}
    </form>
  );
}
