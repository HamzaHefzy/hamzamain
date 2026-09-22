"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthorityRuleActions({
  id,
  enabled,
}: {
  id: string;
  enabled: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState("");

  async function toggle() {
    setBusy("toggle");
    try {
      const response = await fetch("/api/operator/authority/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
      });
      if (!response.ok) throw new Error();
      router.refresh();
    } finally {
      setBusy("");
    }
  }

  async function remove() {
    if (!window.confirm("Delete this delegated authority rule? Operator will ask again the next time this action needs permission.")) return;
    setBusy("delete");
    try {
      const response = await fetch("/api/operator/authority/" + id, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error();
      router.refresh();
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="operator-inline-actions">
      <button className="ghost" type="button" disabled={Boolean(busy)} onClick={toggle}>
        {busy === "toggle" ? "Updating…" : enabled ? "Pause" : "Enable"}
      </button>
      <button className="danger-ghost" type="button" disabled={Boolean(busy)} onClick={remove}>
        {busy === "delete" ? "Deleting…" : "Delete"}
      </button>
    </div>
  );
}
