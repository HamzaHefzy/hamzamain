import { describe, expect, it } from "vitest";
import {
  adjudicateVirtualEvidence,
  evidenceQualifies,
  type VirtualPolicyConfig,
} from "@/lib/virtual-policy";

const policy: VirtualPolicyConfig = {
  qualifyingEvidence: ["lms_progress", "teacher_interaction", "live_session"],
  minimumMinutes: 10,
  allowAnyQualifyingEvidence: true,
};

describe("virtual attendance policy", () => {
  it("rejects evidence types not approved by policy", () => {
    expect(evidenceQualifies(policy, {
      evidenceType: "assignment_submission",
      minutes: 20,
    })).toBe(false);
  });

  it("rejects missing minutes when a minimum is configured", () => {
    expect(evidenceQualifies(policy, {
      evidenceType: "lms_progress",
      minutes: null,
    })).toBe(false);
  });

  it("rejects activity below the configured minimum", () => {
    expect(evidenceQualifies(policy, {
      evidenceType: "live_session",
      minutes: 9,
    })).toBe(false);
  });

  it("qualifies approved evidence meeting the policy", () => {
    expect(evidenceQualifies(policy, {
      evidenceType: "teacher_interaction",
      minutes: 10,
    })).toBe(true);
  });

  it("adjudicates present only when qualifying evidence exists", () => {
    expect(adjudicateVirtualEvidence(policy, [
      { id: "e1", evidenceType: "lms_progress", minutes: 11 },
    ])).toMatchObject({
      status: "present",
      qualifyingIds: ["e1"],
    });

    expect(adjudicateVirtualEvidence(policy, [
      { id: "e2", evidenceType: "lms_progress", minutes: 3 },
    ])).toMatchObject({
      status: "unresolved",
      qualifyingIds: [],
    });
  });
});
