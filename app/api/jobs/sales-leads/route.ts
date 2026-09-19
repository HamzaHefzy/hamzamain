import { NextResponse } from "next/server";
import { retryFailedSalesLeadDeliveries } from "@/lib/sales-delivery";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (!secret || auth !== "Bearer " + secret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await retryFailedSalesLeadDeliveries(50);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sales lead retry failed." },
      { status: 500 },
    );
  }
}
