import Link from "next/link";
import { notFound } from "next/navigation";
import Logo from "@/components/Logo";
import InviteAcceptForm from "@/components/InviteAcceptForm";
import { db } from "@/lib/db";
import { hashOpaqueToken } from "@/lib/auth-tokens";

type Props = { params: Promise<{ token: string }> };
export const dynamic = "force-dynamic";

export default async function InvitePage({ params }: Props) {
  const { token } = await params;
  const sql = db();
  const [invite] = await sql<{
    email: string;
    role: string;
    org_name: string;
    expires_at: Date;
    accepted_at: Date | null;
    existing_user: boolean;
  }[]>`
    select i.email, i.role, o.name as org_name, i.expires_at, i.accepted_at,
           exists(select 1 from users u where lower(u.email)=lower(i.email)) as existing_user
    from invitations i
    join organizations o on o.id = i.org_id
    where i.token_hash = ${hashOpaqueToken(token)}
    limit 1
  `;

  if (!invite || invite.expires_at < new Date()) notFound();

  return (
    <div className="public-form-page">
      <header className="public-form-header"><Link href="/"><Logo /></Link></header>
      <main className="auth-card">
        <div className="m-kicker">Team invitation</div>
        <h1>Join {invite.org_name}</h1>
        <p>You’ve been invited as <strong>{invite.role}</strong> using {invite.email}.</p>
        {invite.accepted_at ? (
          <div className="checkin-success">This invitation has already been accepted. <Link href="/login">Sign in to Anchor.</Link></div>
        ) : (
          <InviteAcceptForm token={token} existingUser={invite.existing_user} />
        )}
      </main>
    </div>
  );
}
