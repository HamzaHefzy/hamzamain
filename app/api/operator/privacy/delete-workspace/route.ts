import { NextResponse } from "next/server";
import { z } from "zod";
import { apiSession, errorResponse } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/security";
import { deleteOperatorWorkspace } from "@/lib/operator/account";

const schema = z.object({
  password: z.string().min(1).max(256),
  confirmation: z.string().min(1).max(120),
});

export async function POST(request: Request) {
  const auth = await apiSession("admin");
  if (!auth.session) return auth.response;

  try {
    assertSameOrigin(request);
    if (auth.session.role !== "owner") {
      return NextResponse.json(
        { error: "Only the workspace owner can delete the workspace." },
        { status: 403 },
      );
    }

    const input = schema.parse(await request.json());
    if (input.confirmation !== auth.session.orgSlug) {
      return NextResponse.json(
        { error: "Type the workspace slug exactly to confirm deletion." },
        { status: 400 },
      );
    }

    await deleteOperatorWorkspace({
      orgId: auth.session.orgId,
      userId: auth.session.userId,
      password: input.password,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return errorResponse(error, "Unable to delete workspace.");
  }
}
