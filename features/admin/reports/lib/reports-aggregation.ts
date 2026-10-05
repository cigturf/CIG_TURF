import type { AdminBookingRecord } from "@/features/admin/bookings/types/admin-booking.types";
import type { BookingPaymentRecord } from "@/features/admin/bookings/types/admin-booking.types";
import { isGenuineRazorpayPayment } from "@/features/admin/bookings/lib/booking-utils";
import { enumerateIsoDates } from "@/features/admin/reports/lib/report-date-range";
import type {
  ReportOccupancy,
  ReportOverview,
  ReportPaymentBreakdown,
  ReportSeriesPoint,
} from "@/features/admin/reports/types/reports.types";
import { countSlotsInWindow } from "@/features/booking/utils/time";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function parseSlotStartMinute(slotId: string): number | null {
  const separator = slotId.lastIndexOf("-");
  if (separator === -1) return null;
  const minute = Number(slotId.slice(separator + 1));
  return Number.isFinite(minute) ? minute : null;
}

function bookingHour(booking: AdminBookingRecord): number {
  for (const slotId of booking.selectedSlots) {
    const minute = parseSlotStartMinute(slotId);
    if (minute !== null) return Math.floor(minute / 60);
  }

  const match = booking.startTime.match(/(\d{1,2}):(\d{2})/);
  if (match) return Number(match[1]);
  return 0;
}

function formatHourLabel(hour: number): string {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return date.toLocaleTimeString("en-IN", { hour: "numeric", hour12: true });
}

function shortDateLabel(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function incrementMap(map: Map<string, number>, key: string, amount = 1) {
  map.set(key, (map.get(key) ?? 0) + amount);
}

function toSeries(map: Map<string, number>, sort?: (a: string, b: string) => number): ReportSeriesPoint[] {
  const entries = [...map.entries()];
  if (sort) entries.sort(([a], [b]) => sort(a, b));
  return entries.map(([label, value]) => ({ label, value }));
}

function topSeries(map: Map<string, number>, limit = 8): ReportSeriesPoint[] {
  return [...map.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }));
}

function paymentNetAmount(payment: BookingPaymentRecord): number {
  return payment.type === "refund" ? -payment.amount : payment.amount;
}

function sumCollectedPayments(
  payments: BookingPaymentRecord[],
  predicate?: (payment: BookingPaymentRecord) => boolean,
): number {
  return payments
    .filter((payment) => (predicate ? predicate(payment) : true))
    .reduce((sum, payment) => sum + paymentNetAmount(payment), 0);
}

/**
 * Temporary, manual hold list — bookings whose collected-but-unrefunded
 * money the venue owner hasn't yet decided whether to keep as revenue or
 * refund. Excluded from every revenue total until that's settled. Delete an
 * entry here once the owner confirms the outcome either way.
 */
const PENDING_REVIEW_BOOKING_IDS = new Set<string>([
  // CIG-20260929-0002 — Rajat Aggarwal, cancelled, ₹200 Razorpay advance not refunded; owner hasn't decided yet (2026-10-06).
  "ab49cb40-72b5-4648-9ea7-47f530eb23d6",
]);

export function excludePendingReviewPayments(
  payments: BookingPaymentRecord[],
): BookingPaymentRecord[] {
  return payments.filter((payment) => !PENDING_REVIEW_BOOKING_IDS.has(payment.bookingId));
}

/**
 * A cancelled booking's money only drops out of revenue to the extent it was
 * actually refunded. If the venue kept it (no refund row for that booking),
 * it's real revenue and must still be counted — `paymentNetAmount` already
 * subtracts a logged refund from the same booking's total, so summing every
 * payment through unfiltered gives the right net figure either way.
 */
export function sumCancelledKeptAmount(
  bookings: AdminBookingRecord[],
  payments: BookingPaymentRecord[],
): number {
  const cancelledBookingIds = new Set(
    bookings.filter((booking) => booking.status === "cancelled").map((booking) => booking.id),
  );
  return payments
    .filter((payment) => cancelledBookingIds.has(payment.bookingId))
    .reduce((sum, payment) => sum + paymentNetAmount(payment), 0);
}

/**
 * "Online Collections" must mean money that actually moved through Razorpay —
 * an admin choosing "online" as the method while recording a manual advance,
 * a collected balance, or an Edit Amounts entry never touched Razorpay, so it
 * belongs in Offline Collections, same as cash/UPI/card collected at the
 * counter. A refund is bucketed by its own `method` regardless of who
 * recorded it, so it nets against the same bucket as the advance it reverses.
 */
export function isOnlineCollectionPayment(payment: BookingPaymentRecord): boolean {
  if (payment.method !== "online") return false;
  if (payment.type === "refund") return true;
  return isGenuineRazorpayPayment(payment);
}

