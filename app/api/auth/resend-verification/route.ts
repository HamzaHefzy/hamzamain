import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { issueEmailVerification } from "@/lib/email-verification";
import { rateLimit } from "@/lib/rate-limit";
import { assertSameOrigin } from "@/lib/security";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    if (session.emailVerified) return NextResponse.json({ ok: true, alreadyVerified: true });

    const limited = await rateLimit("verify-email:" + session.userId, 4, 3600);
    if (!limited.allowed) {
      return NextResponse.json(
        { error: "Too many verification emails requested. Try again later." },
        { status: 429 },
      );
    }

    const result = await issueEmailVerification({
      userId: session.userId,
      orgId: session.orgId,
      email: session.email,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to send verification email." },
      { status: 400 },
    );
  }
}
