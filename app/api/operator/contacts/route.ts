import { NextResponse } from "next/server";
import { z } from "zod";
import { apiSession, errorResponse } from "@/lib/api";
import { listOperatorContacts, saveOperatorContact } from "@/lib/operator/contacts";

const contactSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  organization: z.string().trim().max(120).nullable().optional(),
  phone: z.string().trim().regex(/^\+[1-9]\d{7,14}$/).nullable().optional(),
  email: z.string().trim().email().max(320).nullable().optional(),
  aliases: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
}).refine((value) => Boolean(value.phone || value.email), {
  message: "Add at least a phone number or email address.",
});

export async function GET() {
  const auth = await apiSession("view");
  if (!auth.session) return auth.response;
  return NextResponse.json({ contacts: await listOperatorContacts(auth.session.orgId) });
}

export async function POST(request: Request) {
  const auth = await apiSession("task_write");
  if (!auth.session) return auth.response;
  try {
    const input = contactSchema.parse(await request.json());
    const contact = await saveOperatorContact({
      orgId: auth.session.orgId,
      displayName: input.displayName,
      organization: input.organization,
      phone: input.phone,
      email: input.email,
      aliases: input.aliases,
      notes: input.notes,
    });
    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Unable to save contact.");
  }
}
