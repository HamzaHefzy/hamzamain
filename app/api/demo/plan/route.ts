import { NextResponse } from "next/server";
import { z } from "zod";
import { planOperatorTask } from "@/lib/operator/planner";
import { rateLimit } from "@/lib/rate-limit";
import { assertSameOrigin, hashIp, requestIp } from "@/lib/security";

const schema = z.object({
  request: z.string().trim().min(4).max(2000),
});

function iconFor(kind: string, provider?: string | null) {
  if (provider === "google-places") return "M";
  if (provider === "brave-search") return "⌕";
  if (kind === "voice") return "☎";
  if (kind === "email") return "✉";
  if (kind === "calendar") return "▣";
  if (kind === "payment") return "$";
  if (kind === "browser") return "↗";
  if (kind === "api") return "◇";
  if (kind === "human") return "H";
  return "•";
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const ipKey = hashIp(requestIp(request)) ?? "unknown";
    const limited = await rateLimit("public-demo:" + ipKey, 30, 3600);
    if (!limited.allowed) {
      return NextResponse.json(
        { error: "Demo limit reached for this hour. Try again shortly." },
        { status: 429 },
      );
    }

    const input = schema.parse(await request.json());
    const plan = planOperatorTask(input.request);

    return NextResponse.json({
      title: plan.title,
      category: plan.category,
      request: input.request,
      steps: [
        ...plan.steps.map((step) => ({
          icon: iconFor(step.kind, step.provider),
          title: step.summary,
          detail: step.requiresApproval
            ? "Yumna pauses here until you approve this consequential action."
            : step.provider
              ? "Execution path: " + step.provider.replaceAll("-", " ")
              : "Planned inside the governed task workflow.",
          type: step.requiresApproval ? "approval" : "work",
        })),
        {
          icon: "✓",
          title: "Outcome recorded",
          detail: "The task, provider results, receipts, and audit trail stay together.",
          type: "done",
        },
      ],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to plan this demo task.",
      },
      { status: 400 },
    );
  }
}
