import { NextResponse } from "next/server";
import { z } from "zod";
import { apiSession, errorResponse } from "@/lib/api";
import { db } from "@/lib/db";
import { toJson } from "@/lib/json";

const ruleSchema = z.object({
  domain: z.string().min(1).max(60),
  action: z.string().min(1).max(60),
  enabled: z.boolean().default(true),
  policy: z.record(z.unknown()),
});

export async function GET() {
  const auth = await apiSession("view");
  if (!auth.session) return auth.response;
  const sql = db();
  const rules = await sql`
    select id, domain, action, enabled, policy, updated_at
    from operator_authority_rules
    where org_id = ${auth.session.orgId}
    order by domain, action
  `;
  return NextResponse.json({ rules });
}

export async function PUT(request: Request) {
  const auth = await apiSession("admin");
  if (!auth.session) return auth.response;
  try {
    const input = ruleSchema.parse(await request.json());
    const sql = db();
    const [rule] = await sql`
      insert into operator_authority_rules (org_id, domain, action, enabled, policy)
      values (${auth.session.orgId}, ${input.domain}, ${input.action}, ${input.enabled}, ${sql.json(toJson(input.policy))})
      on conflict (org_id, domain, action) do update
      set enabled = excluded.enabled, policy = excluded.policy, updated_at = now()
      returning id, domain, action, enabled, policy, updated_at
    `;
    return NextResponse.json({ rule });
  } catch (error) {
    return errorResponse(error, "Unable to save authority rule.");
  }
}
