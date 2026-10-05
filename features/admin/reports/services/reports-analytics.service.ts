import { resolveReportDateRange } from "@/features/admin/reports/lib/report-date-range";
import {
  buildBookingsPerDay,
  buildBookingsPerHour,
  buildCancellationTrend,
  buildDailyRevenue,
  buildOccupancySummary,
  buildPaymentBreakdown,
  buildPaymentSeriesByDay,
  buildPeakBookingTimes,
  buildPendingPaymentsSeries,
  buildPopularDays,
  buildPopularSlots,
  buildReportOverview,
  excludeCancelledBookingPayments,
  resolveSlotsPerDay,
} from "@/features/admin/reports/lib/reports-aggregation";
import {
  countBookedSlotsInRange,
  countSlotBlocksInRange,
  listBookingsByIds,
  listBookingsInRange,
  listPaymentRecordsForBookingIds,
  listPaymentRecordsInRange,
} from "@/features/admin/reports/services/reports-data.repository";
import type {
  ReportDatePreset,
  ReportsAnalyticsData,
} from "@/features/admin/reports/types/reports.types";
import { createEmptyBusinessSettings } from "@/features/business-settings/lib/defaults";
import { toPublicBusinessSettings } from "@/features/business-settings/lib/parse";
import { resolveBookingEngineConfig } from "@/features/booking/services/booking-config.service";
import { SettingsService } from "@/server/settings";

export async function getReportsAnalyticsData(
  preset: ReportDatePreset = "last_7_days",
  customFrom?: string,
  customTo?: string,
): Promise<ReportsAnalyticsData> {
  const range = resolveReportDateRange(preset, customFrom, customTo);
  const [bookings, payments, bookedSlots, slotBlocks, settings] = await Promise.all([
    listBookingsInRange(range.from, range.to),
    listPaymentRecordsInRange(range.from, range.to),
    countBookedSlotsInRange(range.from, range.to),
    countSlotBlocksInRange(range.from, range.to),
    SettingsService.getPublic(),
  ]);

  const periodBookingPayments = await listPaymentRecordsForBookingIds(
    bookings.map((booking) => booking.id),
  );

  // `payments` is scoped by payment.createdAt (for the daily/trend charts),
  // a different population from `bookings` (scoped by booking_date) — some of
  // those payments belong to bookings whose slot falls outside the range, so
  // fetch whatever's missing to correctly exclude cancelled-booking payments
  // from every chart, not just the Overview tile.
  const bookingsById = new Map(bookings.map((booking) => [booking.id, booking]));
  const missingBookingIds = [...new Set(payments.map((payment) => payment.bookingId))].filter(
    (id) => !bookingsById.has(id),
  );
  const extraBookings = await listBookingsByIds(missingBookingIds);
  const activePayments = excludeCancelledBookingPayments(
    [...bookings, ...extraBookings],
    payments,
  );

  const publicSettings =
    settings ?? toPublicBusinessSettings(createEmptyBusinessSettings());
  const config = resolveBookingEngineConfig(publicSettings);
  const slotsPerDay = resolveSlotsPerDay(config.slotDurationMinutes, config.businessHours);

  const overview = buildReportOverview(bookings, periodBookingPayments);
  const occupancy = buildOccupancySummary({
    from: range.from,
    to: range.to,
    slotsPerDay,
    bookedSlots,
    blockedSlots: slotBlocks.blocked,
    maintenanceSlots: slotBlocks.maintenance,
    bookings,
  });

  return {
    range,
    overview: { ...overview, occupancyRate: occupancy.occupancyPercent },
    bookingsPerDay: buildBookingsPerDay(bookings, range.from, range.to),
    bookingsPerHour: buildBookingsPerHour(bookings),
    peakBookingTimes: buildPeakBookingTimes(bookings),
    popularSlots: buildPopularSlots(bookings),
    popularDays: buildPopularDays(bookings),
    cancellationTrend: buildCancellationTrend(bookings, range.from, range.to),
    dailyRevenue: buildDailyRevenue(activePayments, range.from, range.to),
    revenueTrend: buildDailyRevenue(activePayments, range.from, range.to),
    advancePayments: buildPaymentSeriesByDay(
      activePayments,
      range.from,
      range.to,
      (payment) => payment.type === "advance",
    ),
    offlinePayments: buildPaymentSeriesByDay(
      activePayments,
      range.from,
      range.to,
      (payment) => payment.method !== "online",
    ),
    pendingPayments: buildPendingPaymentsSeries(bookings, range.from, range.to),
    paymentBreakdown: buildPaymentBreakdown(activePayments),
    occupancy,
    generatedAt: new Date().toISOString(),
  };
}
