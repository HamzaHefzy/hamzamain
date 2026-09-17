export const virtualProgram = {
  name: "Anchor Virtual Academy",
  enrollment: 2400,
  attendanceRate: 0.928,
  auditReadyRate: 0.978,
  evidenceExceptions: 41,
  interventionsDue: 17,
  basicAllotment: 6215,
};

export const evidenceSources = [
  { source: "LMS progress", records: 1964, share: 0.82, status: "Connected" },
  { source: "Teacher-student interaction", records: 271, share: 0.11, status: "Connected" },
  { source: "Assignment submission", records: 123, share: 0.05, status: "Connected" },
  { source: "Manual review", records: 42, share: 0.02, status: "Review" },
];

export const virtualExceptions = [
  {
    id: "VIR-2041",
    grade: 9,
    campus: "Central Prep",
    issue: "No qualifying evidence yet",
    lastSignal: "LMS activity yesterday, 3:42 PM",
    nextAction: "Send student check-in and notify attendance navigator",
    deadline: "Today, 2:00 PM",
  },
  {
    id: "VIR-2088",
    grade: 7,
    campus: "North Academy",
    issue: "Teacher interaction recorded; evidence not linked",
    lastSignal: "Teacher call logged today, 9:18 AM",
    nextAction: "Attach interaction record and re-adjudicate",
    deadline: "Today, 3:30 PM",
  },
  {
    id: "VIR-2117",
    grade: 11,
    campus: "East Collegiate",
    issue: "Assignment submitted after policy cutoff",
    lastSignal: "Submission today, 12:14 AM",
    nextAction: "Route to policy exception review",
    deadline: "Today",
  },
  {
    id: "VIR-2146",
    grade: 10,
    campus: "South STEM",
    issue: "Three-day engagement decline",
    lastSignal: "No completed instructional activity today",
    nextAction: "Open ResolutionOS barrier check-in",
    deadline: "Today, 1:00 PM",
  },
];

export const virtualFunding = {
  onePointAda: virtualProgram.enrollment * 0.01,
  onePointGrossProgramValue:
    virtualProgram.enrollment * 0.01 * virtualProgram.basicAllotment,
};
