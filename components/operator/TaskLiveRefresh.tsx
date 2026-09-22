"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TaskLiveRefresh({ status }: { status: string }) {
  const router = useRouter();

  useEffect(() => {
    if (!["in_progress", "waiting_external", "ready"].includes(status)) return;
    const timer = window.setInterval(() => router.refresh(), 3000);
    return () => window.clearInterval(timer);
  }, [router, status]);

  return null;
}
