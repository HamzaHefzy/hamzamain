import { db } from "@/lib/db";

export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  const sql = db();
  const now = new Date();
  const windowStart = new Date(
    Math.floor(now.getTime() / (windowSeconds * 1000)) * windowSeconds * 1000,
  );

  const rows = await sql<{ count: number }[]>\`
    insert into rate_limits (key, window_start, count)
    values (\${key}, \${windowStart}, 1)
    on conflict (key, window_start)
    do update set count = rate_limits.count + 1
    returning count
  \`;

  const count = rows[0]?.count ?? 1;
  return { allowed: count <= limit, count };
}
