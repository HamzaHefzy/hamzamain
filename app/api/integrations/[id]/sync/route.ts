import { NextResponse } from "next/server";
import { apiSession } from "@/lib/api";
import { audit } from "@/lib/audit";
import { syncIntegration } from "@/lib/integrations";
import { assertSameOrigin } from "@/lib/security";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const auth = await apiSession("admin");
    if (auth.response) return auth.response;
    const session = auth.session!;
    const { id } = await context.params;
    const stats = await syncIntegration(session.orgId, id);

    await audit({
      orgId: session.orgId,
      actorUserId: session.userId,
      action: "integration.synced",
      entityType: "integration",
      entityId: id,
      metadata: stats,
      request,
    });

    return NextResponse.json({ ok: true, stats });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Integration sync failed." },
      { status: 400 },
    );
  }
}
