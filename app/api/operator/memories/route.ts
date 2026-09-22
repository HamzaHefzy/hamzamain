import { NextResponse } from "next/server";
import { z } from "zod";
import { apiSession, errorResponse } from "@/lib/api";
import { listOperatorMemories, upsertOperatorMemory } from "@/lib/operator/context";

const schema = z.object({
  key: z.string().trim().min(1).max(80).regex(/^[a-z0-9][a-z0-9_-]*$/i),
  value: z.string().trim().min(1).max(2000),
  sensitivity: z.enum(["normal", "private", "restricted"]).default("normal"),
});

export async function GET() {
  const auth = await apiSession("view");
  if (!auth.session) return auth.response;
  return NextResponse.json({ memories: await listOperatorMemories(auth.session.orgId) });
}

export async function PUT(request: Request) {
  const auth = await apiSession("task_write");
  if (!auth.session) return auth.response;
  try {
    const input = schema.parse(await request.json());
    const memory = await upsertOperatorMemory({
      orgId: auth.session.orgId,
      key: input.key,
      value: input.value,
      sensitivity: input.sensitivity,
    });
    return NextResponse.json({ memory });
  } catch (error) {
    return errorResponse(error, "Unable to save memory.");
  }
}
