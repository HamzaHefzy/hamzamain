import { NextResponse } from "next/server";
import { applyStripeEvent, verifyStripeWebhook } from "@/lib/operator/billing";

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature || !verifyStripeWebhook(raw, signature)) {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 401 });
  }

  try {
    const event = JSON.parse(raw) as {
      id: string;
      type: string;
      data: { object: Record<string, unknown> };
    };
    if (!event.id || !event.type || !event.data?.object) {
      return NextResponse.json({ error: "Invalid Stripe event." }, { status: 400 });
    }
    const result = await applyStripeEvent(event);
    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook failed." },
      { status: 400 },
    );
  }
}
