import { db } from "@/lib/db";
import { toJson } from "@/lib/json";

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

export async function updateOperatorProfileSettings(input: {
  orgId: string;
  ownerPhone?: string | null;
  assistantPhone?: string | null;
  notifyEmail?: boolean;
  notifySms?: boolean;
  homeBase?: string | null;
}) {
  const sql = db();
  const current = await getOperatorProfile(input.orgId);
  if (!current) throw new Error("Operator profile not found.");

  const rawNotifications =
    current.preferences.notifications &&
    typeof current.preferences.notifications === "object"
      ? current.preferences.notifications as Record<string, unknown>
      : {};
  const preferences = {
    ...current.preferences,
    notifications: {
      ...rawNotifications,
      ...(input.notifyEmail === undefined ? {} : { email: input.notifyEmail }),
      ...(input.notifySms === undefined ? {} : { sms: input.notifySms }),
    },
  };

  const provisionedAssistantPhone =
    input.assistantPhone === undefined
      ? process.env.TWILIO_FROM_NUMBER ?? current.assistant_phone
      : input.assistantPhone;

  const [profile] = await sql<OperatorProfile[]>`
    update operator_profiles
    set owner_phone = ${input.ownerPhone === undefined ? current.owner_phone : input.ownerPhone},
        assistant_phone = ${provisionedAssistantPhone ?? null},
        home_base = ${input.homeBase === undefined ? current.home_base : input.homeBase?.trim() || null},
        preferences = ${sql.json(toJson(preferences))},
        updated_at = now()
    where org_id = ${input.orgId}
    returning org_id, assistant_name, timezone, assistant_phone, owner_phone,
              assistant_email, home_base, preferences
  `;
  if (!profile) throw new Error("Operator profile not found.");
  return profile;
}

export async function updateOperatorPhoneIdentity(input: {
  orgId: string;
  ownerPhone: string | null;
  assistantPhone?: string | null;
}) {
  return updateOperatorProfileSettings(input);
}
