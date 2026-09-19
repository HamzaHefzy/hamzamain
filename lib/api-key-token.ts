import { createHash, randomBytes } from "node:crypto";

export const API_KEY_PREFIX = "ank_live_";

export function hashApiKey(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createIntegrationApiKey() {
  const token = API_KEY_PREFIX + randomBytes(32).toString("base64url");
  return {
    token,
    prefix: token.slice(0, 18),
    hash: hashApiKey(token),
  };
}

export function looksLikeIntegrationApiKey(token: string) {
  return token.startsWith(API_KEY_PREFIX) && token.length >= 40;
}
