export type {
  AdminBreadcrumb,
  AdminBusinessBranding,
  AdminContext,
  AdminNavItem,
  AdminNotification,
  AdminNotificationType,
  AdminPermission,
  AdminRole,
} from "@/features/admin/types/admin.types";

export type {
  AdminDashboardData,
  DashboardActivity,
  DashboardStats,
  DashboardTimelineItem,
  DashboardUpcomingEvent,
} from "@/features/admin/dashboard/types/dashboard.types";

export type {
  AdminSearchProvider,
  AdminSearchResult,
  AdminSearchScope,
} from "@/features/admin/search/types/admin-search.types";

export { ADMIN_NAV_ITEMS, ADMIN_ROUTES } from "@/features/admin/config/admin-navigation";
export {
  formatAdminRole,
  hasAdminPermission,
  ROLE_PERMISSIONS,
} from "@/features/admin/config/admin-permissions";
export { getAdminDashboardData } from "@/features/admin/dashboard/services/admin-dashboard.service";
export {
  ADMIN_SEARCH_PROVIDERS,
  searchAdminGlobal,
} from "@/features/admin/search/providers/admin-search-provider";
