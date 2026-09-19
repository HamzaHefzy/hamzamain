import { describe, expect, it } from "vitest";
import {
  API_KEY_PREFIX,
  createIntegrationApiKey,
  hashApiKey,
  looksLikeIntegrationApiKey,
} from "../lib/api-key-token";

describe("integration API keys", () => {
  it("creates high-entropy prefixed keys and stores only a hash/prefix", () => {
    const created = createIntegrationApiKey();
    expect(created.token.startsWith(API_KEY_PREFIX)).toBe(true);
    expect(created.token.length).toBeGreaterThan(40);
    expect(created.prefix).toBe(created.token.slice(0, 18));
    expect(created.hash).toBe(hashApiKey(created.token));
    expect(created.hash).not.toContain(created.token);
  });

  it("recognizes only Anchor live integration key shapes", () => {
    const created = createIntegrationApiKey();
    expect(looksLikeIntegrationApiKey(created.token)).toBe(true);
    expect(looksLikeIntegrationApiKey("not-a-key")).toBe(false);
  });
});
