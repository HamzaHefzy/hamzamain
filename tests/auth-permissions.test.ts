import { describe, expect, it } from "vitest";
import { can, canInviteRole, type AnchorRole } from "../lib/permissions";

describe("role permissions", () => {
  const roles: AnchorRole[] = ["owner","admin","attendance","finance","support","viewer"];

  it("limits admin-only operations to owner and admin roles", () => {
    expect(roles.filter((role) => can(role, "admin"))).toEqual(["owner","admin"]);
    it("allows only owners to invite another owner", () => {
    expect(canInviteRole("owner", "owner")).toBe(true);
    expect(canInviteRole("admin", "owner")).toBe(false);
    expect(canInviteRole("admin", "attendance")).toBe(true);
    expect(canInviteRole("viewer", "attendance")).toBe(false);
  });
});

  it("does not grant finance access to attendance or support roles", () => {
    expect(can("attendance", "finance")).toBe(false);
    expect(can("support", "finance")).toBe(false);
    expect(can("finance", "finance")).toBe(true);
  });

  it("keeps viewers read-only", () => {
    expect(can("viewer", "view")).toBe(true);
    expect(can("viewer", "admin")).toBe(false);
    expect(can("viewer", "attendance_write")).toBe(false);
    expect(can("viewer", "support_write")).toBe(false);
    expect(can("viewer", "finance")).toBe(false);
  });
});
