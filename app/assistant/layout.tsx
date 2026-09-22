import type { ReactNode } from "react";
import { requireSession } from "@/lib/auth";
import VerificationBanner from "@/components/operator/VerificationBanner";

export default async function AssistantLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  return (
    <>
      {!session.emailVerified ? <VerificationBanner email={session.email} /> : null}
      {children}
    </>
  );
}
