import type { ReportDatePreset, ReportDateRange } from "@/features/admin/reports/types/reports.types";

export type AuditCategory =
  | "bookings"
  | "payments"
  | "pricing"
  | "slots"
  | "media"
  | "business_settings"
  | "promotions"
  | "authentication";

export type AuditDatePreset = ReportDatePreset;

export type AuditLogRecord = {
  id: string;
  eventId: string;
  action: string;
  category: AuditCategory;
  module: string;
  entityId: string | null;
  description: string;
  performedBy: string | null;
  performedById: string | null;
  oldValue: string | null;
  newValue: string | null;
  metadata: Record<string, unknown> | null;
  bookingId: string | null;
  customerName: string | null;
  ipAddress: string | null;
  browser: string | null;
  createdAt: string;
};

export type AuditDirectoryData = {
  range: ReportDateRange;
  logs: AuditLogRecord[];
  total: number;
  retentionDays: number;
  autoCleanupEnabled: boolean;
  generatedAt: string;
};

export type AuditQuery = {
  preset?: AuditDatePreset;
  from?: string;
  to?: string;
  category?: AuditCategory | "all";
  search?: string;
};

export type AuditActor = {
  id?: string | null;
  email?: string | null;
};