/**
 * `payments` must be every payment tied to a booking in `bookings` (regardless
 * of when the payment itself was made) — not payments merely dated inside the
 * selected range. Advances are routinely paid before the booking date, so
 * filtering payments by their own date instead of their booking's date would
 * split a booking's money from its total and produce a false pending/collected
 * split for the period.
 */
export function buildReportOverview(
  bookings: AdminBookingRecord[],
  payments: BookingPaymentRecord[],
): ReportOverview {
  const active = bookings.filter((booking) => booking.status !== "cancelled");
  const completed = bookings.filter((booking) => booking.status === "completed");
  const cancelled = bookings.filter((booking) => booking.status === "cancelled");
  const manual = active.filter((booking) => booking.source === "manual");
  const online = active.filter((booking) => booking.source !== "manual");

  const totalAmount = active.reduce((sum, booking) => sum + booking.totalPrice, 0);
  const cancelledAmount = cancelled.reduce((sum, booking) => sum + booking.totalPrice, 0);
  const totalRevenue = sumCollectedPayments(payments);
  const advanceCollected = sumCollectedPayments(
    payments,
    (payment) => payment.type === "advance",
  );
  const offlineCollections = sumCollectedPayments(
    payments,
    (payment) => !isOnlineCollectionPayment(payment),
  );
  const onlineCollections = sumCollectedPayments(payments, isOnlineCollectionPayment);
  const pendingCollections = active.reduce((sum, booking) => sum + booking.remainingAmount, 0);

  return {
    totalBookings: bookings.length,
    activeBookings: active.length,
    completedBookings: completed.length,
    cancelledBookings: cancelled.length,
    manualBookings: manual.length,
    onlineBookings: online.length,
    grossBookingValue: totalAmount + cancelledAmount,
    cancelledAmount,
    totalAmount,
    totalRevenue,
    advanceCollected,
    offlineCollections,
    onlineCollections,
    pendingCollections,
    averageBookingValue:
      active.length > 0 ? Math.round(totalRevenue / active.length) : 0,
    occupancyRate: 0,
  };
}

export function buildBookingsPerDay(
  bookings: AdminBookingRecord[],
  from: string,
  to: string,
): ReportSeriesPoint[] {
  const dates = enumerateIsoDates(from, to);
  const counts = new Map(dates.map((date) => [date, 0]));

  for (const booking of bookings) {
    if (booking.status === "cancelled") continue;
    incrementMap(counts, booking.bookingDate);
  }

  return dates.map((date) => ({
    label: shortDateLabel(date),
    value: counts.get(date) ?? 0,
  }));
}

export function buildBookingsPerHour(bookings: AdminBookingRecord[]): ReportSeriesPoint[] {
  const hours = new Map<string, number>();
  for (let hour = 0; hour < 24; hour += 1) {
    hours.set(formatHourLabel(hour), 0);
  }

  for (const booking of bookings) {
    if (booking.status === "cancelled") continue;
    const label = formatHourLabel(bookingHour(booking));
    incrementMap(hours, label);
  }

  return toSeries(hours);
}

export function buildPeakBookingTimes(bookings: AdminBookingRecord[]): ReportSeriesPoint[] {
  const hours = new Map<string, number>();
  for (const booking of bookings) {
    if (booking.status === "cancelled") continue;
    incrementMap(hours, formatHourLabel(bookingHour(booking)));
  }
  return topSeries(hours, 6);
}

export function buildPopularSlots(bookings: AdminBookingRecord[]): ReportSeriesPoint[] {
  const slots = new Map<string, number>();
  for (const booking of bookings) {
    if (booking.status === "cancelled") continue;
    incrementMap(slots, booking.startTime);
  }
  return topSeries(slots, 8);
}

export function buildPopularDays(bookings: AdminBookingRecord[]): ReportSeriesPoint[] {
  const days = new Map(DAY_LABELS.map((label) => [label, 0]));

  for (const booking of bookings) {
    if (booking.status === "cancelled") continue;
    const day = new Date(`${booking.bookingDate}T12:00:00`).getDay();
    const label = DAY_LABELS[day];
    incrementMap(days, label);
  }

  return DAY_LABELS.map((label) => ({ label, value: days.get(label) ?? 0 }));
}

export function buildCancellationTrend(
  bookings: AdminBookingRecord[],
  from: string,
  to: string,
): ReportSeriesPoint[] {
  const dates = enumerateIsoDates(from, to);
  const counts = new Map(dates.map((date) => [date, 0]));

  for (const booking of bookings) {
    if (booking.status !== "cancelled") continue;
    incrementMap(counts, booking.bookingDate);
  }

  return dates.map((date) => ({
    label: shortDateLabel(date),
    value: counts.get(date) ?? 0,
  }));
}

