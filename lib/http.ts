export function externalTimeoutMs() {
  const configured = Number(process.env.OPERATOR_EXTERNAL_TIMEOUT_MS ?? 15000);
  if (!Number.isFinite(configured)) return 15000;
  return Math.min(Math.max(Math.trunc(configured), 1000), 120000);
}

export async function fetchWithTimeout(
  input: Parameters<typeof fetch>[0],
  init: RequestInit = {},
  timeoutMs = externalTimeoutMs(),
) {
  if (init.signal) return fetch(input, init);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
