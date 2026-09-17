import { TEXAS_2026_27_BASIC_ALLOTMENT, calculateFundingScenario } from "./finance";

export const network = calculateFundingScenario({
  enrollment: 10000,
  attendanceRate: 0.93,
  basicAllotment: TEXAS_2026_27_BASIC_ALLOTMENT,
});

export const campuses = [
  { name: "North Academy", enrollment: 2480, attendanceRate: 0.944 },
  { name: "Central Prep", enrollment: 2210, attendanceRate: 0.927 },
  { name: "East Collegiate", enrollment: 1880, attendanceRate: 0.916 },
  { name: "South STEM", enrollment: 1740, attendanceRate: 0.935 },
  { name: "West Leadership", enrollment: 1690, attendanceRate: 0.925 },
].map((campus) => ({
  ...campus,
  ada: campus.enrollment * campus.attendanceRate,
}));

export type ResolutionCase = {
  id: string;
  grade: number;
  campus: string;
  barrier: string;
  queue: "Do now" | "Stuck" | "Check outcome";
  owner: string;
  commitment: string;
  due: string;
  status: string;
};

export const cases: ResolutionCase[] = [
  {
    id: "SYN-1001",
    grade: 8,
    campus: "East Collegiate",
    barrier: "Transportation",
    queue: "Do now",
    owner: "Jordan M.",
    commitment: "Confirm approved morning transport for tomorrow",
    due: "Today, 4:00 PM",
    status: "Support pending",
  },
  {
    id: "SYN-1002",
    grade: 9,
    campus: "Central Prep",
    barrier: "Too far behind",
    queue: "Stuck",
    owner: "Priya S.",
    commitment: "Receive two-item minimum catch-up plan from teachers",
    due: "Overdue by 6h",
    status: "Waiting on teacher team",
  },
  {
    id: "SYN-1003",
    grade: 7,
    campus: "North Academy",
    barrier: "School overwhelm",
    queue: "Do now",
    owner: "Alex R.",
    commitment: "Confirm quiet-entry plan and trusted-adult check-in",
    due: "Today, 2:30 PM",
    status: "Plan drafted",
  },
  {
    id: "SYN-1004",
    grade: 10,
    campus: "South STEM",
    barrier: "Work / caregiving",
    queue: "Check outcome",
    owner: "Dana K.",
    commitment: "Verify whether revised morning schedule worked",
    due: "Today",
    status: "Intervention delivered",
  },
];
