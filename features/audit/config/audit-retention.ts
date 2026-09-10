import { addDaysToIsoDate } from "@/features/booking/utils/time";
import { DEFAULT_VENUE_TIMEZONE, getTodayIsoInTimezone } from "@/features/booking/utils/venue-timezone";

/** Rolling retention window — only the last 3 calendar days of audit logs are kept. */
export const AUDIT_RETENTION_DAYS = 3;

export const AUDIT_AUTO_CLEANUP_ENABLED = true;

export function getAuditRetentionConfig() {
  return {
    retentionDays: AUDIT_RETENTION_DAYS,
    autoCleanupEnabled: AUDIT_AUTO_CLEANUP_ENABLED,
  };
}

/** Earliest date (inclusive) still within the retention window. */
export function getAuditRetentionCutoffIso(now = new Date()): string {
  const today = getTodayIsoInTimezone(now, DEFAULT_VENUE_TIMEZONE);
  return addDaysToIsoDate(today, -(AUDIT_RETENTION_DAYS - 1));
}

export function clampAuditDateRange(from: string, to: string, now = new Date()) {
  const cutoff = getAuditRetentionCutoffIso(now);
  return {
    from: from < cutoff ? cutoff : from,
    to,
  };
}
