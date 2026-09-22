import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/lib/db";
import type { OperatorRole } from "@/lib/permissions";

export { can } from "@/lib/permissions";
export type { OperatorRole, Permission } from "@/lib/permissions";

export const SESSION_COOKIE = "operator_session";

export type OperatorSession = {
  userId: string;
  orgId: string;
  email: string;
  name: string;
  role: OperatorRole;
  orgName: string;
  orgSlug: string;
};

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters.");
  }
  return new TextEncoder().encode(value);
}

export async function signSession(session: OperatorSession) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .setIssuer("operator")
    .setAudience("operator-web")
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<OperatorSession | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), {
      issuer: "operator",
      audience: "operator-web",
    });
    return payload as unknown as OperatorSession;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<OperatorSession | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await verifySessionToken(token);
  if (!session) return null;

  const sql = db();
  const rows = await sql<{
    user_id: string;
    email: string;
    name: string;
    role: OperatorRole;
    org_id: string;
    org_name: string;
    org_slug: string;
  }[]>`
    select u.id as user_id, u.email, u.name, m.role,
           o.id as org_id, o.name as org_name, o.slug as org_slug
    from users u
    join memberships m on m.user_id = u.id
    join organizations o on o.id = m.org_id
    where u.id = ${session.userId}
      and o.id = ${session.orgId}
      and u.active = true
      and m.active = true
      and o.status in ('active','trial','past_due')
    limit 1
  `;

  const row = rows[0];
  if (!row) return null;

  return {
    userId: row.user_id,
    orgId: row.org_id,
    email: row.email,
    name: row.name,
    role: row.role,
    orgName: row.org_name,
    orgSlug: row.org_slug,
  };
}

export async function requireSession(): Promise<OperatorSession> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
