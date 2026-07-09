import type { AdminBookingRecord } from "@/features/admin/bookings/types/admin-booking.types";
import {
  hasBookingStartTimePassed,
} from "@/features/admin/bookings/lib/booking-schedule";
import type { BookingRecord, BookingStatus } from "@/features/booking/types/booking-record.types";

type StatusBadgeConfig = {
  label: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "default";
};

export function resolveBookingStatusBadge(status: BookingStatus): StatusBadgeConfig {
  switch (status) {
    case "confirmed":
    case "arrived":
    case "in_progress":
      return {
        label:
          status === "arrived"
            ? "Arrived"
            : status === "in_progress"
              ? "In Progress"
              : "Confirmed",
        status: "confirmed",
      };
    case "cancelled":
      return { label: "Cancelled", status: "cancelled" };
    case "completed":
      return { label: "Completed", status: "completed" };
    case "expired":
    default:
      return { label: "Expired", status: "default" };
  }
}

export function resolvePaymentStatusBadge(
  paymentStatus: AdminBookingRecord["paymentStatus"],
): StatusBadgeConfig {
  switch (paymentStatus) {
    case "paid":
      return { label: "Paid", status: "confirmed" };
    case "partial":
      return { label: "Partially Paid", status: "pending" };
    case "pending":
      return { label: "Pending", status: "pending" };
    case "refunded":
      return { label: "Refunded", status: "cancelled" };
    default:
      return { label: "Pending", status: "pending" };
  }
}

export function canCollectPayment(status: BookingStatus): boolean {
  return status !== "cancelled" && status !== "completed" && status !== "expired";
}

export function canCompleteBooking(
  booking: Pick<
    BookingRecord,
    "status" | "bookingDate" | "selectedSlots" | "durationMinutes"
  >,
  now = new Date(),
  timezone?: string,
): boolean {
  const completableStatus =
    booking.status === "confirmed" ||
    booking.status === "arrived" ||
    booking.status === "in_progress";

  if (!completableStatus) return false;
  return hasBookingStartTimePassed(booking, now, timezone);
}

export function isActiveOperationsStatus(status: BookingStatus): boolean {
  return status === "confirmed" || status === "arrived" || status === "in_progress";
}
