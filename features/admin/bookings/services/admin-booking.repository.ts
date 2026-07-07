import { ADMIN_LIST_LIMIT } from "@/config/cache.config";
import type {
  AdminBookingListQuery,
  AdminBookingListResponse,
} from "@/features/admin/bookings/types/admin-booking.types";
import { resolveDateRange, resolveSortOrder } from "@/features/admin/bookings/lib/booking-filters";
import { toAdminBookingRecord } from "@/features/admin/bookings/lib/booking-utils";
import type { BookingRecord } from "@/features/booking/types/booking-record.types";
import { mapBooking } from "@/features/booking/services/booking.repository";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";

type BookingRow = Parameters<typeof mapBooking>[0];

function applyClientFilters(bookings: BookingRecord[], query: AdminBookingListQuery) {
  let filtered = [...bookings];

  if (query.search) {
    const term = query.search.trim().toLowerCase();
    filtered = filtered.filter(
      (booking) =>
        booking.bookingReference.toLowerCase().includes(term) ||
        booking.customerName.toLowerCase().includes(term) ||
        booking.customerPhone.includes(term) ||
        booking.customerEmail.toLowerCase().includes(term),
    );
  }

  const dateRange = resolveDateRange(query.dateFilter, query.customDate);
  if (dateRange) {
    filtered = filtered.filter(
      (booking) =>
        booking.bookingDate >= dateRange.from && booking.bookingDate <= dateRange.to,
    );
  }

  if (query.status?.length) {
    filtered = filtered.filter((booking) => {
      if (query.status!.includes("pending_payment")) {
        return booking.status === "confirmed" && booking.remainingAmount > 0;
      }
      if (query.status!.includes("arrived")) {
        return booking.status === "arrived";
      }
      if (query.status!.includes("in_progress")) {
        return booking.status === "in_progress";
      }
      return query.status!.includes(booking.status as never);
    });
  }

  if (query.source?.length) {
    filtered = filtered.filter((booking) => query.source!.includes(booking.source));
  }

  const sort = resolveSortOrder(query.sort);
  filtered.sort((a, b) => {
    const direction = sort.ascending ? 1 : -1;
    switch (sort.field) {
      case "booking_date":
        return a.bookingDate.localeCompare(b.bookingDate) * direction;
      case "total_price":
        return (a.totalPrice - b.totalPrice) * direction;
      case "customer_name":
        return a.customerName.localeCompare(b.customerName) * direction;
      case "created_at":
      default:
        return (a.createdAt.getTime() - b.createdAt.getTime()) * direction;
    }
  });

  return filtered;
}

export async function listAdminBookings(
  query: AdminBookingListQuery = {},
): Promise<AdminBookingListResponse> {
  const supabase = createServiceRoleClient();

  if (supabase) {
    let request = supabase.from("bookings").select("*", { count: "exact" });

    const dateRange = resolveDateRange(query.dateFilter, query.customDate);
    if (dateRange) {
      request = request.gte("booking_date", dateRange.from).lte("booking_date", dateRange.to);
    }

    if (query.source?.length === 1) {
      request = request.eq("source", query.source[0]);
    }

    if (query.status?.length === 1 && !query.status.includes("pending_payment")) {
      request = request.eq("status", query.status[0]);
    }

    const sort = resolveSortOrder(query.sort);
    request = request.order(sort.field, { ascending: sort.ascending }).limit(ADMIN_LIST_LIMIT);

    const { data, error } = await request;
    if (!error && data) {
      const bookings = applyClientFilters((data as BookingRow[]).map(mapBooking), query);
      return {
        bookings: bookings.map(toAdminBookingRecord),
        total: bookings.length,
      };
    }
  }

  try {
    const dateRange = resolveDateRange(query.dateFilter, query.customDate);
    const sort = resolveSortOrder(query.sort);

    const rows = await prisma.booking.findMany({
      where: {
        ...(dateRange
          ? { bookingDate: { gte: dateRange.from, lte: dateRange.to } }
          : {}),
        ...(query.source?.length === 1 ? { source: query.source[0] } : {}),
        ...(query.status?.length === 1 && query.status[0] !== "pending_payment"
          ? { status: query.status[0] }
          : {}),
      },
      orderBy:
        sort.field === "booking_date"
          ? { bookingDate: sort.ascending ? "asc" : "desc" }
          : sort.field === "total_price"
            ? { totalPrice: sort.ascending ? "asc" : "desc" }
            : sort.field === "customer_name"
              ? { customerName: sort.ascending ? "asc" : "desc" }
              : { createdAt: sort.ascending ? "asc" : "desc" },
      take: ADMIN_LIST_LIMIT,
    });

    const bookings = applyClientFilters(
      rows.map((row) => ({
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
      })),
      query,
    );

    return {
      bookings: bookings.map(toAdminBookingRecord),
      total: bookings.length,
    };
  } catch {
    return { bookings: [], total: 0 };
  }
}

export async function searchAdminBookings(query: string, limit = 8) {
  const normalized = query.trim();
  if (!normalized) return [];

  const supabase = createServiceRoleClient();
  const term = `%${normalized}%`;

  if (supabase) {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .or(
        [
          `booking_reference.ilike.${term}`,
          `customer_name.ilike.${term}`,
          `customer_phone.ilike.${term}`,
          `customer_email.ilike.${term}`,
        ].join(","),
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!error && data) {
      return (data as BookingRow[]).map(mapBooking).map(toAdminBookingRecord);
    }
  }

  try {
    const rows = await prisma.booking.findMany({
      where: {
        OR: [
          { bookingReference: { contains: normalized, mode: "insensitive" } },
          { customerName: { contains: normalized, mode: "insensitive" } },
          { customerPhone: { contains: normalized } },
          { customerEmail: { contains: normalized, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: limit,
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
