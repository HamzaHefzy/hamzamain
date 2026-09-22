import { db } from "@/lib/db";
import { twilioWebhookUrl, twimlVoiceSay, verifyTwilioFormRequest } from "@/lib/twilio";

export async function POST(request: Request) {
  const raw = await request.text();
  const params = new URLSearchParams(raw);
  const signature = request.headers.get("x-twilio-signature");
  const publicUrl = twilioWebhookUrl(request);

  if (!verifyTwilioFormRequest({ url: publicUrl, params, signature })) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const taskId = url.searchParams.get("taskId");
  const stepId = url.searchParams.get("stepId");
  if (!taskId || !stepId) return new Response("Missing task context.", { status: 400 });

  const sql = db();
  const [row] = await sql<{ summary: string; request: Record<string, unknown> }[]>`
    select summary, request
    from operator_steps
    where id = ${stepId} and task_id = ${taskId}
    limit 1
  `;
  if (!row) return new Response("Task step not found.", { status: 404 });

  const objective =
    typeof row.request.objective === "string" ? row.request.objective : row.summary;
  const script =
    "Hello. I am an automated personal assistant calling on behalf of my user. " +
    "I am calling about this request: " + objective +
    ". This basic phone fallback can deliver the request, but a connected conversational voice agent is required for a live back-and-forth conversation.";

  return new Response(twimlVoiceSay(script), {
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}
