import { createHmac, timingSafeEqual } from "node:crypto";

export function signSalesWebhook(payload: string, secret: string) {
  return "sha256=" + createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifySalesWebhookSignature(
  payload: string,
  secret: string,
  signature: string,
) {
  const expected = Buffer.from(signSalesWebhook(payload, secret));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
