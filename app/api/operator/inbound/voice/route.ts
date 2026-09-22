import { db } from "@/lib/db";
import { createOperatorTask } from "@/lib/operator/service";
import { twilioWebhookUrl, twimlVoiceGather, twimlVoiceSay, verifyTwilioFormRequest } from "@/lib/twilio";

function xml(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

export async function POST(request: Request) {
  const raw = await request.text();
  const params = new URLSearchParams(raw);
  const signature = request.headers.get("x-twilio-signature");
  const publicUrl = twilioWebhookUrl(request);

  if (!verifyTwilioFormRequest({ url: publicUrl, params, signature })) {
    return xml(twimlVoiceSay("Unauthorized."), 401);
  }

  const to = params.get("To")?.trim() ?? "";
  const from = params.get("From")?.trim() ?? "unknown caller";
  if (!to) return xml(twimlVoiceSay("This Operator number is not configured."), 400);

  const sql = db();
  const [identity] = await sql<{
    org_id: string;
    user_id: string;
    assistant_name: string;
  }[]>`
    select p.org_id, m.user_id, p.assistant_name
    from operator_profiles p
    join memberships m
      on m.org_id = p.org_id
      and m.role = 'owner'
      and m.active = true
    join users u on u.id = m.user_id and u.active = true
    where p.assistant_phone = ${to}
    order by m.created_at
    limit 1
  `;

  if (!identity) {
    return xml(twimlVoiceSay("This Operator number is not linked to an active workspace."), 404);
  }

  const speech = params.get("SpeechResult")?.trim();
  if (!speech) {
    const greeting =
      "Hello. You have reached " + identity.assistant_name +
      ", an automated personal assistant. Please say your name, why you are calling, and any callback details after the tone.";
    return xml(twimlVoiceGather({ greeting, action: publicUrl }));
  }

  try {
    const message = speech.slice(0, 3500);
    const task = await createOperatorTask({
      orgId: identity.org_id,
      userId: identity.user_id,
      request: "Incoming call from " + from + ": " + message,
      source: "voice",
      priority: "normal",
    });
    return xml(twimlVoiceSay(
      "Thank you. I recorded your message and added it to " +
      identity.assistant_name +
      " for follow-up. Your reference is " +
      task.id.slice(0, 8) +
      ". Goodbye.",
    ));
  } catch {
    return xml(twimlVoiceSay(
      "I am sorry, I could not record a new task for this workspace right now. Please try again later.",
    ), 500);
  }
}
