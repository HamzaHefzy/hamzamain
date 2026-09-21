import { NextResponse } from "next/server";
import { z } from "zod";
import { apiSession } from "@/lib/api";
import { assertSameOrigin } from "@/lib/security";
import { updateSessionIncident } from "@/lib/session-incidents";

type Context = { params: Promise<{ id: string }> };

const schema = z.object({
  status: z.enum(["open","investigating","resolved","dismissed"]).optional(),
  incidentType: z.enum([
    "mass_nonparticipation","link_failure","platform_outage","teacher_issue","unknown",
  ]).optional(),
  ownerUserId: z.string().uuid().nullable().optional(),
  resolutionNote: z.string().max(2000).nullable().optional(),
});

export async function PATCH(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const auth = await apiSession("attendance_write");
    if (auth.response) return auth.response;
    const session = auth.session!;
    const { id } = await context.params;
    const input = schema.parse(await request.json());

    const updated = await updateSessionIncident({
      orgId: session.orgId,
      incidentId: id,
      actorUserId: session.userId,
      ...input,
    });

    return NextResponse.json({ ok: true, incident: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update session incident." },
      { status: 400 },
    );
  }
}
