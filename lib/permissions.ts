export type OperatorRole = "owner" | "admin" | "member" | "viewer";
export type Permission = "admin" | "task_write" | "view";

const permissionsByRole: Record<OperatorRole, ReadonlySet<Permission>> = {
  owner: new Set(["admin", "task_write", "view"]),
  admin: new Set(["admin", "task_write", "view"]),
  member: new Set(["task_write", "view"]),
  viewer: new Set(["view"]),
};

export function can(role: OperatorRole, permission: Permission) {
  return permissionsByRole[role].has(permission);
}
