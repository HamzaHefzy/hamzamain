import { NextResponse } from "next/server";
import { can, getSession, type Permission } from "@/lib/auth";

export async function apiSession(permission: Permission = "view") {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      response: NextResponse.json({ error: "Authentication required." }, { status: 401 }),
    };
  }

  if (permission !== "view" && !session.emailVerified) {
    return {
      session: null,
      response: NextResponse.json(
        {
          error: "Verify your email before Operator can execute tasks or change workspace settings.",
          code: "email_verification_required",
        },
        { status: 403 },
      ),
    };
  }

  if (!can(session.role, permission)) {
    return {
      session: null,
      response: NextResponse.json({ error: "Insufficient permission." }, { status: 403 }),
    };
  }

  return { session, response: null };
}

export function errorResponse(error: unknown, fallback = "Request failed.", status = 400) {
  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ error: message }, { status });
}
