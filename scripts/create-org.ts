import "./load-env";
import bcrypt from "bcryptjs";
import postgres from "postgres";

async function main() {
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required.");

const required = {
  name: process.env.NEW_ORG_NAME,
  slug: process.env.NEW_ORG_SLUG,
  adminEmail: process.env.NEW_ORG_ADMIN_EMAIL,
  adminName: process.env.NEW_ORG_ADMIN_NAME,
  adminPassword: process.env.NEW_ORG_ADMIN_PASSWORD,
};

for (const [key, value] of Object.entries(required)) {
  if (!value) throw new Error("Missing environment value for " + key + ".");
}
if (required.adminPassword!.length < 12) {
  throw new Error("NEW_ORG_ADMIN_PASSWORD must contain at least 12 characters.");
}

const state = process.env.NEW_ORG_STATE ?? "TX";
const timezone = process.env.NEW_ORG_TIMEZONE ?? "America/Chicago";
const organizationType = process.env.NEW_ORG_TYPE ?? "district";
const sql = postgres(url, { max: 1, prepare: false });
const passwordHash = await bcrypt.hash(required.adminPassword!, 12);

const result = await sql.begin(async (tx) => {
  const [org] = await tx<{ id: string; slug: string }[]>`
    insert into organizations (
      name, slug, organization_type, state, timezone, status
    )
    values (
      ${required.name!}, ${required.slug!}, ${organizationType},
      ${state}, ${timezone}, 'trial'
    )
    returning id, slug
  `;

  const [user] = await tx<{ id: string }[]>`
    insert into users (email, name, password_hash)
    values (
      ${required.adminEmail!.toLowerCase()},
      ${required.adminName!},
      ${passwordHash}
    )
    on conflict (email) do update
      set active = true
    returning id
  `;

  await tx`
    insert into memberships (user_id, org_id, role)
    values (${user.id}, ${org.id}, 'owner')
    on conflict (user_id, org_id) do update
      set role = 'owner', active = true
  `;

  if (state === "TX") {
    await tx`
      insert into funding_assumptions (
        org_id, school_year, model_type, basic_allotment
      )
      values (${org.id}, '2026-27', 'texas_ada', 6215)
      on conflict (org_id) do nothing
    `;
  }

  return org;
});

await sql.end();
console.log("Organization created:", result.slug);
console.log("Owner:", required.adminEmail);

}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
