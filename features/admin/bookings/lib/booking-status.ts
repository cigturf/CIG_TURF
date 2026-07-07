import type { AdminBookingRecord } from "@/features/admin/bookings/types/admin-booking.types";
import type { BookingStatus } from "@/features/booking/types/booking-record.types";

type StatusBadgeConfig = {
  label: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "default";
};

export function resolveBookingStatusBadge(status: BookingStatus): StatusBadgeConfig {
  switch (status) {
    case "confirmed":
      return { label: "Confirmed", status: "confirmed" };
    case "arrived":
      return { label: "Arrived", status: "pending" };
    case "in_progress":
      return { label: "In Progress", status: "pending" };
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

export function canMarkArrived(status: BookingStatus): boolean {
  return status === "confirmed";
}

export function canStartMatch(status: BookingStatus): boolean {
  return status === "arrived";
}

export function canCollectPayment(status: BookingStatus): boolean {
  return status !== "cancelled" && status !== "completed" && status !== "expired";
}

export function canCompleteBooking(status: BookingStatus): boolean {
  return status === "in_progress" || status === "arrived" || status === "confirmed";
}

export function isActiveOperationsStatus(status: BookingStatus): boolean {
  return status === "confirmed" || status === "arrived" || status === "in_progress";
}
