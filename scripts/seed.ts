import "./load-env";
import bcrypt from "bcryptjs";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required.");

  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) {
    throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (12+ chars) are required.");
  }

  const orgName = process.env.SEED_ORG_NAME ?? "Operator Demo";
  const orgSlug = process.env.SEED_ORG_SLUG ?? "operator-demo";
  const sql = postgres(url, { max: 1, prepare: false });
  const passwordHash = await bcrypt.hash(password, 12);

  await sql.begin(async (tx) => {
    const [org] = await tx<{ id: string }[]>`
      insert into organizations (name, slug, timezone, status)
      values (${orgName}, ${orgSlug}, 'America/New_York', 'trial')
      on conflict (slug) do update set name = excluded.name
      returning id
    `;

    const [user] = await tx<{ id: string }[]>`
      insert into users (email, name, password_hash, email_verified_at)
      values (${email.toLowerCase()}, 'Operator Owner', ${passwordHash}, now())
      on conflict (email) do update
        set password_hash = excluded.password_hash,
            name = excluded.name,
            email_verified_at = now(),
            active = true
      returning id
    `;

    await tx`
      insert into memberships (user_id, org_id, role)
      values (${user.id}, ${org.id}, 'owner')
      on conflict (user_id, org_id) do update
        set role = 'owner', active = true
    `;

    await tx`
      insert into operator_profiles (org_id, assistant_name, timezone)
      values (${org.id}, 'Operator', 'America/New_York')
      on conflict (org_id) do nothing
    `;

    await tx`
      insert into operator_subscriptions (org_id, plan, status)
      values (${org.id}, 'trial', 'trialing')
      on conflict (org_id) do nothing
    `;
  });

  await sql.end();
  console.log("Seed complete. Sign in as", email);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
