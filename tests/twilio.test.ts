import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyTwilioFormRequest } from "@/lib/twilio";

describe("Twilio webhook verification", () => {
  it("accepts a correctly signed form request", () => {
    process.env.TWILIO_AUTH_TOKEN = "test-auth-token";
    const url = "https://operator.example/api/operator/inbound/sms";
    const params = new URLSearchParams({
      Body: "Book dinner Friday",
      From: "+19195550123",
      To: "+19195550999",
    });

    let payload = url;
    for (const key of Array.from(new Set(params.keys())).sort()) {
      for (const value of params.getAll(key).sort()) payload += key + value;
    }
    const signature = createHmac("sha1", process.env.TWILIO_AUTH_TOKEN)
      .update(payload, "utf8")
      .digest("base64");

    expect(verifyTwilioFormRequest({ url, params, signature })).toBe(true);
    expect(verifyTwilioFormRequest({ url, params, signature: signature + "x" })).toBe(false);
  });
});
