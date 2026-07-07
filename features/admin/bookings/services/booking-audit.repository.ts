import type { BookingAuditLog } from "@/features/admin/bookings/types/admin-booking.types";
import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { randomUUID } from "crypto";

type AuditLogRow = {
  id: string;
  booking_id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function mapAuditLog(row: AuditLogRow): BookingAuditLog {
  return {
    id: row.id,
    bookingId: row.booking_id,
    actorId: row.actor_id,
    actorEmail: row.actor_email,
    action: row.action,
    fieldName: row.field_name,
    oldValue: row.old_value,
    newValue: row.new_value,
    metadata: row.metadata,
    createdAt: new Date(row.created_at),
  };
}

export async function listAuditLogsForBooking(bookingId: string): Promise<BookingAuditLog[]> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("booking_audit_logs")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      return (data as AuditLogRow[]).map(mapAuditLog);
    }
  }

  try {
    const rows = await prisma.bookingAuditLog.findMany({
      where: { bookingId },
      orderBy: { createdAt: "asc" },
    });

    return rows.map((row) => ({
      id: row.id,
      bookingId: row.bookingId,
      actorId: row.actorId,
      actorEmail: row.actorEmail,
      action: row.action,
      fieldName: row.fieldName,
      oldValue: row.oldValue,
      newValue: row.newValue,
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
      createdAt: row.createdAt,
    }));
  } catch {
    return [];
  }
}

export async function createBookingAuditLog(data: {
  bookingId: string;
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  fieldName?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<BookingAuditLog> {
  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();
  const id = randomUUID();

  if (supabase) {
    const payload = {
      id,
      booking_id: data.bookingId,
      actor_id: data.actorId ?? null,
      actor_email: data.actorEmail ?? null,
      action: data.action,
      field_name: data.fieldName ?? null,
      old_value: data.oldValue ?? null,
      new_value: data.newValue ?? null,
      metadata: data.metadata ?? null,
      created_at: now,
    };

    const { data: row, error } = await supabase
      .from("booking_audit_logs")
      .insert(payload)
      .select("*")
      .single();

    if (!error && row) return mapAuditLog(row as AuditLogRow);
    if (error) throw new Error(error.message);
  }

  const row = await prisma.bookingAuditLog.create({
    data: {
      id,
      bookingId: data.bookingId,
      actorId: data.actorId ?? null,
      actorEmail: data.actorEmail ?? null,
      action: data.action,
      fieldName: data.fieldName ?? null,
      oldValue: data.oldValue ?? null,
      newValue: data.newValue ?? null,
      metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
    },
  });

  return {
    id: row.id,
    bookingId: row.bookingId,
    actorId: row.actorId,
    actorEmail: row.actorEmail,
    action: row.action,
    fieldName: row.fieldName,
    oldValue: row.oldValue,
    newValue: row.newValue,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt,
  };
}
