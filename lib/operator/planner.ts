import type { PlannedStep, TaskPlan } from "@/lib/operator/types";

const includesAny = (value: string, terms: string[]) => terms.some((term) => value.includes(term));

function titleFromRequest(request: string) {
  const clean = request.trim().replace(/\s+/g, " ");
  if (clean.length <= 72) return clean;
  return clean.slice(0, 69).trimEnd() + "…";
}

function step(input: PlannedStep): PlannedStep {
  return input;
}

export function planOperatorTask(rawRequest: string): TaskPlan {
  const request = rawRequest.trim();
  if (request.length < 4) throw new Error("Tell Operator what you want handled.");
  const text = request.toLowerCase();
  const steps: PlannedStep[] = [];
  const assumptions: string[] = [];
  let category = "general";

  const isRestaurant = includesAny(text, ["restaurant", "dinner", "reservation", "brunch", "lunch"]);
  const isAppointment = includesAny(text, ["appointment", "dentist", "doctor", "salon", "barber", "mechanic"]);
  const isTravel = includesAny(text, ["flight", "hotel", "trip", "airline", "rental car"]);
  const isPurchase = includesAny(text, ["buy", "purchase", "order", "book", "reserve"]);
  const isCancel = includesAny(text, ["cancel", "subscription", "refund", "return"]);
  const isCall = includesAny(text, ["call", "phone", "hold", "speak to", "ask them"]);
  const isCalendar = isRestaurant || isAppointment || isTravel || includesAny(text, ["calendar", "schedule", "reschedule", "reservation", "meeting"]);
  const isEmail = includesAny(text, ["email", "send", "reply", "message"]);
  const involvesSpend = isPurchase || isRestaurant || isTravel || includesAny(text, ["pay", "quote", "price", "$"]);

  if (isRestaurant) category = "dining";
  else if (isAppointment) category = "appointments";
  else if (isTravel) category = "travel";
  else if (isCancel) category = "administration";
  else if (isEmail) category = "communications";

  steps.push(step({
    kind: "research",
    summary: "Understand the request, constraints, and best path to completion",
    domain: category,
    action: "research",
    requiresApproval: false,
    request: { userRequest: request },
  }));

  if (isCall || isAppointment || isCancel) {
    steps.push(step({
      kind: "voice",
      summary: isCancel
        ? "Call the provider, handle hold time, and complete the administrative request"
        : "Call the business or provider and handle the conversation",
      domain: category,
      action: isCancel ? "cancel_or_resolve" : "call",
      requiresApproval: false,
      provider: "twilio",
      request: { disclosureRequired: true, objective: request },
    }));
  } else if (isRestaurant || isTravel || isPurchase) {
    steps.push(step({
      kind: "browser",
      summary: "Search live availability and prepare the best executable option",
      domain: category,
      action: "transact",
      requiresApproval: false,
      provider: "action-runner",
      request: { objective: request },
    }));
  }

  if (isEmail) {
    steps.push(step({
      kind: "email",
      summary: "Send the required message and capture the response path",
      domain: "communications",
      action: "send",
      requiresApproval: true,
      approvalType: "communication",
      provider: "resend",
      request: { objective: request },
    }));
  }

  if (involvesSpend) {
    steps.push(step({
      kind: "payment",
      summary: "Authorize the final charge only within the user's spending rule",
      domain: category,
      action: "spend",
      requiresApproval: true,
      approvalType: isRestaurant || isTravel ? "booking" : "spend",
      provider: "payment-runner",
      request: { objective: request },
    }));
    assumptions.push("No money is spent unless an authority rule covers the action or the user approves it.");
  }

  if (isCalendar) {
    steps.push(step({
      kind: "calendar",
      summary: "Put the confirmed commitment on the calendar and preserve confirmation details",
      domain: "calendar",
      action: "write",
      requiresApproval: false,
      provider: "action-runner",
      request: { objective: request },
    }));
  }

  if (steps.length === 1) {
    steps.push(step({
      kind: "browser",
      summary: "Execute the task using the connected action runner",
      domain: category,
      action: "execute",
      requiresApproval: false,
      provider: "action-runner",
      request: { objective: request },
    }));
  }

  return {
    title: titleFromRequest(request),
    category,
    rationale: "Operator decomposes the request into auditable actions and pauses only when authority is missing.",
    steps,
    assumptions,
  };
}
