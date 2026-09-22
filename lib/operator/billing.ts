import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";

export type BillingPlan = "assistant" | "operator" | "concierge";

const priceEnv: Record<BillingPlan, string> = {
  assistant: "STRIPE_PRICE_ASSISTANT",
  operator: "STRIPE_PRICE_OPERATOR",
  concierge: "STRIPE_PRICE_CONCIERGE",
};

export function stripePriceFor(plan: BillingPlan) {
  const envName = priceEnv[plan];
  const value = process.env[envName];
  if (!value) throw new Error(envName + " is not configured.");
  return value;
}

export async function createCheckoutSession(input: {
  orgId: string;
  email: string;
  plan: BillingPlan;
}) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured.");

  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const sql = db();
  const [existing] = await sql<{ customer_id: string | null }[]>`
    select customer_id from operator_subscriptions where org_id = ${input.orgId} limit 1
  `;

  const body = new URLSearchParams();
  body.set("mode", "subscription");
  if (existing?.customer_id) body.set("customer", existing.customer_id);
  else body.set("customer_email", input.email);
  body.set("client_reference_id", input.orgId);
  body.set("success_url", base + "/assistant/billing?checkout=success");
  body.set("cancel_url", base + "/assistant/billing?checkout=cancelled");
  body.set("line_items[0][price]", stripePriceFor(input.plan));
  body.set("line_items[0][quantity]", "1");
  body.set("metadata[org_id]", input.orgId);
  body.set("metadata[plan]", input.plan);
  body.set("subscription_data[metadata][org_id]", input.orgId);
  body.set("subscription_data[metadata][plan]", input.plan);

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + key,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const payload = await response.json() as { id?: string; url?: string; error?: { message?: string } };
  if (!response.ok || !payload.url) {
    throw new Error(payload.error?.message ?? "Stripe Checkout could not be created.");
  }
  return { id: payload.id ?? null, url: payload.url };
}

function signatureParts(header: string) {
  const parts = header.split(",").map((part) => part.split("=", 2));
  const timestamp = parts.find(([key]) => key === "t")?.[1];
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value);
  return { timestamp, signatures };
}

export function verifyStripeWebhook(rawBody: string, header: string) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");

  const { timestamp, signatures } = signatureParts(header);
  if (!timestamp || !signatures.length) return false;
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  const expected = createHmac("sha256", secret)
    .update(timestamp + "." + rawBody, "utf8")
    .digest("hex");

  return signatures.some((signature) => {
    if (signature.length !== expected.length) return false;
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  });
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asString(value: unknown) {
  return typeof value === "string" ? value : null;
}

export async function applyStripeEvent(event: {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
}) {
  const sql = db();
  const [fresh] = await sql<{ event_id: string }[]>`
    insert into operator_billing_events (event_id, event_type)
    values (${event.id}, ${event.type})
    on conflict (event_id) do nothing
    returning event_id
  `;
  if (!fresh) return { duplicate: true };

  const object = event.data.object;
  if (event.type === "checkout.session.completed") {
    const metadata = asObject(object.metadata);
    const orgId = asString(metadata.org_id) ?? asString(object.client_reference_id);
    const plan = asString(metadata.plan) ?? "operator";
    const customerId = asString(object.customer);
    const subscriptionId = asString(object.subscription);
    if (orgId) {
      await sql`
        insert into operator_subscriptions (
          org_id, customer_id, subscription_id, plan, status
        )
        values (${orgId}, ${customerId}, ${subscriptionId}, ${plan}, 'active')
        on conflict (org_id) do update set
          customer_id = excluded.customer_id,
          subscription_id = excluded.subscription_id,
          plan = excluded.plan,
          status = excluded.status,
          updated_at = now()
      `;
    }
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.deleted"
  ) {
    const metadata = asObject(object.metadata);
    const orgId = asString(metadata.org_id);
    const plan = asString(metadata.plan) ?? "operator";
    const customerId = asString(object.customer);
    const subscriptionId = asString(object.id);
    const status = asString(object.status) ?? (event.type.endsWith(".deleted") ? "canceled" : "active");
    const periodEnd = typeof object.current_period_end === "number"
      ? new Date(object.current_period_end * 1000).toISOString()
      : null;

    if (orgId) {
      await sql`
        insert into operator_subscriptions (
          org_id, customer_id, subscription_id, plan, status, current_period_end
        )
        values (${orgId}, ${customerId}, ${subscriptionId}, ${plan}, ${status}, ${periodEnd})
        on conflict (org_id) do update set
          customer_id = excluded.customer_id,
          subscription_id = excluded.subscription_id,
          plan = excluded.plan,
          status = excluded.status,
          current_period_end = excluded.current_period_end,
          updated_at = now()
      `;
    }
  }

  return { duplicate: false };
}


export async function createBillingPortalSession(orgId: string) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured.");

  const sql = db();
  const [subscription] = await sql<{ customer_id: string | null }[]>`
    select customer_id
    from operator_subscriptions
    where org_id = ${orgId}
    limit 1
  `;
  if (!subscription?.customer_id) {
    throw new Error("No Stripe customer exists for this workspace yet.");
  }

  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const body = new URLSearchParams({
    customer: subscription.customer_id,
    return_url: base + "/assistant/billing",
  });

  const response = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + key,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const payload = await response.json() as { url?: string; error?: { message?: string } };
  if (!response.ok || !payload.url) {
    throw new Error(payload.error?.message ?? "Stripe billing portal could not be created.");
  }
  return { url: payload.url };
}
