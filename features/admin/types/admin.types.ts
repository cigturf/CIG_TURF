export type AdminRole = "owner" | "admin" | "manager" | "staff";

export type AdminPermission =
  | "dashboard.view"
  | "bookings.view"
  | "bookings.manage"
  | "slots.view"
  | "slots.manage"
  | "pricing.view"
  | "pricing.manage"
  | "gallery.view"
  | "gallery.manage"
  | "events.view"
  | "events.manage"
  | "settings.view"
  | "settings.manage"
  | "reports.view"
  | "finance.view"
  | "customers.view"
  | "audit.view"
  | "emails.view"
  | "emails.manage"
  | "profile.view";

export type AdminNavItem = {
  id: string;
  label: string;
  href: string;
  icon: string;
  permission: AdminPermission;
  badge?: string;
};

export type AdminContext = {
  id: string;
  userId: string;
  role: AdminRole;
  email: string;
  name: string;
  image: string | null;
};

export type AdminNotificationType =
  | "new_booking"
  | "booking_cancelled"
  | "payment_received"
  | "event_reminder"
  | "admin_message";

export type AdminNotification = {
  id: string;
  type: AdminNotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export type AdminBreadcrumb = {
  label: string;
  href?: string;
};

export type AdminBusinessBranding = {
  businessName: string;
  shortName: string;
  logoUrl: string | null;
};
