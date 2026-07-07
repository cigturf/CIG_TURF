import type { AdminBookingRecord } from "@/features/admin/bookings/types/admin-booking.types";
import type { BookingPaymentRecord } from "@/features/admin/bookings/types/admin-booking.types";
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

export function buildReportOverview(
  bookings: AdminBookingRecord[],
  payments: BookingPaymentRecord[],
): ReportOverview {
  const active = bookings.filter((booking) => booking.status !== "cancelled");
  const completed = bookings.filter((booking) => booking.status === "completed");
  const cancelled = bookings.filter((booking) => booking.status === "cancelled");
  const manual = bookings.filter((booking) => booking.source === "manual");
  const online = bookings.filter((booking) => booking.source === "online");

  const totalRevenue = active.reduce((sum, booking) => sum + booking.totalPrice, 0);
  const advanceCollected = payments
    .filter((payment) => payment.type === "advance" || payment.type === "remaining")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const offlineCollections = payments
    .filter((payment) => payment.method !== "online")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const pendingCollections = active.reduce((sum, booking) => sum + booking.remainingAmount, 0);

  return {
    totalBookings: bookings.length,
    completedBookings: completed.length,
    cancelledBookings: cancelled.length,
    manualBookings: manual.length,
    onlineBookings: online.length,
    totalRevenue,
    advanceCollected,
    offlineCollections,
    pendingCollections,
    averageBookingValue: active.length > 0 ? Math.round(totalRevenue / active.length) : 0,
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
  bookings: AdminBookingRecord[],
  from: string,
  to: string,
): ReportSeriesPoint[] {
  const dates = enumerateIsoDates(from, to);
  const totals = new Map(dates.map((date) => [date, 0]));

  for (const booking of bookings) {
    if (booking.status === "cancelled") continue;
    totals.set(booking.bookingDate, (totals.get(booking.bookingDate) ?? 0) + booking.totalPrice);
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

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  online: "Online (Razorpay)",
  bank_transfer: "Other",
  other: "Other",
};

export function buildPaymentBreakdown(payments: BookingPaymentRecord[]): ReportPaymentBreakdown[] {
  const buckets = new Map<string, { amount: number; count: number }>();

  for (const payment of payments) {
    const label =
      payment.method === "bank_transfer" || payment.method === "other"
        ? "Other"
        : (PAYMENT_METHOD_LABELS[payment.method] ?? payment.method);
    const current = buckets.get(label) ?? { amount: 0, count: 0 };
    buckets.set(label, {
      amount: current.amount + payment.amount,
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
