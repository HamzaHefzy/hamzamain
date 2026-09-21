export const recoveryPlaybooks = {
  technology: {
    label: "Technology / access",
    nextAction: "Restore device, account, or connectivity access before the next instructional event and verify the student can enter.",
    priority: "high" as const,
  },
  forgot: {
    label: "Routine / schedule confusion",
    nextAction: "Confirm the next instructional event, direct access path, and a reminder routine; verify the next five events.",
    priority: "medium" as const,
  },
  behind: {
    label: "Academic overwhelm",
    nextAction: "Ask the teacher for a minimum re-entry plan so the student can attend before catching up; schedule a short academic check-in.",
    priority: "high" as const,
  },
  caregiving: {
    label: "Work / caregiving / schedule conflict",
    nextAction: "Review the schedule with the student and route a school-approved adjustment or alternative participation path.",
    priority: "high" as const,
  },
  motivation: {
    label: "Disengagement / belonging",
    nextAction: "Assign a named adult for a same-day re-engagement conversation and agree on the next instructional event.",
    priority: "high" as const,
  },
  health: {
    label: "Health / wellness",
    nextAction: "Route to the school's approved health/support process without collecting unnecessary medical detail in Anchor.",
    priority: "high" as const,
  },
  anxiety: {
    label: "Anxiety / school avoidance",
    nextAction: "Route to qualified school counseling or mental-health staff and create a manageable return plan; Anchor does not diagnose or deliver therapy.",
    priority: "high" as const,
  },
  transportation: {
    label: "Transportation",
    nextAction: "Confirm the transportation barrier, route the approved transportation/resource workflow, and verify the next school-day arrival.",
    priority: "high" as const,
  },
  other: {
    label: "Other attendance barrier",
    nextAction: "A human follow-up is required to identify the barrier and agree on the next attendance action.",
    priority: "medium" as const,
  },
} as const;

export type RecoveryBarrier = keyof typeof recoveryPlaybooks;
