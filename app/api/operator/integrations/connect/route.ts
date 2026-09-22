import { NextResponse } from "next/server";
import { z } from "zod";
import { apiSession, errorResponse } from "@/lib/api";
import { createPipedreamConnectLink, pipedreamConfigured } from "@/lib/operator/pipedream";

const schema = z.object({
  app: z.string().trim().min(2).max(100).regex(/^[a-z0-9_-]+$/),
});

export async function POST(request: Request) {
  const auth = await apiSession("admin");
  if (!auth.session) return auth.response;

  try {
    if (!pipedreamConfigured()) throw new Error("Pipedream Connect is not configured.");
    const { app } = schema.parse(await request.json());
    const site = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? request.url);
    const success = new URL("/assistant/connections", site.origin);
    success.searchParams.set("connected", app);

    const link = await createPipedreamConnectLink({
      externalUserId: auth.session.orgId,
      appSlug: app,
      allowedOrigin: site.origin,
      successRedirectUri: success.toString(),
    });
    return NextResponse.json(link);
  } catch (error) {
    return errorResponse(error, "Unable to create app connection.");
  }
}
