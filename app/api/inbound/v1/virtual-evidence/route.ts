import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateIntegrationApiKey } from "@/lib/api-key-auth";
import { rateLimit } from "@/lib/rate-limit";
import { hashIp, requestIp } from "@/lib/security";
import {
  ingestVirtualEvidenceEvents,
  type InboundEvidenceEvent,
} from "@/lib/virtual-evidence-api";

export const runtime = "nodejs";

const evidenceTypes = [
  "lms_progress",
  "teacher_interaction",
  "assignment_submission",
  "live_session",
  "approved_offline_work",
  "other",
] as const;

const metadataSchema = z.record(z.unknown()).optional().refine(
  (value) => value === undefined || JSON.stringify(value).length <= 8000,
  "metadata must be 8 KB or smaller.",
);

const eventSchema = z.object({
  studentExternalId: z.string().min(1).max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  evidenceType: z.enum(evidenceTypes),
  occurredAt: z.string().min(1).max(80),
  source: z.string().min(1).max(120),
  sourceRef: z.string().min(1).max(240),
  minutes: z.number().int().nonnegative().max(1440).nullable().optional().default(null),
  metadata: metadataSchema,
});

const requestSchema = z.object({
  events: z.array(eventSchema).min(1).max(500),
});

export async function POST(request: Request) {
  const ipKey = hashIp(requestIp(request)) ?? "unknown";
  const ipLimited = await rateLimit("evidence-api-ip:" + ipKey, 120, 60);
  if (!ipLimited.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded." },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": "60",
          "X-Anchor-API-Version": "1",
        },
      },
    );
  }

  const session = await authenticateIntegrationApiKey(
    request,
    "virtual_evidence:write",
  );

  if (!session) {
    return NextResponse.json(
      { error: "Invalid or unauthorized API key." },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
          "X-Anchor-API-Version": "1",
        },
      },
    );
  }

  const limited = await rateLimit("evidence-api:" + session.keyId, 60, 60);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded." },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": "60",
          "X-Anchor-API-Version": "1",
        },
      },
    );
  }

  try {
    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (declaredLength > 1_000_000) {
      return NextResponse.json(
        { error: "Request body exceeds 1 MB." },
        { status: 413 },
      );
    }

    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 1_000_000) {
      return NextResponse.json(
        { error: "Request body exceeds 1 MB." },
        { status: 413 },
      );
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "Request body must be valid JSON." },
        { status: 400 },
      );
    }

    const input = requestSchema.parse(parsedJson);
    const result = await ingestVirtualEvidenceEvents(
      {
        orgId: session.orgId,
        apiKeyId: session.keyId,
        apiKeyPrefix: session.keyPrefix,
      },
      input.events as InboundEvidenceEvent[],
    );

    return NextResponse.json(
      {
        ok: result.rejected === 0,
        organization: session.orgName,
        ...result,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "X-Anchor-API-Version": "1",
        },
      },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid evidence payload.",
          issues: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Evidence ingestion failed." },
      { status: 500 },
    );
  }
}
