import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { can, getSession, type Permission } from "@/lib/auth";

async function sameOriginWriteAllowed() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  if (!origin) return true;

  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) {
    try {
      return origin === new URL(configured).origin;
    } catch {
      return false;
    }
  }

  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (!host) return false;
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");
  return origin === protocol + "://" + host;
}

export async function apiSession(permission: Permission = "view") {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      response: NextResponse.json({ error: "Authentication required." }, { status: 401 }),
    };
  }

  if (permission !== "view" && !(await sameOriginWriteAllowed())) {
    return {
      session: null,
      response: NextResponse.json(
        {
          error: "Cross-origin mutation rejected.",
          code: "origin_rejected",
        },
        { status: 403 },
      ),
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
