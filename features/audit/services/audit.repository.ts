import { getAuditRetentionCutoffIso } from "@/features/audit/config/audit-retention";
import type { AuditLogRecord, AuditQuery } from "@/features/audit/types/audit.types";
import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase/admin";

type AuditRow = {
  id: string;
  event_id: string;
  action: string;
  category: string;
  module: string;
  entity_id: string | null;
  description: string;
  performed_by: string | null;
  performed_by_id: string | null;
  old_value: string | null;
  new_value: string | null;
  metadata: Record<string, unknown> | null;
  booking_id: string | null;
  customer_name: string | null;
  ip_address: string | null;
  browser: string | null;
  created_at: string;
};

function mapRow(row: AuditRow): AuditLogRecord {
  return {
    id: row.id,
    eventId: row.event_id,
    action: row.action,
    category: row.category as AuditLogRecord["category"],
    module: row.module,
    entityId: row.entity_id,
    description: row.description,
    performedBy: row.performed_by,
    performedById: row.performed_by_id,
    oldValue: row.old_value,
    newValue: row.new_value,
    metadata: row.metadata,
    bookingId: row.booking_id,
    customerName: row.customer_name,
    ipAddress: row.ip_address,
    browser: row.browser,
    createdAt: row.created_at,
  };
}

function rowFromRecord(record: AuditLogRecord) {
  return {
    id: record.id,
    event_id: record.eventId,
    action: record.action,
    category: record.category,
    module: record.module,
    entity_id: record.entityId,
    description: record.description,
    performed_by: record.performedBy,
    performed_by_id: record.performedById,
    old_value: record.oldValue,
    new_value: record.newValue,
    metadata: record.metadata,
    booking_id: record.bookingId,
    customer_name: record.customerName,
    ip_address: record.ipAddress,
    browser: record.browser,
    created_at: record.createdAt,
  };
}

export async function insertSystemAuditLog(record: AuditLogRecord): Promise<AuditLogRecord | null> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("system_audit_logs")
      .insert(rowFromRecord(record))
      .select("*")
      .single();

    if (error?.code === "23505") return null;
    if (!error && data) return mapRow(data as AuditRow);
    if (error) throw new Error(error.message);
  }

  try {
    const row = await prisma.systemAuditLog.create({
      data: {
        id: record.id,
        eventId: record.eventId,
        action: record.action,
        category: record.category,
        module: record.module,
        entityId: record.entityId,
        description: record.description,
        performedBy: record.performedBy,
        performedById: record.performedById,
        oldValue: record.oldValue,
        newValue: record.newValue,
        metadata: record.metadata ? JSON.parse(JSON.stringify(record.metadata)) : undefined,
        bookingId: record.bookingId,
        customerName: record.customerName,
        ipAddress: record.ipAddress,
        browser: record.browser,
        createdAt: new Date(record.createdAt),
      },
    });

    return {
      id: row.id,
      eventId: row.eventId,
      action: row.action,
      category: row.category as AuditLogRecord["category"],
      module: row.module,
      entityId: row.entityId,
      description: row.description,
      performedBy: row.performedBy,
      performedById: row.performedById,
      oldValue: row.oldValue,
      newValue: row.newValue,
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
      bookingId: row.bookingId,
      customerName: row.customerName,
      ipAddress: row.ipAddress,
      browser: row.browser,
      createdAt: row.createdAt.toISOString(),
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) return null;
    throw error;
  }
}

export async function purgeExpiredAuditLogs(): Promise<number> {
  const cutoff = `${getAuditRetentionCutoffIso()}T00:00:00.000Z`;

  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("system_audit_logs")
      .delete()
      .lt("created_at", cutoff)
      .select("id");

    if (!error && data) return data.length;
  }

  try {
    const result = await prisma.systemAuditLog.deleteMany({
      where: { createdAt: { lt: new Date(cutoff) } },
    });
    return result.count;
  } catch {
    return 0;
  }
}

export async function listSystemAuditLogs(
  fromIso: string,
  toIso: string,
  query: AuditQuery = {},
): Promise<AuditLogRecord[]> {
  const retentionFrom = getAuditRetentionCutoffIso();
  const effectiveFrom = fromIso < retentionFrom ? retentionFrom : fromIso;
  const from = `${effectiveFrom}T00:00:00.000Z`;
  const to = `${toIso}T23:59:59.999Z`;

  const supabase = createServiceRoleClient();
  if (supabase) {
    let request = supabase
      .from("system_audit_logs")
      .select("*")
      .gte("created_at", from)
      .lte("created_at", to)
      .order("created_at", { ascending: false });

    if (query.category && query.category !== "all") {
      request = request.eq("category", query.category);
    }

    const { data, error } = await request;
    if (!error && data) {
      return applySearchFilter((data as AuditRow[]).map(mapRow), query.search);
    }
  }

  try {
    const rows = await prisma.systemAuditLog.findMany({
      where: {
        createdAt: { gte: new Date(from), lte: new Date(to) },
        ...(query.category && query.category !== "all" ? { category: query.category } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return applySearchFilter(
      rows.map((row) => ({
        id: row.id,
        eventId: row.eventId,
        action: row.action,
        category: row.category as AuditLogRecord["category"],
        module: row.module,
        entityId: row.entityId,
        description: row.description,
        performedBy: row.performedBy,
        performedById: row.performedById,
        oldValue: row.oldValue,
        newValue: row.newValue,
        metadata: (row.metadata as Record<string, unknown> | null) ?? null,
        bookingId: row.bookingId,
        customerName: row.customerName,
        ipAddress: row.ipAddress,
        browser: row.browser,
        createdAt: row.createdAt.toISOString(),
      })),
      query.search,
    );
  } catch {
    return [];
  }
}

function applySearchFilter(logs: AuditLogRecord[], search?: string) {
  if (!search?.trim()) return logs;
  const term = search.trim().toLowerCase();
  return logs.filter(
    (log) =>
      log.action.toLowerCase().includes(term) ||
      log.module.toLowerCase().includes(term) ||
      log.description.toLowerCase().includes(term) ||
      (log.bookingId?.toLowerCase().includes(term) ?? false) ||
      (log.entityId?.toLowerCase().includes(term) ?? false) ||
      (log.customerName?.toLowerCase().includes(term) ?? false) ||
      (log.performedBy?.toLowerCase().includes(term) ?? false),
  );
}
