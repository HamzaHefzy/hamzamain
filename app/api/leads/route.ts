import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { assertSameOrigin, hashIp, requestIp } from "@/lib/security";

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  organization: z.string().min(2).max(200),
  role: z.string().max(120).optional(),
  enrollment: z.coerce.number().int().nonnegative().max(10000000).optional(),
  state: z.string().max(40).optional(),
  interest: z.enum(["district_attendance","virtual_schools","funding","resolutionos","pilot","other"]),
  message: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const key = hashIp(requestIp(request)) ?? "unknown";
    const limited = await rateLimit("lead:" + key, 5, 3600);
    if (!limited.allowed) {
      return NextResponse.json({ error: "Too many submissions." }, { status: 429 });
    }

    const input = schema.parse(await request.json());
    const sql = db();
    const [lead] = await sql<{ id: string }[]>\`
      insert into leads (
        email, name, organization, role, enrollment, state, interest, message
      )
      values (
        \${input.email.toLowerCase()}, \${input.name}, \${input.organization},
        \${input.role ?? null}, \${input.enrollment ?? null}, \${input.state ?? null},
        \${input.interest}, \${input.message ?? null}
      )
      returning id
    \`;

    return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to submit request." },
      { status: 400 },
    );
  }
}
