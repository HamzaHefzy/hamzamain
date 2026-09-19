"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Role = "owner" | "admin" | "attendance" | "finance" | "support" | "viewer";

export default function TeamMemberActions(props: {
  userId: string;
  role: Role;
  active: boolean;
  isSelf: boolean;
  canManageOwners: boolean;
}) {
  const router = useRouter();
  const [role, setRole] = useState<Role>(props.role);
  const [message, setMessage] = useState("");

  async function patch(payload: { role?: Role; active?: boolean }) {
    setMessage("Saving…");
    const response = await fetch("/api/team/" + props.userId, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json();

    if (!response.ok) {
      setMessage(body.error ?? "Unable to update access.");
      setRole(props.role);
      return;
    }

    setMessage("Saved.");
    router.refresh();
  }

  const roleOptions: { value: Role; label: string }[] = [
    { value: "admin", label: "Administrator" },
    { value: "attendance", label: "Attendance" },
    { value: "finance", label: "Finance" },
    { value: "support", label: "Student support" },
    { value: "viewer", label: "Viewer" },
  ];

  if (props.canManageOwners || props.role === "owner") {
    roleOptions.unshift({ value: "owner", label: "Owner" });
  }

  return (
    <div className="team-actions">
      <select
        aria-label="Member role"
        value={role}
        disabled={props.isSelf || (props.role === "owner" && !props.canManageOwners)}
        onChange={(event) => {
          const next = event.target.value as Role;
          setRole(next);
          void patch({ role: next });
        }}
      >
        {roleOptions.map((option) => (
          <option value={option.value} key={option.value}>{option.label}</option>
        ))}
      </select>
      <button
        className="case-action"
        type="button"
        disabled={props.isSelf || (props.role === "owner" && !props.canManageOwners)}
        onClick={() => void patch({ active: !props.active })}
      >
        {props.active ? "Revoke" : "Restore"}
      </button>
      {message ? <small>{message}</small> : null}
    </div>
  );
}
