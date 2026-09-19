export type VirtualEvidenceType =
  | "lms_progress"
  | "teacher_interaction"
  | "assignment_submission"
  | "live_session"
  | "approved_offline_work"
  | "other";

export type VirtualPolicyConfig = {
  qualifyingEvidence: VirtualEvidenceType[];
  minimumMinutes?: number;
  allowAnyQualifyingEvidence?: boolean;
  dayCloseLocalTime?: string;
};

export type EvidenceForDecision = {
  id?: string;
  evidenceType: VirtualEvidenceType;
  minutes?: number | null;
};

export function evidenceQualifies(
  policy: VirtualPolicyConfig,
  evidence: EvidenceForDecision,
) {
  if (!policy.qualifyingEvidence.includes(evidence.evidenceType)) return false;

  const minimum = policy.minimumMinutes ?? 0;
  if (minimum > 0 && evidence.minutes !== null && evidence.minutes !== undefined) {
    return evidence.minutes >= minimum;
  }

  return true;
}

export function adjudicateVirtualEvidence(
  policy: VirtualPolicyConfig,
  evidence: EvidenceForDecision[],
) {
  const qualifying = evidence.filter((event) => evidenceQualifies(policy, event));

  if (policy.allowAnyQualifyingEvidence !== false && qualifying.length > 0) {
    return {
      status: "present" as const,
      qualifyingIds: qualifying.map((event) => event.id).filter(Boolean) as string[],
      reason: "At least one approved instructional-participation signal satisfied the active policy.",
    };
  }

  return {
    status: "unresolved" as const,
    qualifyingIds: [] as string[],
    reason: "No approved instructional-participation evidence currently satisfies the active policy.",
  };
}
