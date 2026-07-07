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
  resolveSlotsPerDay,
} from "@/features/admin/reports/lib/reports-aggregation";
import {
  countBookedSlotsInRange,
  countSlotBlocksInRange,
  listBookingsInRange,
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

  const publicSettings =
    settings ?? toPublicBusinessSettings(createEmptyBusinessSettings());
  const config = resolveBookingEngineConfig(publicSettings);
  const slotsPerDay = resolveSlotsPerDay(config.slotDurationMinutes, config.businessHours);

  const overview = buildReportOverview(bookings, payments);
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
    dailyRevenue: buildDailyRevenue(bookings, range.from, range.to),
    revenueTrend: buildDailyRevenue(bookings, range.from, range.to),
    advancePayments: buildPaymentSeriesByDay(
      payments,
      range.from,
      range.to,
      (payment) => payment.type === "advance",
    ),
    offlinePayments: buildPaymentSeriesByDay(
      payments,
      range.from,
      range.to,
      (payment) => payment.method !== "online",
    ),
    pendingPayments: buildPendingPaymentsSeries(bookings, range.from, range.to),
    paymentBreakdown: buildPaymentBreakdown(payments),
    occupancy,
    generatedAt: new Date().toISOString(),
  };
}
