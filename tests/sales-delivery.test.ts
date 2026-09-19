import { describe, expect, it } from "vitest";
import { signSalesWebhook } from "../lib/sales-delivery";

describe("sales webhook signing", () => {
  it("produces a stable HMAC signature for the exact payload", () => {
    const payload = JSON.stringify({ event: "lead.created", version: 1 });
    expect(signSalesWebhook(payload, "test-secret")).toBe(
      "sha256=d56a00f2f93df515e285562b100fb48e1443ecf221b1b6e7bb7c087c066f93c7",
    );
  });

  it("changes when the payload changes", () => {
    expect(signSalesWebhook("a", "test-secret")).not.toBe(
      signSalesWebhook("b", "test-secret"),
    );
  });
});
