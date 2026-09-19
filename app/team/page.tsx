import InviteForm from "@/components/InviteForm";
import { can, requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getMembers } from "@/lib/data-access";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await requireSession();
  const members = await getMembers(session.orgId);
  const admin = can(session.role, "admin");
  const sql = db();
  const invites = admin ? await sql<{
    id: string;
    email: string;
    role: string;
    expires_at: Date;
    accepted_at: Date | null;
    created_at: Date;
  }[]>\`
    select id, email, role, expires_at, accepted_at, created_at
    from invitations
    where org_id = \${session.orgId}
    order by created_at desc
    limit 50
  \` : [];

  return (
    <div className="page-stack">
      <header className="page-header">
        <div className="page-header-copy">
          <div className="eyebrow">Team & access</div>
          <h1>Give each operator only the access they need.</h1>
          <p className="lede">
            Roles separate administration, attendance operations, finance, student support, and read-only access within {session.orgName}.
          </p>
        </div>
      </header>

      <section className="two-column">
        <article className="panel">
          <div className="panel-heading"><div><div className="eyebrow">Members</div><h2>Active access</h2></div></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
              <tbody>{members.map((member) => (
                <tr key={member.id}><td>{member.name}</td><td>{member.email}</td><td>{member.role}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading"><div><div className="eyebrow">Invite</div><h2>Add an operator</h2></div></div>
          {admin ? <InviteForm /> : <p className="muted-copy">Administrator permission is required to invite team members.</p>}
        </article>
      </section>

      {admin ? (
        <section className="panel">
          <div className="panel-heading"><div><div className="eyebrow">Invitations</div><h2>Recent team invitations</h2></div></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Email</th><th>Role</th><th>Status</th><th>Expires</th></tr></thead>
              <tbody>{invites.length ? invites.map((invite) => (
                <tr key={invite.id}>
                  <td>{invite.email}</td><td>{invite.role}</td>
                  <td>{invite.accepted_at ? "Accepted" : invite.expires_at < new Date() ? "Expired" : "Pending"}</td>
                  <td>{invite.expires_at.toLocaleString()}</td>
                </tr>
              )) : <tr><td colSpan={4}>No invitations yet.</td></tr>}</tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
