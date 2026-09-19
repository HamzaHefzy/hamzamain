"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function InviteForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Sending invitation…");
    const form = new FormData(event.currentTarget);

    const response = await fetch("/api/team/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        role: form.get("role"),
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? "Unable to invite team member.");
      return;
    }

    setMessage(
      payload.inviteUrl
        ? "Invitation created. Development link: " + payload.inviteUrl
        : "Invitation sent.",
    );
    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form className="integration-form" onSubmit={submit}>
      <label><span>Email</span><input name="email" type="email" required /></label>
      <label>
        <span>Role</span>
        <select name="role" defaultValue="attendance">
          <option value="admin">Administrator</option>
          <option value="attendance">Attendance operations</option>
          <option value="finance">Finance</option>
          <option value="support">Student support</option>
          <option value="viewer">Viewer</option>
        </select>
      </label>
      <button className="secondary-link" type="submit">Invite team member</button>
      {message ? <small>{message}</small> : null}
    </form>
  );
}
