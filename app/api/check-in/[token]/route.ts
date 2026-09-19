import { NextResponse } from "next/server";
import { z } from "zod";
import { submitCheckin } from "@/lib/show-up-service";
import { rateLimit } from "@/lib/rate-limit";
import { hashIp, requestIp } from "@/lib/security";

type Context = { params: Promise<{ token: string }> };

const schema = z.object({
  barrier: z.enum(["technology","forgot","behind","caregiving","motivation","health","other"]),
  note: z.string().max(1000).optional(),
});

export async function POST(request: Request, context: Context) {
  try {
    const key = hashIp(requestIp(request)) ?? "unknown";
    const limited = await rateLimit("checkin:" + key, 10, 3600);
    if (!limited.allowed) {
      return NextResponse.json({ error: "Too many submissions." }, { status: 429 });
    }

    const { token } = await context.params;
    const input = schema.parse(await request.json());
    const result = await submitCheckin({
      token,
      barrier: input.barrier,
      note: input.note,
    });

    return NextResponse.json({ ok: true, nextAction: result.nextAction });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to submit check-in." },
      { status: 400 },
    );
  }
}
