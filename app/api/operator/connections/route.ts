import { NextResponse } from "next/server";
import { apiSession } from "@/lib/api";

export async function GET() {
  const auth = await apiSession("view");
  if (!auth.session) return auth.response;

  const connections = [
    {
      provider: "action-runner",
      label: "Browser & API runner",
      connected: Boolean(process.env.OPERATOR_ACTION_RUNNER_URL),
      capabilities: ["web research","forms","bookings","calendar APIs","payments"],
    },
    {
      provider: "voice",
      label: "Voice agent",
      connected: Boolean(process.env.OPERATOR_VOICE_AGENT_URL || (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER)),
      capabilities: ["outbound calls","hold time","provider conversations"],
    },
    {
      provider: "email",
      label: "Email delivery",
      connected: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
      capabilities: ["transactional email","follow-ups"],
    },
    {
      provider: "human",
      label: "Human escalation",
      connected: Boolean(process.env.OPERATOR_HUMAN_QUEUE_URL),
      capabilities: ["exception handling","manual verification"],
    },
    {
      provider: "demo",
      label: "Demo execution",
      connected: process.env.OPERATOR_DEMO_MODE === "true",
      capabilities: ["simulated end-to-end execution"],
    },
  ];

  return NextResponse.json({ connections });
}
