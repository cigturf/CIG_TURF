import { toAdminBookingRecord } from "@/features/admin/bookings/lib/booking-utils";
import type {
  AdminBookingRecord,
  BookingPaymentRecord,
} from "@/features/admin/bookings/types/admin-booking.types";
import type { BookingRecord } from "@/features/booking/types/booking-record.types";
import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase/admin";

const REPORTS_BOOKING_COLUMNS =
  "id, booking_date, start_time, selected_slots, total_price, advance_paid, remaining_amount, status, source";

const REPORTS_PAYMENT_COLUMNS = "id, booking_id, type, amount, method, created_at";

type ReportsBookingRow = {
  id: string;
  booking_date: string;
  start_time: string;
  selected_slots: string[];
  total_price: number;
  advance_paid: number;
  remaining_amount: number;
  status: BookingRecord["status"];
  source: BookingRecord["source"] | null;
};

type PaymentRecordRow = {
  id: string;
  booking_id: string;
  type: BookingPaymentRecord["type"];
  amount: number;
  method: BookingPaymentRecord["method"];
  created_at: string;
};

function mapReportsBooking(row: ReportsBookingRow): AdminBookingRecord {
  const createdAt = new Date(`${row.booking_date}T12:00:00`);
  return toAdminBookingRecord({
    id: row.id,
    bookingReference: row.id,
    userId: "",
    bookingSessionId: "",
    paymentId: "",
    bookingDate: row.booking_date,
    startTime: row.start_time,
    endTime: row.start_time,
    selectedSlots: row.selected_slots ?? [],
    durationMinutes: 60,
    totalPrice: row.total_price,
    advancePaid: row.advance_paid,
    remainingAmount: row.remaining_amount,
    status: row.status,
    source: row.source ?? "online",
    notes: null,
    cancellationReason: null,
    arrivedAt: null,
    matchStartedAt: null,
    matchCompletedAt: null,
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    createdAt,
    updatedAt: createdAt,
  });
}

function mapPrismaReportsBooking(row: {
  id: string;
  bookingDate: string;
  startTime: string;
  selectedSlots: unknown;
  totalPrice: number;
  advancePaid: number;
  remainingAmount: number;
  status: string;
  source: string | null;
}): AdminBookingRecord {
  return mapReportsBooking({
    id: row.id,
    booking_date: row.bookingDate,
    start_time: row.startTime,
    selected_slots: row.selectedSlots as string[],
    total_price: row.totalPrice,
    advance_paid: row.advancePaid,
    remaining_amount: row.remainingAmount,
    status: row.status as BookingRecord["status"],
    source: row.source as BookingRecord["source"] | null,
  });
}

function mapRow(row: PaymentRecordRow): BookingPaymentRecord {
  return {
    id: row.id,
    bookingId: row.booking_id,
    type: row.type,
    amount: row.amount,
    method: row.method,
    collectedBy: null,
    notes: null,
    referenceNumber: null,
    createdAt: new Date(row.created_at),
  };
}

export async function listBookingsInRange(
  fromIso: string,
  toIso: string,
): Promise<AdminBookingRecord[]> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("bookings")
      .select(REPORTS_BOOKING_COLUMNS)
      .gte("booking_date", fromIso)
      .lte("booking_date", toIso)
      .order("booking_date", { ascending: true });

    if (!error && data) {
      return (data as ReportsBookingRow[]).map(mapReportsBooking);
    }
  }

  try {
    const rows = await prisma.booking.findMany({
      where: { bookingDate: { gte: fromIso, lte: toIso } },
      orderBy: { bookingDate: "asc" },
      select: {
        id: true,
        bookingDate: true,
        startTime: true,
        selectedSlots: true,
        totalPrice: true,
        advancePaid: true,
        remainingAmount: true,
        status: true,
        source: true,
      },
    });

    return rows.map(mapPrismaReportsBooking);
  } catch {
    return [];
  }
}

export async function listPaymentRecordsInRange(
  fromIso: string,
  toIso: string,
): Promise<BookingPaymentRecord[]> {
  const from = `${fromIso}T00:00:00.000Z`;
  const to = `${toIso}T23:59:59.999Z`;

  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("booking_payment_records")
      .select(REPORTS_PAYMENT_COLUMNS)
      .gte("created_at", from)
      .lte("created_at", to)
      .order("created_at", { ascending: true });

    if (!error && data) return (data as PaymentRecordRow[]).map(mapRow);
  }

  try {
    const rows = await prisma.bookingPaymentRecord.findMany({
      where: { createdAt: { gte: new Date(from), lte: new Date(to) } },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        bookingId: true,
        type: true,
        amount: true,
        method: true,
        createdAt: true,
      },
    });
    return rows.map((row) => ({
      id: row.id,
      bookingId: row.bookingId,
      type: row.type,
      amount: row.amount,
      method: row.method as BookingPaymentRecord["method"],
      collectedBy: null,
      notes: null,
      referenceNumber: null,
      createdAt: row.createdAt,
    }));
  } catch {
    return [];
  }
}

export async function countBookedSlotsInRange(fromIso: string, toIso: string): Promise<number> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    const { count, error } = await supabase
      .from("booked_slots")
      .select("*", { count: "exact", head: true })
      .gte("booking_date", fromIso)
      .lte("booking_date", toIso);
    if (!error && count !== null) return count;
  }

  try {
    return await prisma.bookedSlot.count({
      where: { bookingDate: { gte: fromIso, lte: toIso } },
    });
  } catch {
    return 0;
  }
}

export async function countSlotBlocksInRange(
  fromIso: string,
  toIso: string,
): Promise<{ blocked: number; maintenance: number }> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    const [blockedResult, maintenanceResult] = await Promise.all([
      supabase
        .from("slot_blocks")
        .select("*", { count: "exact", head: true })
        .eq("state", "blocked")
        .gte("booking_date", fromIso)
        .lte("booking_date", toIso),
      supabase
        .from("slot_blocks")
        .select("*", { count: "exact", head: true })
        .eq("state", "maintenance")
        .gte("booking_date", fromIso)
        .lte("booking_date", toIso),
    ]);

    if (!blockedResult.error && !maintenanceResult.error) {
      return {
        blocked: blockedResult.count ?? 0,
        maintenance: maintenanceResult.count ?? 0,
      };
    }
  }

  try {
    const [blocked, maintenance] = await Promise.all([
      prisma.slotBlock.count({
        where: { bookingDate: { gte: fromIso, lte: toIso }, state: "blocked" },
      }),
      prisma.slotBlock.count({
        where: { bookingDate: { gte: fromIso, lte: toIso }, state: "maintenance" },
      }),
    ]);
    return { blocked, maintenance };
  } catch {
    return { blocked: 0, maintenance: 0 };
  }
}
