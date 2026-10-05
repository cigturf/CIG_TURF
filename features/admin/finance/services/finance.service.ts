import {
  buildBookingCounts,
  buildDailyClosing,
  buildDailyCollectionsSeries,
  buildFinanceBookingDetails,
  buildFinanceOverview,
  buildFinanceTransactions,
  buildPaymentBreakdown,
  buildPendingCollectionsTrend,
  buildReconciliation,
} from "@/features/admin/finance/lib/finance-aggregation";
import {
  listAllPaymentRecordsInRange,
  listBookingsByIds,
  listBookingsInRange,
  listPaymentRecordsForBookingIds,
  listPendingCollectionBookings,
} from "@/features/admin/finance/services/finance-data.repository";
import type { FinanceDashboardData } from "@/features/admin/finance/types/finance.types";
import { resolveReportDateRange } from "@/features/admin/reports/lib/report-date-range";
import { excludePendingReviewPayments } from "@/features/admin/reports/lib/reports-aggregation";
import type { ReportDatePreset } from "@/features/admin/reports/types/reports.types";
import { DEFAULT_VENUE_TIMEZONE, getTodayIsoInTimezone } from "@/features/booking/utils/venue-timezone";

export async function getFinanceDashboardData(
  preset: ReportDatePreset = "last_7_days",
  customFrom?: string,
  customTo?: string,
  closingDate?: string,
): Promise<FinanceDashboardData> {
  const range = resolveReportDateRange(preset, customFrom, customTo);
  const today = getTodayIsoInTimezone(new Date(), DEFAULT_VENUE_TIMEZONE);

  const [periodPayments, periodBookings, pendingBookings] = await Promise.all([
    listAllPaymentRecordsInRange(range.from, range.to),
    listBookingsInRange(range.from, range.to),
    listPendingCollectionBookings(),
  ]);

  const periodBookingPayments = await listPaymentRecordsForBookingIds(
    periodBookings.map((booking) => booking.id),
  );

  const bookingsById = new Map(periodBookings.map((booking) => [booking.id, booking]));

  // periodPayments is scoped by payment.createdAt (what actually moved during
  // this period, for the transaction ledger / daily closing / trend charts) —
  // a different population from periodBookings (scoped by booking_date). Some
  // of those payments belong to bookings whose slot falls outside the range,
  // so bookingsById above won't have them; fetch whatever's missing so every
  // payment can show the real booking reference and customer instead of
  // "Unknown".
  const missingBookingIds = [...new Set(periodPayments.map((payment) => payment.bookingId))].filter(
    (id) => !bookingsById.has(id),
  );
  const extraBookings = await listBookingsByIds(missingBookingIds);
  for (const booking of extraBookings) {
    bookingsById.set(booking.id, booking);
  }

  const closingDay = closingDate ?? (preset === "today" ? today : range.to);

  // Booking Details and Transaction History are factual per-booking/per-
  // transaction records, so they show every payment as it actually happened.
  // Revenue aggregates (overview, reconciliation, breakdown, trend, closing)
  // exclude whatever's on manual hold (see excludePendingReviewPayments).
  const activePeriodBookingPayments = excludePendingReviewPayments(periodBookingPayments);
  const activePeriodPayments = excludePendingReviewPayments(periodPayments);

  return {
    range,
    overview: buildFinanceOverview({
      periodBookingPayments: activePeriodBookingPayments,
      periodBookings,
    }),
    paymentBreakdown: buildPaymentBreakdown(activePeriodPayments),
    pendingBookings,
    transactions: buildFinanceTransactions(periodPayments, bookingsById),
    dailyClosing: buildDailyClosing({
      date: closingDay,
      payments: activePeriodPayments,
      bookings: periodBookings,
    }),
    reconciliation: buildReconciliation({
      bookings: periodBookings,
      payments: activePeriodBookingPayments,
    }),
    bookingCounts: buildBookingCounts(periodBookings),
    bookingDetails: buildFinanceBookingDetails(periodBookings, periodBookingPayments),
    revenueTrend: buildDailyCollectionsSeries(activePeriodPayments, range.from, range.to),
    dailyCollections: buildDailyCollectionsSeries(activePeriodPayments, range.from, range.to),
    pendingCollectionsTrend: buildPendingCollectionsTrend(periodBookings, range.from, range.to),
    generatedAt: new Date().toISOString(),
  };
}
