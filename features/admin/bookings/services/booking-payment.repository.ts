import type { BookingPaymentRecord } from "@/features/admin/bookings/types/admin-booking.types";
import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { randomUUID } from "crypto";

type PaymentRecordRow = {
  id: string;
  booking_id: string;
  type: BookingPaymentRecord["type"];
  amount: number;
  method: BookingPaymentRecord["method"];
  collected_by: string | null;
  notes: string | null;
  reference_number: string | null;
  created_at: string;
};

function mapPaymentRecord(row: PaymentRecordRow): BookingPaymentRecord {
  return {
    id: row.id,
    bookingId: row.booking_id,
    type: row.type,
    amount: row.amount,
    method: row.method,
    collectedBy: row.collected_by,
    notes: row.notes,
    referenceNumber: row.reference_number,
    createdAt: new Date(row.created_at),
  };
}

export async function listPaymentRecordsForBooking(
  bookingId: string,
): Promise<BookingPaymentRecord[]> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("booking_payment_records")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      return (data as PaymentRecordRow[]).map(mapPaymentRecord);
    }
  }

  try {
    const rows = await prisma.bookingPaymentRecord.findMany({
      where: { bookingId },
      orderBy: { createdAt: "asc" },
    });

    return rows.map((row) => ({
      id: row.id,
      bookingId: row.bookingId,
      type: row.type,
      amount: row.amount,
      method: row.method as BookingPaymentRecord["method"],
      collectedBy: row.collectedBy,
      notes: row.notes,
      referenceNumber: row.referenceNumber,
      createdAt: row.createdAt,
    }));
  } catch {
    return [];
  }
}

export async function createBookingPaymentRecord(data: {
  bookingId: string;
  type: BookingPaymentRecord["type"];
  amount: number;
  method: BookingPaymentRecord["method"];
  collectedBy?: string | null;
  notes?: string | null;
  referenceNumber?: string | null;
}): Promise<BookingPaymentRecord> {
  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();
  const id = randomUUID();

  if (supabase) {
    const payload = {
      id,
      booking_id: data.bookingId,
      type: data.type,
      amount: data.amount,
      method: data.method,
      collected_by: data.collectedBy ?? null,
      notes: data.notes ?? null,
      reference_number: data.referenceNumber ?? null,
      created_at: now,
    };

    const { data: row, error } = await supabase
      .from("booking_payment_records")
      .insert(payload)
      .select("*")
      .single();

    if (!error && row) return mapPaymentRecord(row as PaymentRecordRow);
    if (error) throw new Error(error.message);
  }

  const row = await prisma.bookingPaymentRecord.create({
    data: {
      id,
      bookingId: data.bookingId,
      type: data.type,
      amount: data.amount,
      method: data.method,
      collectedBy: data.collectedBy ?? null,
      notes: data.notes ?? null,
      referenceNumber: data.referenceNumber ?? null,
    },
  });

  return {
    id: row.id,
    bookingId: row.bookingId,
    type: row.type,
    amount: row.amount,
    method: row.method as BookingPaymentRecord["method"],
    collectedBy: row.collectedBy,
    notes: row.notes,
    referenceNumber: row.referenceNumber,
    createdAt: row.createdAt,
  };
}

export async function updateBookingPaymentRecordAmount(
  id: string,
  amount: number,
): Promise<BookingPaymentRecord | null> {
  const supabase = createServiceRoleClient();

  if (supabase) {
    const { data: row, error } = await supabase
      .from("booking_payment_records")
      .update({ amount })
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (!error && row) return mapPaymentRecord(row as PaymentRecordRow);
    if (error) throw new Error(error.message);
  }

  try {
    const row = await prisma.bookingPaymentRecord.update({
      where: { id },
      data: { amount },
    });

    return {
      id: row.id,
      bookingId: row.bookingId,
      type: row.type,
      amount: row.amount,
      method: row.method as BookingPaymentRecord["method"],
      collectedBy: row.collectedBy,
      notes: row.notes,
      referenceNumber: row.referenceNumber,
      createdAt: row.createdAt,
    };
  } catch {
    return null;
  }
}
