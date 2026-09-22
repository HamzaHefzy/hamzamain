import { NextResponse } from "next/server";
import { pingDatabase } from "@/lib/db";
import { pipedreamConfigured } from "@/lib/operator/pipedream";
import { vapiConfigured } from "@/lib/operator/vapi";
import { webSearchConfigured } from "@/lib/operator/web-search";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const database = await pingDatabase();
    return NextResponse.json({
      status: "ok",
      database,
      capabilities: {
        webSearch: webSearchConfigured(),
        googlePlaces: Boolean(process.env.GOOGLE_MAPS_API_KEY),
        connectedApps: pipedreamConfigured(),
        conversationalVoice:
          vapiConfigured() || Boolean(process.env.OPERATOR_VOICE_AGENT_URL),
        twilioFallback: Boolean(
          process.env.TWILIO_ACCOUNT_SID &&
          process.env.TWILIO_AUTH_TOKEN &&
          process.env.TWILIO_FROM_NUMBER
        ),
        email: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
        browserRunner: Boolean(process.env.OPERATOR_ACTION_RUNNER_URL),
        humanEscalation: Boolean(process.env.OPERATOR_HUMAN_QUEUE_URL),
      },
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "0.1.0",
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "degraded",
        database: false,
        error: error instanceof Error ? error.message : "Database unavailable.",
      },
      { status: 503 },
    );
  }
}
