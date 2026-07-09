import { BOOKING_DEFAULTS } from "@/features/booking/config";
import { resolveSlotTimeBounds } from "@/features/booking/utils/slot-id";
import {
  getCurrentMinutesInTimezone,
  getTodayIsoInTimezone,
  resolveVenueTimezone,
} from "@/features/booking/utils/venue-timezone";
import type { BookingRecord } from "@/features/booking/types/booking-record.types";

type SchedulableBooking = Pick<
  BookingRecord,
  "bookingDate" | "selectedSlots" | "durationMinutes" | "status"
>;

export function getBookingSlotBounds(
  booking: Pick<BookingRecord, "selectedSlots" | "durationMinutes">,
) {
  return resolveSlotTimeBounds(
    booking.selectedSlots,
    booking.durationMinutes || BOOKING_DEFAULTS.slotDurationMinutes,
  );
}

export function getBookingStartMinute(
  booking: Pick<BookingRecord, "selectedSlots" | "durationMinutes">,
): number {
  return getBookingSlotBounds(booking)?.startMinute ?? 0;
}

function isSchedulableStatus(status: BookingRecord["status"]): boolean {
  return (
    status === "confirmed" ||
    status === "arrived" ||
    status === "in_progress"
  );
}

export function hasBookingStartTimePassed(
  booking: SchedulableBooking,
  now = new Date(),
  timezone?: string,
): boolean {
  const bounds = getBookingSlotBounds(booking);
  if (!bounds) return false;

  const tz = resolveVenueTimezone(timezone);
  const today = getTodayIsoInTimezone(now, tz);
  if (booking.bookingDate < today) return true;
  if (booking.bookingDate > today) return false;

  return getCurrentMinutesInTimezone(now, tz) >= bounds.startMinute;
}

export function isBookingInProgressNow(
  booking: SchedulableBooking,
  now = new Date(),
  timezone?: string,
): boolean {
  if (!isSchedulableStatus(booking.status)) return false;

  const bounds = getBookingSlotBounds(booking);
  if (!bounds) return false;

  const tz = resolveVenueTimezone(timezone);
  if (booking.bookingDate !== getTodayIsoInTimezone(now, tz)) return false;

  const currentMinute = getCurrentMinutesInTimezone(now, tz);
  return currentMinute >= bounds.startMinute && currentMinute < bounds.endMinute;
}

export function isBookingUpcomingNow(
  booking: SchedulableBooking,
  now = new Date(),
  timezone?: string,
): boolean {
  if (!isSchedulableStatus(booking.status)) return false;

  const bounds = getBookingSlotBounds(booking);
  if (!bounds) return false;

  const tz = resolveVenueTimezone(timezone);
  if (booking.bookingDate !== getTodayIsoInTimezone(now, tz)) return false;

  return getCurrentMinutesInTimezone(now, tz) < bounds.startMinute;
}
