export type Barrier =
  | "Technology / access"
  | "Routine / forgot"
  | "Academic overwhelm"
  | "Work / caregiving"
  | "Motivation / belonging"
  | "Schedule mismatch"
  | "Unknown";

export type ShowUpStudent = {
  id: string;
  grade: number;
  nextSession: string;
  consecutiveMissedSessions: number;
  weeklyAttendanceRate: number;
  engagementTrend: "stable" | "down";
  respondedToLastOutreach: boolean;
  barrier: Barrier;
};

export type RoutingLevel = "Prevent" | "Recover today" | "Human rescue";

export type ShowUpPlan = ShowUpStudent & {
  routingLevel: RoutingLevel;
  nextAction: string;
  owner: string;
  sla: string;
  approvedFallback: string;
};

const barrierAction: Record<Barrier, { action: string; owner: string; fallback: string }> = {
  "Technology / access": {
    action: "Open live tech support and confirm device/connectivity restoration",
    owner: "Tech navigator",
    fallback: "Teacher check-in or offline work path if permitted by local policy",
  },
  "Routine / forgot": {
    action: "Send one-tap join link and add the next session to the student calendar",
    owner: "Attendance navigator",
    fallback: "Same-day approved asynchronous participation path",
  },
  "Academic overwhelm": {
    action: "Route to teacher for a minimum viable catch-up plan before the next session",
    owner: "Teacher + success coach",
    fallback: "Teacher interaction plus approved instructional work for the day",
  },
  "Work / caregiving": {
    action: "Contact student to redesign the participation window around the real constraint",
    owner: "Success coach",
    fallback: "Approved asynchronous window or schedule-change review",
  },
  "Motivation / belonging": {
    action: "Schedule a same-day five-minute human check-in with a consistent adult",
    owner: "Success coach",
    fallback: "Small-group or one-to-one instructional connection",
  },
  "Schedule mismatch": {
    action: "Review live-session timing and move the student to a sustainable participation plan",
    owner: "Counselor / scheduler",
    fallback: "Approved alternate live section or asynchronous path",
  },
  Unknown: {
    action: "Send a one-question barrier check-in and escalate to a human if there is no response",
    owner: "Attendance navigator",
    fallback: "Human outreach to identify the barrier before assigning an intervention",
  },
};

export function routeShowUpCase(student: ShowUpStudent): ShowUpPlan {
  const signals =
    (student.consecutiveMissedSessions >= 2 ? 2 : student.consecutiveMissedSessions === 1 ? 1 : 0) +
    (student.weeklyAttendanceRate < 0.9 ? 2 : student.weeklyAttendanceRate < 0.95 ? 1 : 0) +
    (student.engagementTrend === "down" ? 1 : 0) +
    (!student.respondedToLastOutreach ? 1 : 0);

  const routingLevel: RoutingLevel =
    signals >= 5 ? "Human rescue" : signals >= 2 ? "Recover today" : "Prevent";

  const barrier = barrierAction[student.barrier];

  return {
    ...student,
    routingLevel,
    nextAction: barrier.action,
    owner: barrier.owner,
    sla:
      routingLevel === "Human rescue"
        ? "Human contact within 2 hours"
        : routingLevel === "Recover today"
          ? "Resolve before day close"
          : "Before next session",
    approvedFallback: barrier.fallback,
  };
}

export const showUpMetrics = {
  studentsWithLiveSessionNext2Hours: 684,
  unconfirmedForNextSession: 93,
  sameDayRecoveries: 38,
  humanOutreachDue: 17,
  medianRecoveryMinutes: 46,
};

const demoStudents: ShowUpStudent[] = [
  {
    id: "VIR-2204",
    grade: 10,
    nextSession: "Algebra II · 10:30 AM",
    consecutiveMissedSessions: 0,
    weeklyAttendanceRate: 0.96,
    engagementTrend: "stable",
    respondedToLastOutreach: true,
    barrier: "Routine / forgot",
  },
  {
    id: "VIR-2146",
    grade: 10,
    nextSession: "English III · 11:00 AM",
    consecutiveMissedSessions: 2,
    weeklyAttendanceRate: 0.86,
    engagementTrend: "down",
    respondedToLastOutreach: false,
    barrier: "Academic overwhelm",
  },
  {
    id: "VIR-2291",
    grade: 8,
    nextSession: "Science · 11:15 AM",
    consecutiveMissedSessions: 1,
    weeklyAttendanceRate: 0.92,
    engagementTrend: "down",
    respondedToLastOutreach: true,
    barrier: "Technology / access",
  },
  {
    id: "VIR-2318",
    grade: 11,
    nextSession: "US History · 12:00 PM",
    consecutiveMissedSessions: 3,
    weeklyAttendanceRate: 0.82,
    engagementTrend: "down",
    respondedToLastOutreach: false,
    barrier: "Work / caregiving",
  },
  {
    id: "VIR-2330",
    grade: 9,
    nextSession: "Biology · 12:30 PM",
    consecutiveMissedSessions: 1,
    weeklyAttendanceRate: 0.94,
    engagementTrend: "stable",
    respondedToLastOutreach: true,
    barrier: "Schedule mismatch",
  },
];

export const showUpQueue = demoStudents.map(routeShowUpCase);

export const interventionLadder = [
  {
    window: "Before class",
    trigger: "Upcoming required live session",
    action: "One-tap join link, calendar hold, and concise student reminder. Notify family only according to age and local policy.",
    objective: "Remove friction before it becomes an absence.",
  },
  {
    window: "10 minutes after a miss",
    trigger: "No qualifying live participation signal",
    action: "Ask one question: what stopped you? Route the response to the smallest useful fix and show any approved same-day participation path.",
    objective: "Recover the instructional day rather than simply record a miss.",
  },
  {
    window: "Repeated misses",
    trigger: "Two or more recent misses, declining participation, or no response",
    action: "Assign one named adult, contact the student directly, involve family when appropriate, and build a short barrier-specific recovery plan.",
    objective: "Restore a sustainable routine instead of escalating generic reminders.",
  },
  {
    window: "Persistent disengagement",
    trigger: "Interventions fail or schedule/model is clearly not working",
    action: "Review schedule, supports, course load, and whether the current virtual modality is still the right placement.",
    objective: "Solve the structural mismatch rather than punish the student for it.",
  },
];
