import { afterEach, describe, expect, it } from "vitest";
import { vapiConfigured } from "@/lib/operator/vapi";

const keys = [
  "VAPI_API_KEY",
  "VAPI_ASSISTANT_ID",
  "VAPI_PHONE_NUMBER_ID",
  "VAPI_WEBHOOK_SECRET",
] as const;

afterEach(() => {
  for (const key of keys) delete process.env[key];
});

describe("Vapi configuration", () => {
  it("requires all conversational calling credentials", () => {
    expect(vapiConfigured()).toBe(false);
    process.env.VAPI_API_KEY = "key";
    process.env.VAPI_ASSISTANT_ID = "assistant";
    process.env.VAPI_PHONE_NUMBER_ID = "phone";
    expect(vapiConfigured()).toBe(false);
    process.env.VAPI_WEBHOOK_SECRET = "secret";
    expect(vapiConfigured()).toBe(true);
  });
});
