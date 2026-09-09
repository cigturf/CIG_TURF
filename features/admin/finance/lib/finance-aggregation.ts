import type { AdminBookingRecord, BookingPaymentRecord } from "@/features/admin/bookings/types/admin-booking.types";
import type {
  FinanceBookingCounts,
  FinanceDailyClosing,
  FinanceOverview,
  FinanceReconciliation,
  FinanceTransaction,
} from "@/features/admin/finance/types/finance.types";
import { enumerateIsoDates } from "@/features/admin/reports/lib/report-date-range";
import {
  buildPaymentBreakdown,
  buildPendingPaymentsSeries,
} from "@/features/admin/reports/lib/reports-aggregation";
import type { ReportSeriesPoint } from "@/features/admin/reports/types/reports.types";

function paymentNetAmount(payment: BookingPaymentRecord): number {
  return payment.type === "refund" ? -payment.amount : payment.amount;
}

function sumPayments(
  payments: BookingPaymentRecord[],
  predicate?: (payment: BookingPaymentRecord) => boolean,
): number {
  return payments
    .filter((payment) => (predicate ? predicate(payment) : true))
    .reduce((sum, payment) => sum + paymentNetAmount(payment), 0);
}

function paymentsInRange(
  payments: BookingPaymentRecord[],
  from: string,
  to: string,
): BookingPaymentRecord[] {
  return payments.filter((payment) => {
    const date = payment.createdAt.toISOString().slice(0, 10);
    return date >= from && date <= to;
  });
}

function shortDateLabel(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function buildFinanceOverview(input: {
  periodBookingPayments: BookingPaymentRecord[];
  periodBookings: AdminBookingRecord[];
}): FinanceOverview {
  const activePeriodBookings = input.periodBookings.filter(
    (booking) => booking.status !== "cancelled",
  );
  const totalAmount = activePeriodBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
  const collectedAmount = sumPayments(input.periodBookingPayments);

  return {
    totalAmount,
    collectedAmount,
    pendingCollections: activePeriodBookings.reduce(
      (sum, booking) => sum + booking.remainingAmount,
      0,
    ),
    advanceCollected: sumPayments(
      input.periodBookingPayments,
      (payment) => payment.type === "advance",
    ),
    offlineCollections: sumPayments(
      input.periodBookingPayments,
      (payment) => payment.method !== "online",
    ),
    onlineCollections: sumPayments(
      input.periodBookingPayments,
      (payment) => payment.method === "online",
    ),
    averageBookingValue:
      activePeriodBookings.length > 0
        ? Math.round(collectedAmount / activePeriodBookings.length)
        : 0,
  };
}

export function buildFinanceTransactions(
  payments: BookingPaymentRecord[],
  bookingsById: Map<string, AdminBookingRecord>,
): FinanceTransaction[] {
  return payments.map((payment) => {
    const booking = bookingsById.get(payment.bookingId);
    return {
      id: payment.id,
      bookingId: payment.bookingId,
      bookingReference: booking?.bookingReference ?? "—",
      customerName: booking?.customerName ?? "Unknown",
      customerPhone: booking?.customerPhone ?? "—",
      bookingDate: booking?.bookingDate ?? payment.createdAt.toISOString().slice(0, 10),
      startTime: booking?.startTime ?? "—",
      amount: payment.amount,
      method: payment.method,
      type: payment.type,
      collectedBy: payment.collectedBy,
      referenceNumber: payment.referenceNumber,
      notes: payment.notes,
      status: payment.type === "refund" ? "refunded" : "completed",
      createdAt: payment.createdAt.toISOString(),
    };
  });
}

export function buildDailyClosing(input: {
  date: string;
  payments: BookingPaymentRecord[];
  bookings: AdminBookingRecord[];
}): FinanceDailyClosing {
  const dayPayments = paymentsInRange(input.payments, input.date, input.date);
  const dayBookings = input.bookings.filter((booking) => booking.bookingDate === input.date);

  const sumByMethod = (method: BookingPaymentRecord["method"]) =>
    sumPayments(dayPayments, (payment) => payment.method === method);

  return {
    date: input.date,
    totalRevenue: sumPayments(dayPayments),
    cash: sumByMethod("cash"),
    upi: sumByMethod("upi"),
    card: sumByMethod("card"),
    razorpay: sumByMethod("online"),
    pending: dayBookings
      .filter((booking) => booking.status !== "cancelled")
      .reduce((sum, booking) => sum + booking.remainingAmount, 0),
    completedBookings: dayBookings.filter((booking) => booking.status === "completed").length,
    cancelledBookings: dayBookings.filter((booking) => booking.status === "cancelled").length,
    manualBookings: dayBookings.filter((booking) => booking.source === "manual").length,
  };
}

export function buildReconciliation(input: {
  bookings: AdminBookingRecord[];
  payments: BookingPaymentRecord[];
}): FinanceReconciliation {
  const activeBookings = input.bookings.filter((booking) => booking.status !== "cancelled");
  const expectedRevenue = activeBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
  const collectedRevenue = sumPayments(input.payments);
  const outstandingRevenue = activeBookings.reduce(
    (sum, booking) => sum + booking.remainingAmount,
    0,
  );
  const discrepancy = expectedRevenue - (collectedRevenue + outstandingRevenue);

  return {
    expectedRevenue,
    collectedRevenue,
    outstandingRevenue,
    discrepancy,
    hasDiscrepancy: Math.abs(discrepancy) > 0,
  };
}

export function buildBookingCounts(bookings: AdminBookingRecord[]): FinanceBookingCounts {
  const activeBookings = bookings.filter((booking) => booking.status !== "cancelled");
  const onlineBookings = activeBookings.filter((booking) => booking.source !== "manual");
  const manualBookings = activeBookings.filter((booking) => booking.source === "manual");

  return {
    totalBookings: bookings.length,
    activeBookings: activeBookings.length,
    completedBookings: bookings.filter((booking) => booking.status === "completed").length,
    cancelledBookings: bookings.filter((booking) => booking.status === "cancelled").length,
    onlineBookings: onlineBookings.length,
    onlineBookingsValue: onlineBookings.reduce((sum, booking) => sum + booking.totalPrice, 0),
    manualBookings: manualBookings.length,
    manualBookingsValue: manualBookings.reduce((sum, booking) => sum + booking.totalPrice, 0),
  };
}

export function buildRevenueTrend(
  payments: BookingPaymentRecord[],
  from: string,
  to: string,
): ReportSeriesPoint[] {
  return buildDailyCollectionsSeries(payments, from, to);
}

export function buildDailyCollectionsSeries(
  payments: BookingPaymentRecord[],
  from: string,
  to: string,
): ReportSeriesPoint[] {
  const dates = enumerateIsoDates(from, to);
  const totals = new Map(dates.map((date) => [date, 0]));

  for (const payment of payments) {
    const date = payment.createdAt.toISOString().slice(0, 10);
    if (!totals.has(date)) continue;
    totals.set(date, (totals.get(date) ?? 0) + paymentNetAmount(payment));
  }

  return dates.map((date) => ({
    label: shortDateLabel(date),
    value: totals.get(date) ?? 0,
  }));
}

export function buildPendingCollectionsTrend(
  bookings: AdminBookingRecord[],
  from: string,
  to: string,
): ReportSeriesPoint[] {
  return buildPendingPaymentsSeries(bookings, from, to);
}

export { buildPaymentBreakdown };
