import {
  clampAuditDateRange,
  getAuditRetentionConfig,
} from "@/features/audit/config/audit-retention";
import { createAuditRecordFromEvent } from "@/features/audit/lib/map-event-to-audit";
import {
  insertSystemAuditLog,
  listSystemAuditLogs,
  purgeExpiredAuditLogs,
} from "@/features/audit/services/audit.repository";
import type {
  AuditActor,
  AuditDirectoryData,
  AuditQuery,
} from "@/features/audit/types/audit.types";
import { resolveReportDateRange } from "@/features/admin/reports/lib/report-date-range";
import type { AppEventEnvelope } from "@/features/events/types/event.types";

export async function recordAuditFromAppEvent(
  event: AppEventEnvelope,
  actor?: AuditActor,
) {
  const record = createAuditRecordFromEvent(event, actor);
  if (!record) return null;

  const inserted = await insertSystemAuditLog(record);

  const retention = getAuditRetentionConfig();
  if (retention.autoCleanupEnabled) {
    void purgeExpiredAuditLogs();
  }

  return inserted;
}

export async function getAuditDirectoryData(
  query: AuditQuery = {},
): Promise<AuditDirectoryData> {
  const retention = getAuditRetentionConfig();
  if (retention.autoCleanupEnabled) {
    void purgeExpiredAuditLogs();
  }

  const range = resolveReportDateRange(
    query.preset ?? "last_7_days",
    query.from,
    query.to,
  );
  const clamped = clampAuditDateRange(range.from, range.to);
  const logs = await listSystemAuditLogs(clamped.from, clamped.to, query);

  return {
    range: { ...range, from: clamped.from, to: clamped.to },
    logs,
    total: logs.length,
    retentionDays: retention.retentionDays,
    autoCleanupEnabled: retention.autoCleanupEnabled,
    generatedAt: new Date().toISOString(),
  };
}
