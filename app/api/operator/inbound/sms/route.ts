import { db } from "@/lib/db";
import { createOperatorTask, runOperatorTask } from "@/lib/operator/service";
import { twilioWebhookUrl, twimlMessage, verifyTwilioFormRequest } from "@/lib/twilio";

function response(message: string, status = 200) {
  return new Response(twimlMessage(message), {
    status,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

export async function POST(request: Request) {
  const raw = await request.text();
  const params = new URLSearchParams(raw);
  const signature = request.headers.get("x-twilio-signature");

  if (!verifyTwilioFormRequest({
    url: twilioWebhookUrl(request),
    params,
    signature,
  })) {
    return response("Unauthorized.", 401);
  }

  const from = params.get("From")?.trim() ?? "";
  const body = params.get("Body")?.trim() ?? "";
  if (!from || body.length < 2) return response("Send me the task you want handled.");

  const sql = db();
  const [identity] = await sql<{ org_id: string; user_id: string }[]>`
    select p.org_id, m.user_id
    from operator_profiles p
    join memberships m on m.org_id = p.org_id and m.role = 'owner' and m.active = true
    join users u on u.id = m.user_id and u.active = true
    where p.owner_phone = ${from}
    order by m.created_at
    limit 1
  `;

  if (!identity) {
    return response("This phone number is not linked to an Operator workspace.", 403);
  }

  try {
    const task = await createOperatorTask({
      orgId: identity.org_id,
      userId: identity.user_id,
      request: body,
      source: "sms",
    });
    const finalTask = await runOperatorTask(identity.org_id, task.id);

    if (finalTask?.status === "awaiting_approval") {
      return response("I started that. One step needs your approval in Operator before I can continue.");
    }
    if (finalTask?.status === "waiting_external") {
      return response("I started that and I’m working on the outside-world step now.");
    }
    if (finalTask?.status === "completed") {
      return response("Done. I completed that task and saved the activity in Operator.");
    }
    return response("I added that to Operator. You can follow its progress in the command center.");
  } catch {
    return response("I could not start that task. Open Operator to review the request.", 500);
  }
}
