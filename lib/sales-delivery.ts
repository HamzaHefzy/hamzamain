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
  status: "sent" | "failed" | "skipped";
};

export function signSalesWebhook(payload: string, secret: string) {
  return "sha256=" + createHmac("sha256", secret).update(payload).digest("hex");
}

async function claimDelivery(
  leadId: string,
  channel: "email" | "webhook",
  destination: string,
) {
  const sql = db();
  const [row] = await sql<{ id: string }[]>`
    insert into lead_deliveries (
      lead_id, channel, status, attempts, destination, last_attempt_at
    )
    values (
      ${leadId}, ${channel}, 'processing', 1, ${destination}, now()
    )
    on conflict (lead_id, channel) do update
      set status = 'processing',
          attempts = lead_deliveries.attempts + 1,
          destination = excluded.destination,
          error = null,
          last_attempt_at = now(),
          updated_at = now()
      where lead_deliveries.status = 'failed'
    returning id
  `;
  return row?.id ?? null;
}

async function finishDelivery(input: {
  id: string;
  status: "sent" | "failed";
  providerRef?: string | null;
  error?: string | null;
}) {
  const sql = db();
  await sql`
    update lead_deliveries
    set status = ${input.status},
        provider_ref = ${input.providerRef ?? null},
        error = ${input.error ?? null},
        updated_at = now()
    where id = ${input.id}
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

  const deliveryId = await claimDelivery(lead.id, "email", recipient);
  if (!deliveryId) return { channel: "email", status: "skipped" };

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    await finishDelivery({
      id: deliveryId,
      status: "failed",
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

    await finishDelivery({
      id: deliveryId,
      status: "sent",
      providerRef: payload.id ?? null,
    });
    return { channel: "email", status: "sent" };
  } catch (error) {
    await finishDelivery({
      id: deliveryId,
      status: "failed",
      error: error instanceof Error ? error.message : "Sales email failed.",
    });
    return { channel: "email", status: "failed" };
  }
}

function webhookDestination(url: string) {
  try {
    return new URL(url).origin;
  } catch {
    return "invalid-url";
  }
}

async function deliverWebhook(lead: SalesLead): Promise<DeliveryResult | null> {
  const url = process.env.SALES_WEBHOOK_URL;
  if (!url) return null;

  const destination = webhookDestination(url);
  const deliveryId = await claimDelivery(lead.id, "webhook", destination);
  if (!deliveryId) return { channel: "webhook", status: "skipped" };

  const secret = process.env.SALES_WEBHOOK_SECRET;
  if (!secret) {
    await finishDelivery({
      id: deliveryId,
      status: "failed",
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

    await finishDelivery({
      id: deliveryId,
      status: "sent",
      providerRef: response.headers.get("x-request-id"),
    });
    return { channel: "webhook", status: "sent" };
  } catch (error) {
    await finishDelivery({
      id: deliveryId,
      status: "failed",
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

export async function retryFailedSalesLeadDeliveries(limit = 50) {
  const sql = db();
  const leads = await sql<{
    id: string;
    name: string;
    email: string;
    organization: string;
    role: string | null;
    enrollment: number | null;
    state: string | null;
    interest: string;
    message: string | null;
    created_at: Date;
  }[]>`
    select distinct l.id, l.name, l.email, l.organization, l.role,
           l.enrollment, l.state, l.interest, l.message, l.created_at
    from leads l
    join lead_deliveries d on d.lead_id = l.id
    where d.status = 'failed'
      and d.last_attempt_at <= now() - interval '5 minutes'
      and l.created_at >= now() - interval '14 days'
    order by l.created_at
    limit ${limit}
  `;

  let retried = 0;
  for (const lead of leads) {
    await deliverSalesLead({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      organization: lead.organization,
      role: lead.role,
      enrollment: lead.enrollment,
      state: lead.state,
      interest: lead.interest,
      message: lead.message,
      createdAt: lead.created_at.toISOString(),
    });
    retried += 1;
  }

  return { retried };
}
