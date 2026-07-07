import type {
  BookingPaymentRecord,
  BookingTimelineStep,
} from "@/features/admin/bookings/types/admin-booking.types";
import type { BookingRecord } from "@/features/booking/types/booking-record.types";

export function buildBookingTimeline(
  booking: BookingRecord,
  payments: BookingPaymentRecord[],
): BookingTimelineStep[] {
  const advancePayment = payments.find((payment) => payment.type === "advance");
  const remainingPayments = payments.filter((payment) => payment.type === "remaining");
  const lastRemaining = remainingPayments[remainingPayments.length - 1];
  const isPaid = booking.remainingAmount <= 0;

  const isCancelled = booking.status === "cancelled";
  const isCompleted = booking.status === "completed";
  const hasArrived = Boolean(booking.arrivedAt) || booking.status === "arrived" || booking.status === "in_progress" || isCompleted;
  const hasStarted = Boolean(booking.matchStartedAt) || booking.status === "in_progress" || isCompleted;

  const paymentStepStatus = (): BookingTimelineStep["status"] => {
    if (isCancelled) return "skipped";
    if (isPaid) return "completed";
    if (advancePayment || remainingPayments.length > 0) return "current";
    return "upcoming";
  };

  const steps: BookingTimelineStep[] = [
    {
      id: "created",
      label: "Booking Created",
      description: `${booking.bookingReference} · ${booking.source === "manual" ? "Manual" : "Online"}`,
      timestamp: booking.createdAt.toISOString(),
      status: "completed",
    },
    {
      id: "payment",
      label: isPaid ? "Fully Paid" : remainingPayments.length > 0 ? "Partially Paid" : "Payment Pending",
      description: isPaid
        ? `₹${booking.totalPrice} collected`
        : `₹${booking.remainingAmount} outstanding`,
      timestamp: lastRemaining?.createdAt.toISOString() ?? advancePayment?.createdAt.toISOString(),
      status: paymentStepStatus(),
    },
    {
      id: "confirmed",
      label: "Booking Confirmed",
      description: `${booking.startTime} – ${booking.endTime}`,
      timestamp: booking.createdAt.toISOString(),
      status: isCancelled ? "skipped" : "completed",
    },
    {
      id: "arrived",
      label: "Customer Arrived",
      description: hasArrived ? "Checked in at venue" : "Waiting for check-in",
      timestamp: booking.arrivedAt?.toISOString(),
      status: isCancelled ? "skipped" : hasArrived ? "completed" : booking.status === "confirmed" ? "current" : "upcoming",
    },
    {
      id: "in_progress",
      label: "Match In Progress",
      description: hasStarted ? "Team on turf" : "Match not started",
      timestamp: booking.matchStartedAt?.toISOString(),
      status: isCancelled
        ? "skipped"
        : hasStarted
          ? isCompleted
            ? "completed"
            : "current"
          : hasArrived
            ? "current"
            : "upcoming",
    },
    {
      id: "completed",
      label: isCancelled ? "Booking Cancelled" : "Completed",
      description: isCancelled
        ? booking.cancellationReason ?? "Cancelled by admin"
        : "Session finished",
      timestamp: booking.matchCompletedAt?.toISOString() ?? (isCancelled || isCompleted ? booking.updatedAt.toISOString() : undefined),
      status: isCancelled ? "completed" : isCompleted ? "completed" : "upcoming",
    },
  ];

  for (const payment of remainingPayments) {
    steps.push({
      id: `payment-${payment.id}`,
      label: "Payment Collected",
      description: `₹${payment.amount} via ${payment.method}${payment.referenceNumber ? ` · Ref ${payment.referenceNumber}` : ""}`,
      timestamp: payment.createdAt.toISOString(),
      status: "completed",
    });
  }

  return steps;
}
