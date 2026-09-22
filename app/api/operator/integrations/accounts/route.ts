import { NextResponse } from "next/server";
import { apiSession, errorResponse } from "@/lib/api";
import {
  disconnectPipedreamAccount,
  listPipedreamAccounts,
  pipedreamConfigured,
} from "@/lib/operator/pipedream";

export async function GET() {
  const auth = await apiSession("view");
  if (!auth.session) return auth.response;
  try {
    if (!pipedreamConfigured()) return NextResponse.json({ accounts: [] });
    return NextResponse.json({
      accounts: await listPipedreamAccounts(auth.session.orgId),
    });
  } catch (error) {
    return errorResponse(error, "Unable to list connected apps.");
  }
}

export async function DELETE(request: Request) {
  const auth = await apiSession("admin");
  if (!auth.session) return auth.response;
  try {
    const url = new URL(request.url);
    const accountId = url.searchParams.get("id")?.trim();
    if (!accountId) {
      return NextResponse.json({ error: "Account ID is required." }, { status: 400 });
    }
    await disconnectPipedreamAccount({
      externalUserId: auth.session.orgId,
      accountId,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Unable to disconnect app.");
  }
}
