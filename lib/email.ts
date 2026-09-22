export async function sendEmail(input: { to: string; subject: string; body: string }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!key || !from) throw new Error("Resend is not configured.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [input.to], subject: input.subject, text: input.body }),
  });

  const payload = await response.json() as { id?: string; message?: string };
  if (!response.ok) throw new Error(payload.message ?? "Email request failed.");
  return payload.id ?? null;
}
