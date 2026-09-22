import { NextResponse } from "next/server";
import { apiSession } from "@/lib/api";
import { listPendingApprovals } from "@/lib/operator/service";

export async function GET() {
  const auth = await apiSession("view");
  if (!auth.session) return auth.response;
  return NextResponse.json({ approvals: await listPendingApprovals(auth.session.orgId) });
}
