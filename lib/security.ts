import { createHash } from "node:crypto";
import type { OperatorRole } from "@/lib/auth";

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;

  const requestUrl = new URL(request.url);
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const allowed = configured ? new URL(configured).origin : requestUrl.origin;

  if (origin !== allowed && origin !== requestUrl.origin) {
    throw new Error("Cross-origin mutation rejected.");
  }
}

export function hashIp(ip: string | null) {
  if (!ip) return null;
  const salt = process.env.AUTH_SECRET ?? "operator";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 24);
}

export function requestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? null;
}

export function hasRole(role: OperatorRole, allowed: OperatorRole[]) {
  return allowed.includes(role);
}
