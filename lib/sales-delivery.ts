import { createHmac } from "node:crypto";
import { db } from "@/lib/db";

export type SalesLead = {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: string | null;
  enrollment: number | null;
  state: string | null;
  interest: string;
  message: string | null;
  createdAt: string;
};

type DeliveryResult = {
  channel: "email" | "webhook";
  status: "sent" | "failed";
};

export function signSalesWebhook(payload: string, secret: string) {
  return "sha256=" + createHmac("sha256", secret).update(payload).digest("hex");
}

async function recordDelivery(input: {
  leadId: string;
  channel: "email" | "webhook";
  status: "sent" | "failed";
  destination?: string | null;
  providerRef?: string | null;
  error?: string | null;
}) {
  const sql = db();
  await sql`
    insert into lead_deliveries (
      lead_id, channel, status, destination, provider_ref, error
    )
    values (
      ${input.leadId}, ${input.channel}, ${input.status},
      ${input.destination ?? null}, ${input.providerRef ?? null},
      ${input.error ?? null}
    )
  `;
}

function leadText(lead: SalesLead) {
  return [
    "New Anchor demo request",
    "",
    "Name: " + lead.name,
    "Email: " + lead.email,
    "Organization: " + lead.organization,
    "Role: " + (lead.role ?? "Not provided"),
    "Enrollment: " + (lead.enrollment ?? "Not provided"),
    "State: " + (lead.state ?? "Not provided"),
    "Interest: " + lead.interest,
    "",
    "Message:",
    lead.message ?? "No message provided.",
    "",
    "Lead ID: " + lead.id,
    "Received: " + lead.createdAt,
  ].join("\n");
}

async function deliverEmail(lead: SalesLead): Promise<DeliveryResult | null> {
  const recipient = process.env.SALES_ALERT_EMAIL;
  if (!recipient) return null;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    await recordDelivery({
      leadId: lead.id,
      channel: "email",
      status: "failed",
      destination: recipient,
      error: "Sales email configured without Resend credentials.",
    });
    return { channel: "email", status: "failed" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [recipient],
        reply_to: lead.email,
        subject: "Anchor demo request · " + lead.organization,
        text: leadText(lead),
      }),
      signal: AbortSignal.timeout(5000),
    });

    const payload = await response.json() as { id?: string; message?: string };
    if (!response.ok) {
      throw new Error(payload.message ?? "Sales email provider request failed.");
    }

    await recordDelivery({
      leadId: lead.id,
      channel: "email",
      status: "sent",
      destination: recipient,
      providerRef: payload.id ?? null,
    });
    return { channel: "email", status: "sent" };
  } catch (error) {
    await recordDelivery({
      leadId: lead.id,
      channel: "email",
      status: "failed",
      destination: recipient,
      error: error instanceof Error ? error.message : "Sales email failed.",
    });
    return { channel: "email", status: "failed" };
  }
}

async function deliverWebhook(lead: SalesLead): Promise<DeliveryResult | null> {
  const url = process.env.SALES_WEBHOOK_URL;
  if (!url) return null;

  const secret = process.env.SALES_WEBHOOK_SECRET;
  if (!secret) {
    await recordDelivery({
      leadId: lead.id,
      channel: "webhook",
      status: "failed",
      destination: url,
      error: "SALES_WEBHOOK_SECRET is required when SALES_WEBHOOK_URL is configured.",
    });
    return { channel: "webhook", status: "failed" };
  }

  const payload = JSON.stringify({
    event: "lead.created",
    version: 1,
    data: lead,
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Anchor-Event": "lead.created",
        "X-Anchor-Signature": signSalesWebhook(payload, secret),
      },
      body: payload,
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error("Sales webhook returned HTTP " + response.status + ".");
    }

    await recordDelivery({
      leadId: lead.id,
      channel: "webhook",
      status: "sent",
      destination: new URL(url).origin,
      providerRef: response.headers.get("x-request-id"),
    });
    return { channel: "webhook", status: "sent" };
  } catch (error) {
    await recordDelivery({
      leadId: lead.id,
      channel: "webhook",
      status: "failed",
      destination: (() => {
        try { return new URL(url).origin; } catch { return "invalid-url"; }
      })(),
      error: error instanceof Error ? error.message : "Sales webhook failed.",
    });
    return { channel: "webhook", status: "failed" };
  }
}

export async function deliverSalesLead(lead: SalesLead) {
  const results = await Promise.all([
    deliverEmail(lead),
    deliverWebhook(lead),
  ]);

  return results.filter((result): result is DeliveryResult => Boolean(result));
}
