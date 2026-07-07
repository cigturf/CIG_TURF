import type { DashboardOperationsBooking } from "@/features/admin/dashboard/types/dashboard.types";
import { toAdminBookingRecord } from "@/features/admin/bookings/lib/booking-utils";
import { isActiveOperationsStatus } from "@/features/admin/bookings/lib/booking-status";
import type { BookingRecord } from "@/features/booking/types/booking-record.types";
import { parseTimeToMinutes } from "@/features/booking/utils/time";

export type { DashboardOperationsBooking };

export type DashboardOperationsData = {
  currentMatch: DashboardOperationsBooking | null;
  upcomingMatch: DashboardOperationsBooking | null;
  pendingCollections: DashboardOperationsBooking[];
  waitingForCheckIn: DashboardOperationsBooking[];
};

function sortByStartTime(bookings: BookingRecord[]): BookingRecord[] {
  return [...bookings].sort(
    (a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime),
  );
}

export function buildDashboardOperations(bookings: BookingRecord[]): DashboardOperationsData {
  const active = sortByStartTime(
    bookings.filter(
      (booking) => booking.status !== "cancelled" && booking.status !== "expired",
    ),
  ).map(toAdminBookingRecord);

  const currentMatch =
    active.find((booking) => booking.status === "in_progress") ?? null;

  const upcomingMatch =
    active.find(
      (booking) =>
        !currentMatch &&
        (booking.status === "confirmed" ||
          booking.status === "arrived" ||
          booking.status === "in_progress"),
    ) ??
    active.find((booking) => booking.status === "confirmed" || booking.status === "arrived") ??
    null;

  const pendingCollections = active.filter(
    (booking) => booking.remainingAmount > 0 && isActiveOperationsStatus(booking.status),
  );

  const waitingForCheckIn = active.filter((booking) => booking.status === "confirmed");

  return {
    currentMatch,
    upcomingMatch: currentMatch ? upcomingMatch : upcomingMatch,
    pendingCollections,
    waitingForCheckIn,
  };
}

export function resolveCurrentMatch(
  bookings: BookingRecord[],
  now = new Date(),
): DashboardOperationsBooking | null {
  const currentMinute = now.getHours() * 60 + now.getMinutes();
  const active = bookings
    .filter((booking) => booking.status === "in_progress")
    .map(toAdminBookingRecord);

  if (active.length > 0) return active[0] ?? null;

  const inWindow = bookings
    .filter((booking) => {
      if (booking.status !== "arrived" && booking.status !== "confirmed") return false;
      const start = parseTimeToMinutes(booking.startTime);
      const end = parseTimeToMinutes(booking.endTime);
      return currentMinute >= start && currentMinute <= end;
    })
    .map(toAdminBookingRecord);

  return inWindow[0] ?? null;
}
