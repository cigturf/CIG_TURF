import { ADMIN_LIST_LIMIT } from "@/config/cache.config";
import { toAdminBookingRecord } from "@/features/admin/bookings/lib/booking-utils";
import type {
  AdminBookingRecord,
  BookingPaymentRecord,
} from "@/features/admin/bookings/types/admin-booking.types";
import type { FinancePendingBooking } from "@/features/admin/finance/types/finance.types";
import { mapBooking } from "@/features/booking/services/booking.repository";
import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase/admin";

const BOOKING_LIST_COLUMNS =
  "id, booking_reference, user_id, booking_session_id, payment_id, booking_date, start_time, end_time, selected_slots, duration_minutes, total_price, advance_paid, remaining_amount, status, source, customer_name, customer_phone, customer_email, created_at, updated_at";

const PAYMENT_LIST_COLUMNS =
  "id, booking_id, type, amount, method, collected_by, notes, reference_number, created_at";

const PENDING_BOOKING_COLUMNS =
  "id, booking_reference, customer_name, customer_phone, booking_date, start_time, end_time, total_price, advance_paid, remaining_amount";

type BookingRow = Parameters<typeof mapBooking>[0];

function mapPendingBooking(row: {
  id: string;
  booking_reference: string;
  customer_name: string;
  customer_phone: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  advance_paid: number;
  remaining_amount: number;
}): FinancePendingBooking {
  return {
    id: row.id,
    bookingReference: row.booking_reference,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    outstanding: row.remaining_amount,
    bookingDate: row.booking_date,
    startTime: row.start_time,
    endTime: row.end_time,
    totalPrice: row.total_price,
    advancePaid: row.advance_paid,
  };
}

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

export async function listAllPaymentRecords(): Promise<BookingPaymentRecord[]> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("booking_payment_records")
      .select(PAYMENT_LIST_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(ADMIN_LIST_LIMIT);

    if (!error && data) {
      return (data as PaymentRecordRow[]).map(mapPaymentRecord);
    }
  }

  try {
    const rows = await prisma.bookingPaymentRecord.findMany({
      orderBy: { createdAt: "desc" },
      take: ADMIN_LIST_LIMIT,
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

export async function listAllPaymentRecordsInRange(
  fromIso: string,
  toIso: string,
): Promise<BookingPaymentRecord[]> {
  const from = `${fromIso}T00:00:00.000Z`;
  const to = `${toIso}T23:59:59.999Z`;

  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("booking_payment_records")
      .select(PAYMENT_LIST_COLUMNS)
      .gte("created_at", from)
      .lte("created_at", to)
      .order("created_at", { ascending: false });

    if (!error && data) {
      return (data as PaymentRecordRow[]).map(mapPaymentRecord);
    }
  }

  try {
    const rows = await prisma.bookingPaymentRecord.findMany({
      where: { createdAt: { gte: new Date(from), lte: new Date(to) } },
      orderBy: { createdAt: "desc" },
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

export async function listBookingsInRange(
  fromIso: string,
  toIso: string,
): Promise<AdminBookingRecord[]> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("bookings")
      .select(BOOKING_LIST_COLUMNS)
      .gte("booking_date", fromIso)
      .lte("booking_date", toIso)
      .order("booking_date", { ascending: false })
      .limit(ADMIN_LIST_LIMIT);

    if (!error && data) {
      return (data as BookingRow[]).map(mapBooking).map(toAdminBookingRecord);
    }
  }

  try {
    const rows = await prisma.booking.findMany({
      where: { bookingDate: { gte: fromIso, lte: toIso } },
      orderBy: { bookingDate: "desc" },
      take: ADMIN_LIST_LIMIT,
    });
    return rows.map((row) =>
      toAdminBookingRecord({
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
      }),
    );
  } catch {
    return [];
  }
}

export async function listAllBookings(): Promise<AdminBookingRecord[]> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("bookings")
      .select(BOOKING_LIST_COLUMNS)
      .order("booking_date", { ascending: false })
      .limit(ADMIN_LIST_LIMIT);

    if (!error && data) {
      return (data as BookingRow[]).map(mapBooking).map(toAdminBookingRecord);
    }
  }

  try {
    const rows = await prisma.booking.findMany({
      orderBy: { bookingDate: "desc" },
      take: ADMIN_LIST_LIMIT,
    });
    return rows.map((row) =>
      toAdminBookingRecord({
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
      }),
    );
  } catch {
    return [];
  }
}

export async function listBookingsByCustomerKey(
  customerKey: string,
): Promise<AdminBookingRecord[]> {
  const suffix = customerKey.replace(/\D/g, "").slice(-10) || customerKey;

  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("bookings")
      .select(BOOKING_LIST_COLUMNS)
      .ilike("customer_phone", `%${suffix}`)
      .order("booking_date", { ascending: false })
      .limit(ADMIN_LIST_LIMIT);

    if (!error && data) {
      return (data as BookingRow[]).map(mapBooking).map(toAdminBookingRecord);
    }
  }

  try {
    const rows = await prisma.booking.findMany({
      where: { customerPhone: { endsWith: suffix } },
      orderBy: { bookingDate: "desc" },
      take: ADMIN_LIST_LIMIT,
    });
    return rows.map((row) =>
      toAdminBookingRecord({
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
      }),
    );
  } catch {
    return [];
  }
}

export async function listPaymentRecordsForBookingIds(
  bookingIds: string[],
): Promise<BookingPaymentRecord[]> {
  if (bookingIds.length === 0) return [];

  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("booking_payment_records")
      .select(PAYMENT_LIST_COLUMNS)
      .in("booking_id", bookingIds)
      .order("created_at", { ascending: false });

    if (!error && data) {
      return (data as PaymentRecordRow[]).map(mapPaymentRecord);
    }
  }

  try {
    const rows = await prisma.bookingPaymentRecord.findMany({
      where: { bookingId: { in: bookingIds } },
      orderBy: { createdAt: "desc" },
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

export async function listPendingCollectionBookings(): Promise<FinancePendingBooking[]> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("bookings")
      .select(PENDING_BOOKING_COLUMNS)
      .neq("status", "cancelled")
      .gt("remaining_amount", 0)
      .order("booking_date", { ascending: true })
      .limit(ADMIN_LIST_LIMIT);

    if (!error && data) {
      return (data as Parameters<typeof mapPendingBooking>[0][]).map(mapPendingBooking);
    }
  }

  try {
    const rows = await prisma.booking.findMany({
      where: {
        status: { not: "cancelled" },
        remainingAmount: { gt: 0 },
      },
      select: {
        id: true,
        bookingReference: true,
        customerName: true,
        customerPhone: true,
        bookingDate: true,
        startTime: true,
        endTime: true,
        totalPrice: true,
        advancePaid: true,
        remainingAmount: true,
      },
      orderBy: [{ bookingDate: "asc" }, { startTime: "asc" }],
      take: ADMIN_LIST_LIMIT,
    });

    return rows.map((row) => ({
      id: row.id,
      bookingReference: row.bookingReference,
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      outstanding: row.remainingAmount,
      bookingDate: row.bookingDate,
      startTime: row.startTime,
      endTime: row.endTime,
      totalPrice: row.totalPrice,
      advancePaid: row.advancePaid,
    }));
  } catch {
    return [];
  }
}
