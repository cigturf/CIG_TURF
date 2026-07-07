import type {
  AdminBookingListQuery,
  BookingDateFilter,
  BookingSortField,
} from "@/features/admin/bookings/types/admin-booking.types";
import { addDaysToIsoDate, getTodayIso } from "@/features/booking/utils/time";

export function resolveDateRange(filter?: BookingDateFilter, customDate?: string) {
  if (!filter) return null;

  const today = getTodayIso();

  if (filter === "today") {
    return { from: today, to: today };
  }

  if (filter === "tomorrow") {
    const tomorrow = addDaysToIsoDate(today, 1);
    return { from: tomorrow, to: tomorrow };
  }

  if (filter === "week") {
    return { from: today, to: addDaysToIsoDate(today, 6) };
  }

  if (filter === "custom" && customDate) {
    return { from: customDate, to: customDate };
  }

  return null;
}

export function resolveSlotViewDate(query: AdminBookingListQuery): string {
  const range = resolveDateRange(query.dateFilter, query.customDate);
  if (range && range.from === range.to) {
    return range.from;
  }
  return getTodayIso();
}

export function resolveSortOrder(sort: BookingSortField = "newest") {
  switch (sort) {
    case "oldest":
      return { field: "created_at" as const, ascending: true };
    case "time":
      return { field: "booking_date" as const, ascending: true };
    case "amount":
      return { field: "total_price" as const, ascending: false };
    case "customer":
      return { field: "customer_name" as const, ascending: true };
    case "newest":
    default:
      return { field: "created_at" as const, ascending: false };
  }
}

export function parseBookingListQuery(searchParams: URLSearchParams): AdminBookingListQuery {
  const status = searchParams.getAll("status").filter(Boolean) as NonNullable<
    AdminBookingListQuery["status"]
  >;
  const source = searchParams.getAll("source").filter(Boolean) as NonNullable<
    AdminBookingListQuery["source"]
  >;

  return {
    search: searchParams.get("search") ?? undefined,
    dateFilter: (searchParams.get("dateFilter") as BookingDateFilter) ?? undefined,
    customDate: searchParams.get("customDate") ?? undefined,
    status: status.length > 0 ? status : undefined,
    source: source.length > 0 ? source : undefined,
    sort: (searchParams.get("sort") as BookingSortField) ?? "newest",
  };
}

export const DEFAULT_ADMIN_BOOKINGS_QUERY: AdminBookingListQuery = {
  dateFilter: "today",
  sort: "newest",
};
