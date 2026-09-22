import { describe, expect, it } from "vitest";
import { planOperatorTask } from "@/lib/operator/planner";

describe("Operator planner", () => {
  it("plans a dinner reservation with transaction controls", () => {
    const plan = planOperatorTask("Book dinner for four Friday at 7 near downtown under $100 per person");
    expect(plan.category).toBe("dining");
    expect(plan.steps.some((step) => step.kind === "browser")).toBe(true);
    expect(plan.steps.some((step) => step.kind === "payment" && step.requiresApproval)).toBe(true);
    expect(plan.steps.some((step) => step.kind === "calendar")).toBe(true);
  });

  it("plans administrative phone work", () => {
    const plan = planOperatorTask("Call my internet provider, wait on hold, and cancel the old plan");
    expect(plan.category).toBe("administration");
    expect(plan.steps.some((step) => step.kind === "voice")).toBe(true);
  });

  it("rejects empty requests", () => {
    expect(() => planOperatorTask("  ")).toThrow();
  });

  it("keeps restaurant discovery non-transactional until the user asks to book", () => {
    const plan = planOperatorTask("Find three restaurants near downtown");
    expect(plan.category).toBe("dining");
    expect(plan.steps.some((step) => step.kind === "browser")).toBe(true);
    expect(plan.steps.some((step) => step.kind === "payment")).toBe(false);
    expect(plan.steps.some((step) => step.kind === "calendar")).toBe(false);
  });

});
