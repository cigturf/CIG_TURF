import { ADMIN_ROUTE_LABELS } from "@/features/admin/config/admin-navigation";
import type { AdminBreadcrumb } from "@/features/admin/types/admin.types";

export function buildAdminBreadcrumbs(pathname: string): AdminBreadcrumb[] {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0 || segments[0] !== "admin") {
    return [{ label: "Dashboard", href: "/admin" }];
  }

  const crumbs: AdminBreadcrumb[] = [{ label: "Dashboard", href: "/admin" }];

  if (segments.length === 1) {
    return [{ label: "Dashboard" }];
  }

  const section = segments[1]!;
  const label = ADMIN_ROUTE_LABELS[section] ?? section;

  crumbs.push({
    label,
    href: segments.length > 2 ? `/admin/${section}` : undefined,
  });

  if (segments.length > 2) {
    const detail = segments.slice(2).join(" / ");
    crumbs.push({ label: detail.replace(/-/g, " ") });
  } else {
    crumbs[crumbs.length - 1] = { label };
  }

  return crumbs;
}
