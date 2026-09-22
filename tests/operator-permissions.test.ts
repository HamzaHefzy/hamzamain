import { describe, expect, it } from "vitest";
import { can, type OperatorRole } from "@/lib/permissions";

describe("Operator permissions", () => {
  const roles: OperatorRole[] = ["owner", "admin", "member", "viewer"];

  it("limits authority settings to owners and admins", () => {
    expect(roles.filter((role) => can(role, "admin"))).toEqual(["owner", "admin"]);
  });

  it("allows members to create and operate tasks", () => {
    expect(can("member", "task_write")).toBe(true);
    expect(can("viewer", "task_write")).toBe(false);
  });

  it("keeps every role able to view its workspace", () => {
    expect(roles.every((role) => can(role, "view"))).toBe(true);
  });
});
