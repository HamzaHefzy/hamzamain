import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runShowUpAutomation } from "@/lib/show-up-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== "Bearer " + secret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const sql = db();
  const orgs = await sql<{ id: string; slug: string }[]>`
    select id, slug from organizations where status in ('active','trial')
  `;

  const results: Record<string, unknown> = {};
  for (const org of orgs) {
    try {
      results[org.slug] = await runShowUpAutomation(org.id);
    } catch (error) {
      results[org.slug] = {
        error: error instanceof Error ? error.message : "Show-up automation failed.",
      };
    }
  }

  return NextResponse.json({ ok: true, results });
}
