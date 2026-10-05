import { resolvePaymentMethodLabel } from "@/features/admin/reports/lib/reports-aggregation";
import type {
  BookingPaymentRecord,
  BookingTimelineStep,
} from "@/features/admin/bookings/types/admin-booking.types";
import type { BookingRecord } from "@/features/booking/types/booking-record.types";
import { formatCurrency } from "@/utils";

function byCreatedAt(a: BookingPaymentRecord, b: BookingPaymentRecord): number {
  return a.createdAt.getTime() - b.createdAt.getTime();
}

function describePayment(payment: BookingPaymentRecord): string {
  const method = resolvePaymentMethodLabel(payment);
  const reference = payment.referenceNumber ? ` · Ref ${payment.referenceNumber}` : "";
  return `${formatCurrency(payment.amount)} via ${method}${reference}`;
}

/**
 * A chronological, plain-language narrative of a booking's money and status
 * events — every advance/collection/adjustment individually, how much is
 * still pending (or that it's fully paid), and for a cancelled booking, the
 * exact reason plus whether a refund actually went out.
 */
export function buildBookingTimeline(
  booking: BookingRecord,
  payments: BookingPaymentRecord[],
): BookingTimelineStep[] {
  const advancePayments = payments.filter((payment) => payment.type === "advance").sort(byCreatedAt);
  const collectionPayments = payments
    .filter((payment) => payment.type === "remaining" || payment.type === "adjustment")
    .sort(byCreatedAt);
  const refundPayments = payments.filter((payment) => payment.type === "refund").sort(byCreatedAt);

  const isCancelled = booking.status === "cancelled";
  const isCompleted = booking.status === "completed";

  const totalCollected =
    advancePayments.reduce((sum, payment) => sum + payment.amount, 0) +
    collectionPayments.reduce((sum, payment) => sum + payment.amount, 0);

  const steps: BookingTimelineStep[] = [
    {
      id: "created",
      label: "Booking Created",
      description: `${booking.bookingReference} · ${booking.source === "manual" ? "Manual (front desk)" : "Online"} · Total ${formatCurrency(booking.totalPrice)}`,
      timestamp: booking.createdAt.toISOString(),
      status: "completed",
    },
  ];

  for (const payment of advancePayments) {
    steps.push({
      id: `advance-${payment.id}`,
      label: "Advance Paid",
      description: describePayment(payment),
      timestamp: payment.createdAt.toISOString(),
      status: "completed",
    });
  }

  for (const payment of collectionPayments) {
    steps.push({
      id: `collected-${payment.id}`,
      label: payment.type === "adjustment" ? "Additional Advance Collected" : "Payment Collected",
      description: describePayment(payment),
      timestamp: payment.createdAt.toISOString(),
      status: "completed",
    });
  }

  const isFullyPaid = booking.remainingAmount <= 0 && booking.totalPrice > 0;

  if (!isCancelled) {
    if (isFullyPaid) {
      const lastPayment = [...advancePayments, ...collectionPayments].sort(byCreatedAt).at(-1);
      steps.push({
        id: "fully-paid",
        label: "Fully Paid",
        description: `${formatCurrency(booking.totalPrice)} collected in total`,
        timestamp: lastPayment?.createdAt.toISOString(),
        status: "completed",
      });
    } else {
      steps.push({
        id: "pending",
        label: "Payment Pending",
        description: `${formatCurrency(booking.remainingAmount)} still due of ${formatCurrency(booking.totalPrice)} total${totalCollected > 0 ? ` · ${formatCurrency(totalCollected)} collected so far` : ""}`,
        status: "current",
      });
    }
  }

  if (isCancelled) {
    steps.push({
      id: "cancelled",
      label: "Booking Cancelled",
      description: booking.cancellationReason
        ? `Reason: ${booking.cancellationReason}`
        : "No reason recorded",
      timestamp: booking.updatedAt.toISOString(),
      status: "completed",
    });

    if (refundPayments.length > 0) {
      for (const refund of refundPayments) {
        steps.push({
          id: `refund-${refund.id}`,
          label: "Refund Issued",
          description: describePayment(refund),
          timestamp: refund.createdAt.toISOString(),
          status: "completed",
        });
      }
    } else {
      steps.push({
        id: "no-refund",
        label: "No Refund Issued",
        description:
          totalCollected > 0
            ? `Cancelled without processing a refund (${formatCurrency(totalCollected)} was collected)`
            : "No payment had been collected before cancellation",
        status: "completed",
      });
    }
  } else if (isCompleted) {
    steps.push({
      id: "completed",
      label: "Booking Completed",
      description: "Session finished",
      timestamp: (booking.matchCompletedAt ?? booking.updatedAt).toISOString(),
      status: "completed",
    });
  } else {
    steps.push({
      id: "awaiting-completion",
      label: "Awaiting Completion",
      status: "upcoming",
    });
  }

  return steps;
}
