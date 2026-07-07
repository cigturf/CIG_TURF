import type { AdminPermission, AdminRole } from "@/features/admin/types/admin.types";

const ALL_PERMISSIONS: AdminPermission[] = [
  "dashboard.view",
  "bookings.view",
  "bookings.manage",
  "slots.view",
  "slots.manage",
  "pricing.view",
  "pricing.manage",
  "gallery.view",
  "gallery.manage",
  "events.view",
  "events.manage",
  "settings.view",
  "settings.manage",
  "reports.view",
  "finance.view",
  "customers.view",
  "audit.view",
  "emails.view",
  "emails.manage",
  "profile.view",
];

/** RBAC matrix — owner has full access today; other roles reserved for future milestones. */
export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[] | "*"> = {
  owner: "*",
  admin: ALL_PERMISSIONS,
  manager: [
    "dashboard.view",
    "bookings.view",
    "bookings.manage",
    "slots.view",
    "gallery.view",
    "events.view",
    "reports.view",
    "finance.view",
    "customers.view",
    "emails.view",
    "profile.view",
  ],
  staff: ["dashboard.view", "bookings.view", "profile.view"],
};

export function hasAdminPermission(
  role: AdminRole,
  permission: AdminPermission,
): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (permissions === "*") return true;
  return permissions.includes(permission);
}

export function getPermissionsForRole(role: AdminRole): AdminPermission[] {
  const permissions = ROLE_PERMISSIONS[role];
  if (permissions === "*") return ALL_PERMISSIONS;
  return permissions;
}

export function formatAdminRole(role: AdminRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}
