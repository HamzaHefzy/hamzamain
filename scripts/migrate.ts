import "./load-env";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";

async function main() {
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required.");

const sql = postgres(url, { max: 1, prepare: false });

await sql`
  create table if not exists schema_migrations (
    filename text primary key,
    applied_at timestamptz not null default now()
  )
`;

const dir = join(process.cwd(), "db", "migrations");
const files = (await readdir(dir))
  .filter((name) => name.endsWith(".sql"))
  .sort();

for (const filename of files) {
  const [existing] = await sql<{ filename: string }[]>`
    select filename from schema_migrations where filename = ${filename}
  `;

  if (existing) continue;

  const source = await readFile(join(dir, filename), "utf8");
  console.log("Applying", filename);

  await sql.begin(async (tx) => {
    await tx.unsafe(source);
    await tx`
      insert into schema_migrations (filename)
      values (${filename})
    `;
  });
}

await sql.end();
console.log("Database migrations complete.");

}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
