import {
  buildDailyClosing,
  buildDailyCollectionsSeries,
  buildFinanceOverview,
  buildFinanceTransactions,
  buildPaymentBreakdown,
  buildPendingCollectionsTrend,
  buildReconciliation,
} from "@/features/admin/finance/lib/finance-aggregation";
import {
  listAllPaymentRecordsInRange,
  listBookingsInRange,
  listPendingCollectionBookings,
} from "@/features/admin/finance/services/finance-data.repository";
import type { FinanceDashboardData } from "@/features/admin/finance/types/finance.types";
import { resolveReportDateRange } from "@/features/admin/reports/lib/report-date-range";
import type { ReportDatePreset } from "@/features/admin/reports/types/reports.types";
import { addDaysToIsoDate, getTodayIso } from "@/features/booking/utils/time";
import type { AdminBookingRecord } from "@/features/admin/bookings/types/admin-booking.types";

export async function getFinanceDashboardData(
  preset: ReportDatePreset = "last_7_days",
  customFrom?: string,
  customTo?: string,
  closingDate?: string,
): Promise<FinanceDashboardData> {
  const range = resolveReportDateRange(preset, customFrom, customTo);
  const today = getTodayIso();
  const overviewFrom = addDaysToIsoDate(today, -29);

  const [periodPayments, overviewPayments, periodBookings, pendingBookings] = await Promise.all([
    listAllPaymentRecordsInRange(range.from, range.to),
    listAllPaymentRecordsInRange(overviewFrom, today),
    listBookingsInRange(range.from, range.to),
    listPendingCollectionBookings(),
  ]);

  const pendingForOverview = pendingBookings.map(
    (booking) =>
      ({
        remainingAmount: booking.outstanding,
      }) as AdminBookingRecord,
  );

  const bookingsById = new Map(periodBookings.map((booking) => [booking.id, booking]));
  const closingDay = closingDate ?? (preset === "today" ? today : range.to);

  return {
    range,
    overview: buildFinanceOverview({
      allPayments: overviewPayments,
      periodPayments,
      pendingBookings: pendingForOverview,
      periodBookings,
      today,
    }),
    paymentBreakdown: buildPaymentBreakdown(periodPayments),
    pendingBookings,
    transactions: buildFinanceTransactions(periodPayments, bookingsById),
    dailyClosing: buildDailyClosing({
      date: closingDay,
      payments: periodPayments,
      bookings: periodBookings,
    }),
    reconciliation: buildReconciliation({
      bookings: periodBookings,
      payments: periodPayments,
    }),
    revenueTrend: buildDailyCollectionsSeries(periodPayments, range.from, range.to),
    dailyCollections: buildDailyCollectionsSeries(periodPayments, range.from, range.to),
    pendingCollectionsTrend: buildPendingCollectionsTrend(periodBookings, range.from, range.to),
    generatedAt: new Date().toISOString(),
  };
}
