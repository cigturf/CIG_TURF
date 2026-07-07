import type { BookingRecord } from "@/features/booking/types/booking-record.types";
import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase/admin";

type BookingRow = {
  id: string;
  booking_reference: string;
  user_id: string;
  booking_session_id: string;
  payment_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  selected_slots: string[];
  duration_minutes: number;
  total_price: number;
  advance_paid: number;
  remaining_amount: number;
  status: BookingRecord["status"];
  source?: BookingRecord["source"];
  notes?: string | null;
  cancellation_reason?: string | null;
  arrived_at?: string | null;
  match_started_at?: string | null;
  match_completed_at?: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  created_at: string;
  updated_at: string;
};

export function mapBooking(row: BookingRow): BookingRecord {
  return {
    id: row.id,
    bookingReference: row.booking_reference,
    userId: row.user_id,
    bookingSessionId: row.booking_session_id,
    paymentId: row.payment_id,
    bookingDate: row.booking_date,
    startTime: row.start_time,
    endTime: row.end_time,
    selectedSlots: row.selected_slots,
    durationMinutes: row.duration_minutes,
    totalPrice: row.total_price,
    advancePaid: row.advance_paid,
    remainingAmount: row.remaining_amount,
    status: row.status,
    source: row.source ?? "online",
    notes: row.notes ?? null,
    cancellationReason: row.cancellation_reason ?? null,
    arrivedAt: row.arrived_at ? new Date(row.arrived_at) : null,
    matchStartedAt: row.match_started_at ? new Date(row.match_started_at) : null,
    matchCompletedAt: row.match_completed_at ? new Date(row.match_completed_at) : null,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapPrismaBooking(row: {
  id: string;
  bookingReference: string;
  userId: string;
  bookingSessionId: string;
  paymentId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  selectedSlots: unknown;
  durationMinutes: number;
  totalPrice: number;
  advancePaid: number;
  remainingAmount: number;
  status: BookingRecord["status"];
  source?: BookingRecord["source"];
  notes?: string | null;
  cancellationReason?: string | null;
  arrivedAt?: Date | null;
  matchStartedAt?: Date | null;
  matchCompletedAt?: Date | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  createdAt: Date;
  updatedAt: Date;
}): BookingRecord {
  return {
    id: row.id,
    bookingReference: row.bookingReference,
    userId: row.userId,
    bookingSessionId: row.bookingSessionId,
    paymentId: row.paymentId,
    bookingDate: row.bookingDate,
    startTime: row.startTime,
    endTime: row.endTime,
    selectedSlots: row.selectedSlots as string[],
    durationMinutes: row.durationMinutes,
    totalPrice: row.totalPrice,
    advancePaid: row.advancePaid,
    remainingAmount: row.remainingAmount,
    status: row.status,
    source: row.source ?? "online",
    notes: row.notes ?? null,
    cancellationReason: row.cancellationReason ?? null,
    arrivedAt: row.arrivedAt ?? null,
    matchStartedAt: row.matchStartedAt ?? null,
    matchCompletedAt: row.matchCompletedAt ?? null,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    customerEmail: row.customerEmail,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getBookingById(id: string): Promise<BookingRecord | null> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase.from("bookings").select("*").eq("id", id).maybeSingle();
    if (!error && data) return mapBooking(data as BookingRow);
  }

  try {
    const row = await prisma.booking.findUnique({ where: { id } });
    if (!row) return null;
    return mapPrismaBooking(row);
  } catch {
    return null;
  }
}

export async function getBookingBySessionId(
  bookingSessionId: string,
): Promise<BookingRecord | null> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("booking_session_id", bookingSessionId)
      .maybeSingle();
    if (!error && data) return mapBooking(data as BookingRow);
  }

  try {
    const row = await prisma.booking.findUnique({ where: { bookingSessionId } });
    if (!row) return null;
    return mapPrismaBooking(row);
  } catch {
    return null;
  }
}

export async function countBookingsForDate(bookingDate: string): Promise<number> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    const { count, error } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("booking_date", bookingDate);
    if (!error && count !== null) return count;
  }

  try {
    return await prisma.booking.count({ where: { bookingDate } });
  } catch {
    return 0;
  }
}

