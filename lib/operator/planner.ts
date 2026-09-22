import type { PlannedStep, TaskPlan } from "@/lib/operator/types";

const includesAny = (value: string, terms: string[]) =>
  terms.some((term) => value.includes(term));

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
  if (request.length < 4) throw new Error("Tell Yumna what you want handled.");

  const text = request.toLowerCase();
  const steps: PlannedStep[] = [];
  const assumptions: string[] = [];
  let category = "general";

  const isRestaurant = includesAny(text, [
    "restaurant", "dinner", "brunch", "lunch",
  ]);
  const isAppointment = includesAny(text, [
    "appointment", "dentist", "doctor", "salon", "barber", "mechanic",
  ]);
  const isTravel = includesAny(text, [
    "flight", "hotel", "trip", "airline", "rental car",
  ]);
  const isPurchase = includesAny(text, [
    "buy", "purchase", "order",
  ]);
  const isBookingIntent = includesAny(text, [
    "book", "reserve", "reservation", "schedule", "reschedule",
    "make an appointment", "set up an appointment",
  ]);
  const isCancel = includesAny(text, [
    "cancel", "subscription", "refund", "return",
  ]);
  const isCall = includesAny(text, [
    "call ", "call my", "call the", "phone them", "phone the", "ring ",
    "hold", "speak to", "ask them",
  ]);
  const wantsPlaceInfo = includesAny(text, [
    "phone number", "address", "hours", "near me", "nearby", "google maps",
    "restaurant", "dentist", "doctor", "salon", "barber", "mechanic",
    "plumber", "electrician", "pharmacy", "coffee", "cafe", "urgent care",
    "veterinarian", " vet ", "hotel",
  ]);
  const isEmail = includesAny(text, [
    "email", "send", "reply", "message",
  ]);
  const explicitPayment = includesAny(text, [
    "pay", "charge my", "use my card",
  ]);
  const needsWebResearch = includesAny(text, [
    "search the web", "search online", "look up", "research", "latest",
    "today", "recent", "compare", "reviews", "what are the best",
    "find information", "find out", "news",
  ]);
  const freshness =
    includesAny(text, ["this week"]) ? "pw" :
    includesAny(text, ["today", "right now"]) ? "pd" :
    includesAny(text, ["latest"]) ? "pd" :
    includesAny(text, ["recent"]) ? "pw" :
    undefined;

  const transactionIntent = isPurchase || isBookingIntent || explicitPayment;
  const isCalendar =
    isBookingIntent ||
    includesAny(text, ["calendar", "meeting"]);
  const involvesSpend = transactionIntent;

  if (isRestaurant) category = "dining";
  else if (isAppointment) category = "appointments";
  else if (isTravel) category = "travel";
  else if (isCancel) category = "administration";
  else if (isEmail) category = "communications";

  steps.push(step({
    kind: "research",
    summary: needsWebResearch
      ? "Search the live web for current information and sources"
      : "Understand the request, constraints, and best path to completion",
    domain: category,
    action: needsWebResearch ? "web_search" : "research",
    requiresApproval: false,
    provider: needsWebResearch ? "brave-search" : undefined,
    request: needsWebResearch
      ? { query: request, ...(freshness ? { freshness } : {}) }
      : { userRequest: request },
  }));

  const needsAppointmentCall =
    isAppointment && (isBookingIntent || isCall);

  if (isCall || isCancel || needsAppointmentCall) {
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
  } else if (wantsPlaceInfo && !transactionIntent) {
    steps.push(step({
      kind: "api",
      summary: "Search Google Maps for canonical businesses, addresses, ratings, websites, and phone numbers",
      domain: category,
      action: "places_search",
      requiresApproval: false,
      provider: "google-places",
      request: { query: request, includeContact: true },
    }));
  } else if (
    isRestaurant ||
    isTravel ||
    isPurchase ||
    isBookingIntent
  ) {
    steps.push(step({
      kind: "browser",
      summary: transactionIntent
        ? "Search live availability and prepare the best executable option"
        : "Research live options and return the best matches",
      domain: category,
      action: transactionIntent ? "transact" : "research",
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
    assumptions.push(
      "No money is spent unless an authority rule covers the action or the user approves it.",
    );
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

  if (steps.length === 1 && !needsWebResearch) {
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
    rationale:
      "Yumna decomposes the request into auditable actions and pauses only when authority is missing.",
    steps,
    assumptions,
  };
}
