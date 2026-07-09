import type { DashboardOperationsBooking } from "@/features/admin/dashboard/types/dashboard.types";
import { toAdminBookingRecord } from "@/features/admin/bookings/lib/booking-utils";
import {
  getBookingStartMinute,
  isBookingInProgressNow,
  isBookingUpcomingNow,
} from "@/features/admin/bookings/lib/booking-schedule";
import { isActiveOperationsStatus } from "@/features/admin/bookings/lib/booking-status";
import type { BookingRecord } from "@/features/booking/types/booking-record.types";
import { resolveVenueTimezone } from "@/features/booking/utils/venue-timezone";

export type { DashboardOperationsBooking };

export type DashboardOperationsData = {
  currentMatch: DashboardOperationsBooking | null;
  upcomingMatch: DashboardOperationsBooking | null;
  pendingCollections: DashboardOperationsBooking[];
};

function sortBySlotStart(bookings: BookingRecord[]): BookingRecord[] {
  return [...bookings].sort(
    (a, b) => getBookingStartMinute(a) - getBookingStartMinute(b),
  );
}

export function buildDashboardOperations(
  bookings: BookingRecord[],
  options?: { now?: Date; timezone?: string },
): DashboardOperationsData {
  const now = options?.now ?? new Date();
  const timezone = resolveVenueTimezone(options?.timezone);

  const active = sortBySlotStart(
    bookings.filter(
      (booking) => booking.status !== "cancelled" && booking.status !== "expired",
    ),
  ).map(toAdminBookingRecord);

  const schedulable = active.filter((booking) => isActiveOperationsStatus(booking.status));

  const currentMatch =
    schedulable.find((booking) => isBookingInProgressNow(booking, now, timezone)) ?? null;

  const upcomingMatch =
    schedulable
      .filter((booking) => booking.id !== currentMatch?.id)
      .find((booking) => isBookingUpcomingNow(booking, now, timezone)) ?? null;

  const pendingCollections = active.filter(
    (booking) => booking.remainingAmount > 0 && isActiveOperationsStatus(booking.status),
  );

  return {
    currentMatch,
    upcomingMatch,
    pendingCollections,
  };
}
