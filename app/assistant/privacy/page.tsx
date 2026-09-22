import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import WorkspacePrivacyActions from "@/components/operator/WorkspacePrivacyActions";

export const dynamic = "force-dynamic";

export default async function WorkspacePrivacyPage() {
  const session = await requireSession();
  if (session.role !== "owner") redirect("/assistant");

  return (
    <div className="operator-page">
      <header className="operator-page-header">
        <div>
          <span className="operator-kicker">Data & account</span>
          <h1>Your data should be portable—and deletable.</h1>
          <p>Yumna keeps operational context because it makes delegation better. This page gives the workspace owner control over taking that data out or removing it entirely.</p>
        </div>
      </header>
      <WorkspacePrivacyActions orgSlug={session.orgSlug} />
    </div>
  );
}
