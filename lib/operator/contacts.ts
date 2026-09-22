import { db } from "@/lib/db";
import { resolveNamedGooglePlace } from "@/lib/operator/places";
import { getOperatorProfile } from "@/lib/operator/profile";

export type OperatorContact = {
  id: string;
  display_name: string;
  organization: string | null;
  phone: string | null;
  email: string | null;
  aliases: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export async function listOperatorContacts(orgId: string) {
  const sql = db();
  return sql<OperatorContact[]>`
    select id, display_name, organization, phone, email, aliases, notes, created_at, updated_at
    from operator_contacts
    where org_id = ${orgId}
    order by lower(display_name)
  `;
}

export async function saveOperatorContact(input: {
  orgId: string;
  id?: string | null;
  displayName: string;
  organization?: string | null;
  phone?: string | null;
  email?: string | null;
  aliases?: string[];
  notes?: string | null;
}) {
  const sql = db();
  const aliases = Array.from(
    new Set((input.aliases ?? []).map((value) => value.trim()).filter(Boolean)),
  ).slice(0, 20);

  if (input.id) {
    const [contact] = await sql<OperatorContact[]>`
      update operator_contacts
      set display_name = ${input.displayName.trim()},
          organization = ${input.organization?.trim() || null},
          phone = ${input.phone?.trim() || null},
          email = ${input.email?.trim().toLowerCase() || null},
          aliases = ${aliases},
          notes = ${input.notes?.trim() || null},
          updated_at = now()
      where id = ${input.id} and org_id = ${input.orgId}
      returning id, display_name, organization, phone, email, aliases, notes, created_at, updated_at
    `;
    if (!contact) throw new Error("Contact not found.");
    return contact;
  }

  const [contact] = await sql<OperatorContact[]>`
    insert into operator_contacts (
      org_id, display_name, organization, phone, email, aliases, notes
    )
    values (
      ${input.orgId}, ${input.displayName.trim()},
      ${input.organization?.trim() || null},
      ${input.phone?.trim() || null},
      ${input.email?.trim().toLowerCase() || null},
      ${aliases},
      ${input.notes?.trim() || null}
    )
    returning id, display_name, organization, phone, email, aliases, notes, created_at, updated_at
  `;
  return contact;
}

export async function deleteOperatorContact(orgId: string, contactId: string) {
  const sql = db();
  const result = await sql`
    delete from operator_contacts
    where id = ${contactId} and org_id = ${orgId}
  `;
  return result.count > 0;
}

function scoreContact(contact: OperatorContact, haystack: string) {
  const candidates: Array<{ value: string | null; weight: number }> = [
    { value: contact.display_name, weight: 100 },
    { value: contact.organization, weight: 40 },
    ...contact.aliases.map((value) => ({ value, weight: 80 })),
  ];

  let best = 0;
  for (const candidate of candidates) {
    const value = candidate.value?.trim().toLowerCase();
    if (!value || value.length < 2) continue;
    if (haystack.includes(value)) {
      best = Math.max(best, candidate.weight + Math.min(value.length, 30));
    }
  }
  return best;
}

export async function resolveOperatorDestination(input: {
  orgId: string;
  kind: "voice" | "email";
  taskRequest: string;
  request: Record<string, unknown>;
}) {
  if (typeof input.request.to === "string" && input.request.to.trim()) {
    return input.request;
  }

  if (input.kind === "voice") {
    const direct = input.taskRequest.match(/\+[1-9]\d{7,14}/)?.[0];
    if (direct) return { ...input.request, to: direct, destinationSource: "request" };
  } else {
    const direct = input.taskRequest.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
    if (direct) {
      return {
        ...input.request,
        to: direct.toLowerCase(),
        destinationSource: "request",
      };
    }
  }

  const contacts = await listOperatorContacts(input.orgId);
  const haystack = input.taskRequest.toLowerCase();
  const ranked = contacts
    .map((contact) => ({ contact, score: scoreContact(contact, haystack) }))
    .filter(({ contact, score }) =>
      score > 0 && Boolean(input.kind === "voice" ? contact.phone : contact.email),
    )
    .sort((a, b) => b.score - a.score);

  if (!ranked.length) {
    if (input.kind === "voice" && process.env.GOOGLE_MAPS_API_KEY) {
      const profile = await getOperatorProfile(input.orgId);
      const place = await resolveNamedGooglePlace({
        query: input.taskRequest,
        homeBase: profile?.home_base ?? null,
      });

      if (place.resolved?.internationalPhoneNumber || place.resolved?.nationalPhoneNumber) {
        return {
          ...input.request,
          to:
            place.resolved.internationalPhoneNumber ??
            place.resolved.nationalPhoneNumber,
          contactName: place.resolved.displayName,
          destinationSource: "google-places",
          placeId: place.resolved.id,
          placeAddress: place.resolved.formattedAddress,
          placeWebsite: place.resolved.websiteUri,
          googleMapsUri: place.resolved.googleMapsUri,
        };
      }

      return {
        ...input.request,
        contactResolutionError:
          place.candidates.length > 0
            ? "Google Maps found possible businesses, but Operator will not guess which one you meant. Name the business more specifically."
            : "No matching phone number was found in your private contacts or Google Maps.",
        placeCandidates: place.candidates,
      };
    }

    return {
      ...input.request,
      contactResolutionError:
        "No matching " +
        (input.kind === "voice" ? "phone number" : "email address") +
        " was found in your private contacts.",
    };
  }

  if (ranked.length > 1 && ranked[0].score === ranked[1].score) {
    return {
      ...input.request,
      contactResolutionError:
        "More than one private contact matches this request. Name the person or organization more specifically.",
    };
  }

  const contact = ranked[0].contact;
  return {
    ...input.request,
    to: input.kind === "voice" ? contact.phone : contact.email,
    contactId: contact.id,
    contactName: contact.display_name,
    destinationSource: "private-contact",
  };
}
