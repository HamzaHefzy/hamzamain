import { NextResponse } from "next/server";
import { z } from "zod";
import { submitDailyLaunch } from "@/lib/daily-launch-service";
import { rateLimit } from "@/lib/rate-limit";
import { hashIp, requestIp } from "@/lib/security";

type Context = { params: Promise<{ token: string }> };

const schema = z.object({
  response: z.enum([
    "ready","technology","forgot","behind","caregiving","motivation",
    "health","anxiety","transportation","other",
  ]),
  note: z.string().max(1000).optional(),
});

export async function POST(request: Request, context: Context) {
  try {
    const key = hashIp(requestIp(request)) ?? "unknown";
    const limited = await rateLimit("daily-launch:" + key, 12, 3600);
    if (!limited.allowed) {
      return NextResponse.json({ error: "Too many submissions." }, { status: 429 });
    }

    const { token } = await context.params;
    const input = schema.parse(await request.json());
    const result = await submitDailyLaunch({
      token,
      response: input.response,
      note: input.note,
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save Daily Launch." },
      { status: 400 },
    );
  }
}
