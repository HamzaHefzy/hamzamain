import { createHash, randomBytes } from "node:crypto";

export function createOpaqueToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashOpaqueToken(token) };
}

export function hashOpaqueToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
