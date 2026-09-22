import { NextResponse } from "next/server";
import { apiSession, errorResponse } from "@/lib/api";
import { createBillingPortalSession } from "@/lib/operator/billing";

export async function POST() {
  const auth = await apiSession("admin");
  if (!auth.session) return auth.response;
  try {
    return NextResponse.json(await createBillingPortalSession(auth.session.orgId));
  } catch (error) {
    return errorResponse(error, "Unable to open billing portal.");
  }
}
