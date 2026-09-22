export type OperatorTaskStatus =
  | "planning"
  | "ready"
  | "awaiting_approval"
  | "in_progress"
  | "waiting_external"
  | "completed"
  | "failed"
  | "cancelled";

export type OperatorStepKind =
  | "research"
  | "api"
  | "browser"
  | "voice"
  | "email"
  | "calendar"
  | "payment"
  | "human";

export type OperatorStepStatus =
  | "pending"
  | "awaiting_approval"
  | "running"
  | "waiting_external"
  | "completed"
  | "failed"
  | "skipped";

export type ApprovalType =
  | "spend"
  | "booking"
  | "communication"
  | "calendar"
  | "account_change"
  | "sensitive"
  | "other";

export type PlannedStep = {
  kind: OperatorStepKind;
  summary: string;
  domain: string;
  action: string;
  requiresApproval: boolean;
  approvalType?: ApprovalType;
  provider?: string;
  request?: Record<string, unknown>;
};

export type TaskPlan = {
  title: string;
  category: string;
  rationale: string;
  steps: PlannedStep[];
  assumptions: string[];
};

export type ExecutionResult = {
  state: "completed" | "waiting_external" | "failed";
  provider: string;
  message: string;
  data?: Record<string, unknown>;
};
