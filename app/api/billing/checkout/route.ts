import { NextResponse } from "next/server";
import { z } from "zod";
import { apiSession, errorResponse } from "@/lib/api";
import { createCheckoutSession } from "@/lib/operator/billing";

const schema = z.object({
  plan: z.enum(["assistant", "operator", "concierge"]),
});

export async function POST(request: Request) {
  const auth = await apiSession("admin");
  if (!auth.session) return auth.response;

  try {
    const { plan } = schema.parse(await request.json());
    const checkout = await createCheckoutSession({
      orgId: auth.session.orgId,
      email: auth.session.email,
      plan,
    });
    return NextResponse.json(checkout);
  } catch (error) {
    return errorResponse(error, "Unable to start checkout.");
  }
}
