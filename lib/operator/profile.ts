import { db } from "@/lib/db";

export type OperatorProfile = {
  org_id: string;
  assistant_name: string;
  timezone: string;
  assistant_phone: string | null;
  owner_phone: string | null;
  assistant_email: string | null;
  home_base: string | null;
  preferences: Record<string, unknown>;
};

export async function getOperatorProfile(orgId: string) {
  const sql = db();
  const [profile] = await sql<OperatorProfile[]>`
    select org_id, assistant_name, timezone, assistant_phone, owner_phone,
           assistant_email, home_base, preferences
    from operator_profiles
    where org_id = ${orgId}
    limit 1
  `;
  return profile ?? null;
}

export async function updateOperatorPhoneIdentity(input: {
  orgId: string;
  ownerPhone: string | null;
}) {
  const sql = db();
  const assistantPhone = process.env.TWILIO_FROM_NUMBER ?? null;
  const [profile] = await sql<OperatorProfile[]>`
    update operator_profiles
    set owner_phone = ${input.ownerPhone},
        assistant_phone = coalesce(${assistantPhone}, assistant_phone),
        updated_at = now()
    where org_id = ${input.orgId}
    returning org_id, assistant_name, timezone, assistant_phone, owner_phone,
              assistant_email, home_base, preferences
  `;
  if (!profile) throw new Error("Operator profile not found.");
  return profile;
}
