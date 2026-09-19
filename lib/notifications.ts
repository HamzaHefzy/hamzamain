import { db } from "@/lib/db";

type NotificationInput = {
  orgId: string;
  studentId?: string | null;
  caseId?: string | null;
  channel: "sms" | "email";
  recipient: string;
  templateKey: string;
  subject?: string;
  body: string;
};

async function sendSms(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) {
    throw new Error("Twilio is not configured.");
  }

  const data = new URLSearchParams({ To: to, From: from, Body: body });
  const response = await fetch(
    "https://api.twilio.com/2010-04-01/Accounts/" + sid + "/Messages.json",
    {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(sid + ":" + token).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: data,
    },
  );

  const payload = await response.json() as { sid?: string; message?: string };
  if (!response.ok) throw new Error(payload.message ?? "Twilio request failed.");
  return payload.sid ?? null;
}

async function sendEmail(to: string, subject: string, body: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!key || !from) throw new Error("Resend is not configured.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text: body,
    }),
  });

  const payload = await response.json() as { id?: string; message?: string };
  if (!response.ok) throw new Error(payload.message ?? "Email request failed.");
  return payload.id ?? null;
}

export async function sendNotification(input: NotificationInput) {
  const sql = db();

  const [row] = await sql<{ id: string }[]>`
    insert into notifications (
      org_id, student_id, case_id, channel, recipient,
      template_key, status
    )
    values (
      ${input.orgId}, ${input.studentId ?? null}, ${input.caseId ?? null},
      ${input.channel}, ${input.recipient}, ${input.templateKey}, 'queued'
    )
    returning id
  `;

  try {
    const providerMessageId = input.channel === "sms"
      ? await sendSms(input.recipient, input.body)
      : await sendEmail(
          input.recipient,
          input.subject ?? "Anchor attendance support",
          input.body,
        );

    await sql`
      update notifications
      set status = 'sent',
          provider_message_id = ${providerMessageId},
          sent_at = now()
      where id = ${row.id}
    `;

    return { id: row.id, providerMessageId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Notification failed.";
    await sql`
      update notifications
      set status = 'failed', error = ${message}
      where id = ${row.id}
    `;
    throw error;
  }
}
