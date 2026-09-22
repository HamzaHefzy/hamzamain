import { createHmac, timingSafeEqual } from "node:crypto";

export function twilioWebhookUrl(request: Request) {
  const incoming = new URL(request.url);
  const configured = process.env.TWILIO_WEBHOOK_BASE_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  if (!configured) return incoming.toString();
  const base = new URL(configured);
  base.pathname = incoming.pathname;
  base.search = incoming.search;
  return base.toString();
}

export function verifyTwilioFormRequest(input: {
  url: string;
  params: URLSearchParams;
  signature: string | null;
}) {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token || !input.signature) return false;

  let payload = input.url;
  const keys = Array.from(new Set(input.params.keys())).sort();
  for (const key of keys) {
    const values = input.params.getAll(key).sort();
    for (const value of values) payload += key + value;
  }

  const expected = createHmac("sha1", token).update(payload, "utf8").digest("base64");
  if (expected.length !== input.signature.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(input.signature));
}

export function twimlMessage(message: string) {
  const escaped = message.replace(/[<>&'"]/g, (char) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;",
  }[char] ?? char));
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`;
}
