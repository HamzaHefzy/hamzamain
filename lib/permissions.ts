export type AnchorRole = "owner" | "admin" | "attendance" | "finance" | "support" | "viewer";

export type Permission = "admin" | "attendance_write" | "finance" | "support_write" | "view";

const permissionsByRole: Record<AnchorRole, ReadonlySet<Permission>> = {
  owner: new Set(["admin","attendance_write","finance","support_write","view"]),
  admin: new Set(["admin","attendance_write","finance","support_write","view"]),
  attendance: new Set(["attendance_write","support_write","view"]),
  finance: new Set(["finance","view"]),
  support: new Set(["support_write","view"]),
  viewer: new Set(["view"]),
};

export function can(role: AnchorRole, permission: Permission) {
  return permissionsByRole[role].has(permission);
}

export function canInviteRole(actorRole: AnchorRole, invitedRole: AnchorRole) {
  if (!can(actorRole, "admin")) return false;
  if (invitedRole === "owner") return actorRole === "owner";
  return true;
}
