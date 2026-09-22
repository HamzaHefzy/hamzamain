import { NextResponse } from "next/server";
import { z } from "zod";
import { apiSession, errorResponse } from "@/lib/api";
import { getOperatorProfile, updateOperatorPhoneIdentity } from "@/lib/operator/profile";

const schema = z.object({
  ownerPhone: z.string().trim().regex(/^\+[1-9]\d{7,14}$/).nullable(),
});

export async function GET() {
  const auth = await apiSession("view");
  if (!auth.session) return auth.response;
  return NextResponse.json({ profile: await getOperatorProfile(auth.session.orgId) });
}

export async function PUT(request: Request) {
  const auth = await apiSession("admin");
  if (!auth.session) return auth.response;
  try {
    const input = schema.parse(await request.json());
    const profile = await updateOperatorPhoneIdentity({
      orgId: auth.session.orgId,
      ownerPhone: input.ownerPhone,
    });
    return NextResponse.json({ profile });
  } catch (error) {
    return errorResponse(error, "Unable to update phone identity.");
  }
}
