import { NextResponse } from "next/server";
import { getSession, SESSION_COOKIE } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { assertSameOrigin } from "@/lib/security";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await getSession();
    if (session) {
      await audit({
        orgId: session.orgId,
        actorUserId: session.userId,
        action: "auth.logout",
        entityType: "user",
        entityId: session.userId,
        request,
      });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch {
    return NextResponse.json({ ok: true });
  }
}
