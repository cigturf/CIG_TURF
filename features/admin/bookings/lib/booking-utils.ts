import type {
  AdminBookingDetail,
  AdminBookingRecord,
  BookingAuditLog,
  BookingPaymentRecord,
  BookingPaymentStatus,
} from "@/features/admin/bookings/types/admin-booking.types";
import type { BookingRecord } from "@/features/booking/types/booking-record.types";

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

/**
 * True only for a payment the online checkout captured automatically through
 * Razorpay (features/booking/services/booking-finalization.service.ts never
 * sets collectedBy). Any admin-recorded payment — a manual booking's advance,
 * a collected remaining balance, or an "Edit Amounts" correction — always has
 * collectedBy set, even if its method happens to be "online"/"upi", because an
 * admin choosing that method at the counter is not the same as Razorpay
 * actually capturing the money. Use this before ever labeling a payment
 * "Razorpay" or treating its amount as immutable.
 */
export function isGenuineRazorpayPayment(
  payment: Pick<BookingPaymentRecord, "method" | "collectedBy">,
): boolean {
  return payment.method === "online" && payment.collectedBy === null;
}

export function normalizeAdminBookingRecord(
  booking: AdminBookingRecord & { createdAt: Date | string; updatedAt: Date | string },
): AdminBookingRecord {
  return {
    ...booking,
    createdAt: toDate(booking.createdAt),
    updatedAt: toDate(booking.updatedAt),
  };
}

export function normalizeAdminBookingDetail(
  detail: AdminBookingDetail & {
    createdAt: Date | string;
    updatedAt: Date | string;
    payments: Array<BookingPaymentRecord & { createdAt: Date | string }>;
    auditLogs?: Array<BookingAuditLog & { createdAt: Date | string }>;
  },
): AdminBookingDetail {
  return {
    ...normalizeAdminBookingRecord(detail),
    payments: detail.payments.map((payment) => ({
      ...payment,
      createdAt: toDate(payment.createdAt),
    })),
    auditLogs: (detail.auditLogs ?? []).map((entry) => ({
      ...entry,
      createdAt: toDate(entry.createdAt),
    })),
    timeline: detail.timeline,
  };
}

export function formatBookingTimestamp(value: Date | string): string {
  return toDate(value).toLocaleDateString("en-IN");
}

export function formatBookingTimestampFull(value: Date | string): string {
  return toDate(value).toLocaleString("en-IN");
}

export function resolveBookingPaymentStatus(
  booking: Pick<BookingRecord, "status" | "remainingAmount" | "totalPrice" | "advancePaid">,
): BookingPaymentStatus {
  if (booking.status === "cancelled") {
    return booking.remainingAmount <= 0 ? "refunded" : "partial";
  }

  if (booking.remainingAmount <= 0) return "paid";
  if (booking.advancePaid > 0) return "partial";
  return "pending";
}

export function toAdminBookingRecord(booking: BookingRecord): AdminBookingRecord {
  return {
    ...booking,
    source: booking.source ?? "online",
    notes: booking.notes ?? null,
    cancellationReason: booking.cancellationReason ?? null,
    paymentStatus: resolveBookingPaymentStatus(booking),
  };
}

export function formatDurationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) return `${hours} hr`;
  return `${hours} hr ${remainder} min`;
}

export function formatBookingDateLabel(dateIso: string): string {
  const date = new Date(`${dateIso}T12:00:00`);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
