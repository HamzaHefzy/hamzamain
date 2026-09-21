import { NextResponse } from "next/server";
import { z } from "zod";
import { apiSession } from "@/lib/api";
import { audit } from "@/lib/audit";
import { assertSameOrigin } from "@/lib/security";
import { updateRecoveryEpisode } from "@/lib/recovery-detail";

type Context = { params: Promise<{ id: string }> };

const schema = z.object({
  ownerUserId: z.string().uuid().nullable().optional(),
  tier: z.enum(["automated","navigator","multidisciplinary"]).optional(),
  status: z.enum(["open","stabilizing","closed"]).optional(),
  note: z.string().max(2000).nullable().optional(),
});

export async function PATCH(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const auth = await apiSession("attendance_write");
    if (auth.response) return auth.response;
    const session = auth.session!;
    const { id } = await context.params;
    const input = schema.parse(await request.json());

    const updated = await updateRecoveryEpisode({
      orgId: session.orgId,
      episodeId: id,
      actorUserId: session.userId,
      ownerUserId: input.ownerUserId,
      tier: input.tier,
      status: input.status,
      note: input.note,
    });

    await audit({
      orgId: session.orgId,
      actorUserId: session.userId,
      action: "recovery_episode.updated",
      entityType: "recovery_episode",
      entityId: id,
      metadata: input,
      request,
    });

    return NextResponse.json({ ok: true, episode: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update recovery episode." },
      { status: 400 },
    );
  }
}