export async function createBookingRecord(data: {
  bookingReference: string;
  userId: string;
  bookingSessionId: string;
  paymentId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  selectedSlots: string[];
  durationMinutes: number;
  totalPrice: number;
  advancePaid: number;
  remainingAmount: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  source?: BookingRecord["source"];
  notes?: string | null;
}): Promise<BookingRecord> {
  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();
  const { randomUUID } = await import("crypto");
  const id = randomUUID();

  if (supabase) {
    const payload = {
      id,
      booking_reference: data.bookingReference,
      user_id: data.userId,
      booking_session_id: data.bookingSessionId,
      payment_id: data.paymentId,
      booking_date: data.bookingDate,
      start_time: data.startTime,
      end_time: data.endTime,
      selected_slots: data.selectedSlots,
      duration_minutes: data.durationMinutes,
      total_price: data.totalPrice,
      advance_paid: data.advancePaid,
      remaining_amount: data.remainingAmount,
      status: "confirmed" as const,
      source: data.source ?? "online",
      notes: data.notes ?? null,
      customer_name: data.customerName,
      customer_phone: data.customerPhone,
      customer_email: data.customerEmail,
      created_at: now,
      updated_at: now,
    };

    const { data: row, error } = await supabase.from("bookings").insert(payload).select("*").single();
    if (!error && row) return mapBooking(row as BookingRow);
    if (error) throw new Error(error.message);
  }

  const row = await prisma.booking.create({
    data: {
      id,
      bookingReference: data.bookingReference,
      userId: data.userId,
      bookingSessionId: data.bookingSessionId,
      paymentId: data.paymentId,
      bookingDate: data.bookingDate,
      startTime: data.startTime,
      endTime: data.endTime,
      selectedSlots: data.selectedSlots,
      durationMinutes: data.durationMinutes,
      totalPrice: data.totalPrice,
      advancePaid: data.advancePaid,
      remainingAmount: data.remainingAmount,
      status: "confirmed",
      source: data.source ?? "online",
      notes: data.notes ?? null,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
    },
  });

  return mapPrismaBooking(row);
}

export async function deleteBookingById(id: string): Promise<void> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    await supabase.from("bookings").delete().eq("id", id);
    return;
  }

  try {
    await prisma.booking.delete({ where: { id } });
  } catch {
    // best effort cleanup
  }
}

export async function listBookingsByUserId(userId: string): Promise<BookingRecord[]> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      return (data as BookingRow[]).map(mapBooking);
    }
  }

  try {
    const rows = await prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return rows.map(mapPrismaBooking);
  } catch {
    return [];
  }
}

export async function listBookingsForDate(bookingDate: string): Promise<BookingRecord[]> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("booking_date", bookingDate)
      .order("start_time", { ascending: true });

    if (!error && data) {
      return (data as BookingRow[]).map(mapBooking);
    }
  }

  try {
    const rows = await prisma.booking.findMany({
      where: { bookingDate },
      orderBy: { startTime: "asc" },
    });

    return rows.map(mapPrismaBooking);
  } catch {
    return [];
  }
}

export async function listRecentBookings(limit = 10): Promise<BookingRecord[]> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!error && data) {
      return (data as BookingRow[]).map(mapBooking);
    }
  }

  try {
    const rows = await prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return rows.map(mapPrismaBooking);
  } catch {
    return [];
  }
}

export async function getBookingByReference(
  bookingReference: string,
): Promise<BookingRecord | null> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("booking_reference", bookingReference)
      .maybeSingle();
    if (!error && data) return mapBooking(data as BookingRow);
  }

  try {
    const row = await prisma.booking.findUnique({ where: { bookingReference } });
    if (!row) return null;
    return mapPrismaBooking(row);
  } catch {
    return null;
  }
}

export async function updateBookingRecord(
  id: string,
  data: Partial<
    Pick<
      BookingRecord,
      | "customerName"
      | "customerPhone"
      | "customerEmail"
      | "notes"
      | "totalPrice"
      | "advancePaid"
      | "remainingAmount"
      | "status"
      | "cancellationReason"
      | "arrivedAt"
      | "matchStartedAt"
      | "matchCompletedAt"
    >
  >,
): Promise<BookingRecord | null> {
  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();

  const payload: Record<string, unknown> = { updated_at: now };
  if (data.customerName !== undefined) payload.customer_name = data.customerName;
  if (data.customerPhone !== undefined) payload.customer_phone = data.customerPhone;
  if (data.customerEmail !== undefined) payload.customer_email = data.customerEmail;
  if (data.notes !== undefined) payload.notes = data.notes;
  if (data.totalPrice !== undefined) payload.total_price = data.totalPrice;
  if (data.advancePaid !== undefined) payload.advance_paid = data.advancePaid;
  if (data.remainingAmount !== undefined) payload.remaining_amount = data.remainingAmount;
  if (data.status !== undefined) payload.status = data.status;
  if (data.cancellationReason !== undefined) payload.cancellation_reason = data.cancellationReason;
  if (data.arrivedAt !== undefined) payload.arrived_at = data.arrivedAt?.toISOString() ?? null;
  if (data.matchStartedAt !== undefined) {
    payload.match_started_at = data.matchStartedAt?.toISOString() ?? null;
  }
  if (data.matchCompletedAt !== undefined) {
    payload.match_completed_at = data.matchCompletedAt?.toISOString() ?? null;
  }

  if (supabase) {
    const { data: row, error } = await supabase
      .from("bookings")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (!error && row) return mapBooking(row as BookingRow);
    if (error) throw new Error(error.message);
  }

  try {
    const row = await prisma.booking.update({
      where: { id },
      data: {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        notes: data.notes,
        totalPrice: data.totalPrice,
        advancePaid: data.advancePaid,
        remainingAmount: data.remainingAmount,
        status: data.status,
        cancellationReason: data.cancellationReason,
        arrivedAt: data.arrivedAt,
        matchStartedAt: data.matchStartedAt,
        matchCompletedAt: data.matchCompletedAt,
      },
    });
    return mapPrismaBooking(row);
  } catch {
    return null;
  }
}
