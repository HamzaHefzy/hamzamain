import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { fetchWithTimeout } from "@/lib/http";

type NoticeKind = "approval" | "completed" | "failed";

type NoticeInput = {
  orgId: string;
  taskId: string;
  kind: NoticeKind;
  title: string;
  detail: string;
  eventKey: string;
};

type Recipient = {
  email: string;
  owner_phone: string | null;
  preferences: Record<string, unknown>;
};

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function notificationPreferences(preferences: Record<string, unknown>) {
  const raw =
    preferences.notifications && typeof preferences.notifications === "object"
      ? preferences.notifications as Record<string, unknown>
      : {};
  return {
    email: raw.email !== false,
    sms: raw.sms === true,
  };
}

async function ownerRecipient(orgId: string) {
  const sql = db();
  const [recipient] = await sql<Recipient[]>`
    select u.email, p.owner_phone, p.preferences
    from operator_profiles p
    join memberships m
      on m.org_id = p.org_id
      and m.role = 'owner'
      and m.active = true
    join users u on u.id = m.user_id and u.active = true
    where p.org_id = ${orgId}
    order by m.created_at
    limit 1
  `;
  return recipient ?? null;
}

async function claim(input: NoticeInput, channel: "email" | "sms") {
  const sql = db();
  const [row] = await sql<{ id: number }[]>`
    insert into operator_notification_events (
      org_id, task_id, event_key, channel, status
    )
    values (
      ${input.orgId}, ${input.taskId}, ${input.eventKey}, ${channel}, 'pending'
    )
    on conflict (org_id, event_key, channel) do nothing
    returning id
  `;
  return row?.id ?? null;
}

async function markSent(id: number, providerId: string | null) {
  const sql = db();
  await sql`
    update operator_notification_events
    set status = 'sent', provider_id = ${providerId}, sent_at = now(), error = null
    where id = ${id}
  `;
}

async function markFailed(id: number, error: unknown) {
  const sql = db();
  await sql`
    update operator_notification_events
    set status = 'failed',
        error = ${error instanceof Error ? error.message : "Notification delivery failed."}
    where id = ${id}
  `;
}

async function sendSms(to: string, bodyText: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) throw new Error("Twilio SMS is not configured.");

  const body = new URLSearchParams({ To: to, From: from, Body: bodyText });
  const response = await fetchWithTimeout(
    "https://api.twilio.com/2010-04-01/Accounts/" + sid + "/Messages.json",
    {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(sid + ":" + token).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );
  const payload = await response.json().catch(() => ({})) as {
    sid?: string;
    message?: string;
  };
  if (!response.ok) throw new Error(payload.message ?? "Twilio SMS failed.");
  return payload.sid ?? null;
}

function copy(input: NoticeInput) {
  const taskUrl = siteUrl() + "/assistant/tasks/" + input.taskId;
  if (input.kind === "approval") {
    return {
      subject: "Operator needs your approval",
      email:
        "Operator paused a task because it needs your approval.\n\n" +
        input.title + "\n" + input.detail + "\n\nReview: " + taskUrl,
      sms:
        "Operator needs approval: " + input.title + ". Review: " + taskUrl,
    };
  }
  if (input.kind === "failed") {
    return {
      subject: "Operator needs attention",
      email:
        "Operator could not finish a task.\n\n" +
        input.title + "\n" + input.detail + "\n\nReview: " + taskUrl,
      sms:
        "Operator needs attention: " + input.title + ". Review: " + taskUrl,
    };
  }
  return {
    subject: "Operator finished your task",
    email:
      "Operator completed a task.\n\n" +
      input.title + "\n" + input.detail + "\n\nDetails: " + taskUrl,
    sms:
      "Operator finished: " + input.title + ". Details: " + taskUrl,
  };
}

export async function notifyOperator(input: NoticeInput) {
  const recipient = await ownerRecipient(input.orgId);
  if (!recipient) return { sent: [] as string[] };

  const prefs = notificationPreferences(recipient.preferences ?? {});
  const message = copy(input);
  const sent: string[] = [];

  if (
    prefs.email &&
    process.env.RESEND_API_KEY &&
    process.env.RESEND_FROM_EMAIL
  ) {
    const notificationId = await claim(input, "email");
    if (notificationId) {
      try {
        const providerId = await sendEmail({
          to: recipient.email,
          subject: message.subject,
          body: message.email,
        });
        await markSent(notificationId, providerId);
        sent.push("email");
      } catch (error) {
        await markFailed(notificationId, error);
      }
    }
  }

  if (
    prefs.sms &&
    recipient.owner_phone &&
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM_NUMBER
  ) {
    const notificationId = await claim(input, "sms");
    if (notificationId) {
      try {
        const providerId = await sendSms(recipient.owner_phone, message.sms);
        await markSent(notificationId, providerId);
        sent.push("sms");
      } catch (error) {
        await markFailed(notificationId, error);
      }
    }
  }

  return { sent };
}