export function buildDailyRevenue(
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

export function buildPaymentSeriesByDay(
  payments: BookingPaymentRecord[],
  from: string,
  to: string,
  predicate: (payment: BookingPaymentRecord) => boolean,
): ReportSeriesPoint[] {
  const dates = enumerateIsoDates(from, to);
  const totals = new Map(dates.map((date) => [date, 0]));

  for (const payment of payments) {
    if (!predicate(payment)) continue;
    const date = payment.createdAt.toISOString().slice(0, 10);
    if (!totals.has(date)) continue;
    totals.set(date, (totals.get(date) ?? 0) + payment.amount);
  }

  return dates.map((date) => ({
    label: shortDateLabel(date),
    value: totals.get(date) ?? 0,
  }));
}

export function buildPendingPaymentsSeries(
  bookings: AdminBookingRecord[],
  from: string,
  to: string,
): ReportSeriesPoint[] {
  const dates = enumerateIsoDates(from, to);
  const totals = new Map(dates.map((date) => [date, 0]));

  for (const booking of bookings) {
    if (booking.status === "cancelled" || booking.remainingAmount <= 0) continue;
    if (!totals.has(booking.bookingDate)) continue;
    totals.set(
      booking.bookingDate,
      (totals.get(booking.bookingDate) ?? 0) + booking.remainingAmount,
    );
  }

  return dates.map((date) => ({
    label: shortDateLabel(date),
    value: totals.get(date) ?? 0,
  }));
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  online: "Online",
  bank_transfer: "Other",
  other: "Other",
};

/**
 * "Razorpay" is reserved for a payment the online checkout captured
 * automatically (features/admin/bookings/lib/booking-utils.ts's
 * isGenuineRazorpayPayment) — an admin recording a payment as "online"/UPI at
 * the counter (a manual booking's advance, a collected remaining balance, an
 * "Edit Amounts" entry) never actually went through Razorpay, so it must not
 * be labeled as if it did.
 */
export function resolvePaymentMethodLabel(payment: BookingPaymentRecord): string {
  if (payment.method === "bank_transfer" || payment.method === "other") return "Other";
  if (payment.method === "online") {
    return isGenuineRazorpayPayment(payment) ? "Razorpay" : "Online";
  }
  return PAYMENT_METHOD_LABELS[payment.method] ?? payment.method;
}

/**
 * Nets refunds against their own method bucket. A cancelled booking's
 * payments are included like any other — if refunded, the refund row cancels
 * the original advance out; if not, the kept amount still counts.
 */
export function buildPaymentBreakdown(payments: BookingPaymentRecord[]): ReportPaymentBreakdown[] {
  const buckets = new Map<string, { amount: number; count: number }>();

  for (const payment of payments) {
    const label = resolvePaymentMethodLabel(payment);
    const current = buckets.get(label) ?? { amount: 0, count: 0 };
    buckets.set(label, {
      amount: current.amount + paymentNetAmount(payment),
      count: current.count + 1,
    });
  }

  const total = [...buckets.values()].reduce((sum, item) => sum + item.amount, 0);

  return [...buckets.entries()]
    .map(([method, data]) => ({
      method,
      amount: data.amount,
      count: data.count,
      percentage: total > 0 ? Math.round((data.amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function buildOccupancyHeatmap(bookings: AdminBookingRecord[]): ReportSeriesPoint[] {
  const hours = new Map<string, number>();
  for (let hour = 0; hour < 24; hour += 1) {
    hours.set(formatHourLabel(hour), 0);
  }

  for (const booking of bookings) {
    if (booking.status === "cancelled") continue;
    for (const slotId of booking.selectedSlots) {
      const minute = parseSlotStartMinute(slotId);
      if (minute === null) continue;
      incrementMap(hours, formatHourLabel(Math.floor(minute / 60)));
    }
  }

  return toSeries(hours);
}

export function buildOccupancySummary(input: {
  from: string;
  to: string;
  slotsPerDay: number;
  bookedSlots: number;
  blockedSlots: number;
  maintenanceSlots: number;
  bookings: AdminBookingRecord[];
}): ReportOccupancy {
  const days = enumerateIsoDates(input.from, input.to).length;
  const totalCapacity = input.slotsPerDay * days;
  const unavailable = input.blockedSlots + input.maintenanceSlots;
  const availableSlots = Math.max(totalCapacity - unavailable - input.bookedSlots, 0);
  const occupancyPercent =
    totalCapacity - unavailable > 0
      ? Math.round((input.bookedSlots / (totalCapacity - unavailable)) * 100)
      : 0;

  return {
    availableSlots,
    bookedSlots: input.bookedSlots,
    blockedSlots: input.blockedSlots,
    maintenanceSlots: input.maintenanceSlots,
    occupancyPercent,
    heatmap: buildOccupancyHeatmap(input.bookings),
  };
}

export function resolveSlotsPerDay(
  slotDurationMinutes: number,
  businessHours: { openTime: string; closeTime: string },
): number {
  return countSlotsInWindow(slotDurationMinutes, businessHours);
}
