import { NextResponse } from "next/server";
import { z } from "zod";
import { apiSession, errorResponse } from "@/lib/api";
import { getOperatorProfile } from "@/lib/operator/profile";
import { getGooglePlaceDetails, searchGooglePlaces } from "@/lib/operator/places";

const querySchema = z.object({
  q: z.string().trim().min(2).max(300),
  includeContact: z.enum(["0", "1"]).optional().default("0"),
});

export async function GET(request: Request) {
  const auth = await apiSession("view");
  if (!auth.session) return auth.response;

  try {
    const url = new URL(request.url);
    const input = querySchema.parse({
      q: url.searchParams.get("q"),
      includeContact: url.searchParams.get("includeContact") ?? "0",
    });
    const profile = await getOperatorProfile(auth.session.orgId);
    const results = await searchGooglePlaces({
      query: input.q,
      homeBase: profile?.home_base ?? null,
      maxResults: 8,
    });

    if (input.includeContact !== "1") {
      return NextResponse.json({ results });
    }

    const enriched = [];
    for (const result of results.slice(0, 5)) {
      enriched.push(await getGooglePlaceDetails(result.id));
    }
    return NextResponse.json({ results: enriched });
  } catch (error) {
    return errorResponse(error, "Unable to search Google Maps.");
  }
}
