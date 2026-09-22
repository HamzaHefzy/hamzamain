import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import AuthorityEditor from "@/components/operator/AuthorityEditor";
import AuthorityRuleActions from "@/components/operator/AuthorityRuleActions";

export const dynamic = "force-dynamic";

export default async function AuthorityPage() {
  const session = await requireSession();
  const sql = db();
  const rules = await sql<{
    id: string;
    domain: string;
    action: string;
    enabled: boolean;
    policy: Record<string, unknown>;
  }[]>`
    select id, domain, action, enabled, policy
    from operator_authority_rules
    where org_id = ${session.orgId}
    order by domain, action
  `;

  return (
    <div className="operator-page">
      <header className="operator-page-header">
        <div>
          <span className="operator-kicker">Authority wallet</span>
          <h1>You decide where Operator can act alone.</h1>
          <p>Default-deny for money and consequential actions. Add explicit permissions for routine work, pause them instantly, or delete them entirely.</p>
        </div>
      </header>

      <section className="operator-section">
        <div className="operator-section-heading">
          <div><span className="operator-kicker">New permission</span><h2>Give bounded authority</h2></div>
        </div>
        <AuthorityEditor />
      </section>

      <section className="operator-section">
        <div className="operator-section-heading">
          <div><span className="operator-kicker">Current permissions</span><h2>What Operator may do</h2></div>
        </div>
        <div className="operator-rule-list">
          {rules.length ? rules.map((rule) => (
            <article key={rule.id}>
              <div>
                <strong>{rule.domain + " · " + rule.action}</strong>
                <span>
                  {String(rule.policy.mode ?? "configured")}
                  {typeof rule.policy.maxSpend === "number" ? " · up to $" + rule.policy.maxSpend : ""}
                </span>
              </div>
              <div className="operator-rule-actions">
                <span className={"operator-status-pill " + (rule.enabled ? "status-completed" : "status-cancelled")}>
                  {rule.enabled ? "active" : "disabled"}
                </span>
                <AuthorityRuleActions id={rule.id} enabled={rule.enabled} />
              </div>
            </article>
          )) : (
            <div className="operator-empty">
              <strong>No delegated authority yet.</strong>
              <span>Operator will ask before consequential actions.</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
