import { NextResponse } from "next/server";
import { z } from "zod";
import { apiSession, errorResponse } from "@/lib/api";
import { getOperatorProfile, updateOperatorProfileSettings } from "@/lib/operator/profile";

const schema = z.object({
  ownerPhone: z.string().trim().regex(/^\+[1-9]\d{7,14}$/).nullable().optional(),
  notifyEmail: z.boolean().optional(),
  notifySms: z.boolean().optional(),
  homeBase: z.string().trim().max(240).nullable().optional(),
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
    const profile = await updateOperatorProfileSettings({
      orgId: auth.session.orgId,
      ownerPhone: input.ownerPhone,
      notifyEmail: input.notifyEmail,
      notifySms: input.notifySms,
      homeBase: input.homeBase,
    });
    return NextResponse.json({ profile });
  } catch (error) {
    return errorResponse(error, "Unable to update Operator settings.");
  }
}
