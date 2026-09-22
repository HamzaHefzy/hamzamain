import { db } from "@/lib/db";

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (char) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;",
  }[char] ?? char));
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const expected = process.env.OPERATOR_WEBHOOK_SECRET;
  if (expected && url.searchParams.get("secret") !== expected) {
    return new Response("Unauthorized", { status: 401 });
  }

  const taskId = url.searchParams.get("taskId");
  const stepId = url.searchParams.get("stepId");
  if (!taskId || !stepId) return new Response("Missing task context.", { status: 400 });

  const sql = db();
  const [row] = await sql<{ summary: string; request: Record<string, unknown> }[]>`
    select summary, request from operator_steps where id = ${stepId} and task_id = ${taskId} limit 1
  `;
  if (!row) return new Response("Task step not found.", { status: 404 });

  const objective = typeof row.request.objective === "string" ? row.request.objective : row.summary;
  const script =
    "Hello. I am an automated personal assistant calling on behalf of my user. " +
    "I am calling to help with the following request: " + objective +
    ". If this requires a live conversation, please hold while I connect the authorized workflow.";

  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say>${escapeXml(script)}</Say><Pause length="1"/><Hangup/></Response>`;
  return new Response(xml, { headers: { "Content-Type": "text/xml; charset=utf-8" } });
}
