import postgres from "postgres";

let client: ReturnType<typeof postgres> | undefined;

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required for the Operator production workspace.");
  }

  if (!client) {
    client = postgres(url, {
      max: Number(process.env.DATABASE_POOL_SIZE ?? 10),
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
      ssl: process.env.DATABASE_SSL === "false" ? false : process.env.NODE_ENV === "production" ? "require" : false,
    });
  }

  return client;
}

export async function pingDatabase() {
  const sql = db();
  const [row] = await sql<{ ok: number }[]>`select 1 as ok`;
  return row?.ok === 1;
}
