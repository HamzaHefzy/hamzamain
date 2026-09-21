import SettingsManager from "@/components/SettingsManager";
import RecoverySettingsForm from "@/components/RecoverySettingsForm";
import { getRecoverySettings } from "@/lib/recovery-service";
import { can, requireSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireSession();
  const admin = can(session.role, "admin");
  if (!admin) {
    return (
      <div className="page-stack">
        <header className="page-header">
          <div className="page-header-copy">
            <div className="eyebrow">Settings</div>
            <h1>Organization configuration</h1>
          </div>
        </header>
        <section className="disclaimer">Administrator access is required to change organization settings.</section>
      </div>
    );
  }

  const sql = db();
  const [campuses, policyRows, recoverySettings] = await Promise.all([
    sql<{
      id: string;
      name: string;
      code: string;
      delivery_model: string;
      active: boolean;
    }[]>`
      select id, name, code, delivery_model, active
      from campuses
      where org_id = ${session.orgId}
      order by active desc, name
    `,
    sql<{
      name: string;
      version: number;
      effective_from: string;
      config: {
        qualifyingEvidence?: string[];
        minimumMinutes?: number;
        allowAnyQualifyingEvidence?: boolean;
        dayCloseLocalTime?: string;
      };
    }[]>`
      select name, version, effective_from::text, config
      from attendance_policies
      where org_id = ${session.orgId}
        and active = true
        and delivery_model = 'virtual_program'
      order by version desc
      limit 1
    `,
    getRecoverySettings(session.orgId),
  ]);

  return (
    <div className="page-stack">
      <header className="page-header">
        <div className="page-header-copy">
          <div className="eyebrow">Settings</div>
          <h1>Configure {session.orgName} without touching the database.</h1>
          <p className="lede">
            Set campus structure and the active virtual attendance policy before loading production attendance data.
          </p>
        </div>
      </header>
      <SettingsManager campuses={campuses} policy={policyRows[0] ?? null} />
      <RecoverySettingsForm settings={recoverySettings} />
    </div>
  );
}
