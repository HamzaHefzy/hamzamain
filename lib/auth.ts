import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/lib/db";

export const SESSION_COOKIE = "anchor_session";

export type AnchorRole = "owner" | "admin" | "attendance" | "finance" | "support" | "viewer";

export type AnchorSession = {
  userId: string;
  orgId: string;
  email: string;
  name: string;
  role: AnchorRole;
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

export async function signSession(session: AnchorSession) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .setIssuer("anchor")
    .setAudience("anchor-web")
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<AnchorSession | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), {
      issuer: "anchor",
      audience: "anchor-web",
    });
    return payload as unknown as AnchorSession;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AnchorSession | null> {
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
    role: AnchorRole;
    org_id: string;
    org_name: string;
    org_slug: string;
  }[]>\`
    select u.id as user_id, u.email, u.name, m.role,
           o.id as org_id, o.name as org_name, o.slug as org_slug
    from users u
    join memberships m on m.user_id = u.id
    join organizations o on o.id = m.org_id
    where u.id = \${session.userId}
      and o.id = \${session.orgId}
      and u.active = true
      and o.status in ('active','trial')
    limit 1
  \`;

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

export async function requireSession(): Promise<AnchorSession> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export type Permission = "admin" | "attendance_write" | "finance" | "support_write" | "view";

export function can(role: AnchorRole, permission: Permission) {
  const permissions: Record<AnchorRole, Set<Permission>> = {
    owner: new Set(["admin","attendance_write","finance","support_write","view"]),
    admin: new Set(["admin","attendance_write","finance","support_write","view"]),
    attendance: new Set(["attendance_write","support_write","view"]),
    finance: new Set(["finance","view"]),
    support: new Set(["support_write","view"]),
    viewer: new Set(["view"]),
  };
  return permissions[role].has(permission);
}
