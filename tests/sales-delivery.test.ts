import { describe, expect, it } from "vitest";
import { signSalesWebhook } from "../lib/sales-delivery";

describe("sales webhook signing", () => {
  it("produces a stable HMAC signature for the exact payload", () => {
    const payload = JSON.stringify({ event: "lead.created", version: 1 });
    expect(signSalesWebhook(payload, "test-secret")).toBe(
      "sha256=2ca17d8e6b73b87d5d51c4f4b2eff43a80c4854eed1ac0c3e03df8b0146967c8",
    );
  });

  it("changes when the payload changes", () => {
    expect(signSalesWebhook("a", "test-secret")).not.toBe(
      signSalesWebhook("b", "test-secret"),
    );
  });
});
