import { NextResponse } from "next/server";
import { z } from "zod";
import { apiSession, errorResponse } from "@/lib/api";
import { searchWeb } from "@/lib/operator/web-search";

const schema = z.object({
  q: z.string().trim().min(2).max(600),
  freshness: z.enum(["pd","pw","pm","py"]).optional(),
});

export async function GET(request: Request) {
  const auth = await apiSession("view");
  if (!auth.session) return auth.response;

  try {
    const url = new URL(request.url);
    const input = schema.parse({
      q: url.searchParams.get("q"),
      freshness: url.searchParams.get("freshness") || undefined,
    });
    const results = await searchWeb({
      query: input.q,
      count: 10,
      freshness: input.freshness,
    });
    return NextResponse.json({ results });
  } catch (error) {
    return errorResponse(error, "Unable to search the live web.");
  }
}
