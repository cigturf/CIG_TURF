"use client";

import { Download, FileSpreadsheet, FileText, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { BookingDetailDrawer } from "@/features/admin/bookings/components/booking-detail-drawer";
import { CancelBookingDialog } from "@/features/admin/bookings/components/cancel-booking-dialog";
import { CollectPaymentDialog } from "@/features/admin/bookings/components/collect-payment-dialog";
import { CompleteBookingDialog } from "@/features/admin/bookings/components/complete-booking-dialog";
import type {
  AdminBookingDetail,
  OfflinePaymentMethod,
} from "@/features/admin/bookings/types/admin-booking.types";
import { FinanceBookingDetailsTable } from "@/features/admin/finance/components/finance-booking-details-table";
import {
  FinanceDailyClosingCard,
  FinanceReconciliationCard,
} from "@/features/admin/finance/components/finance-closing-reconciliation";
import { FinancePendingTable } from "@/features/admin/finance/components/finance-pending-table";
import { FinanceTransactionDrawer } from "@/features/admin/finance/components/finance-transaction-drawer";
import { FinanceTransactionsTable } from "@/features/admin/finance/components/finance-transactions-table";
import type {
  FinanceDashboardData,
  FinancePendingBooking,
  FinanceTransaction,
} from "@/features/admin/finance/types/finance.types";
import { ReportBarChart } from "@/features/admin/reports/components/report-bar-chart";
import { ReportHeatmap } from "@/features/admin/reports/components/report-heatmap";
import { ReportLineChart } from "@/features/admin/reports/components/report-line-chart";
import { ReportPieChart } from "@/features/admin/reports/components/report-pie-chart";
import { ReportsDateFilter } from "@/features/admin/reports/components/reports-date-filter";
import {
  ReportsOverviewGrid,
  type BookingCardFilter,
} from "@/features/admin/reports/components/reports-overview-grid";
import {
  ReportsSection,
  SwipeableChartItem,
  SwipeableCharts,
} from "@/features/admin/reports/components/reports-section";
import type { ReportDatePreset, ReportsAnalyticsData } from "@/features/admin/reports/types/reports.types";
import { AnalyticsCard, Button, Heading, StatsCard, Text } from "@/components/design-system";

type AdminReportsFinanceViewProps = {
  reportsData: ReportsAnalyticsData;
  financeData: FinanceDashboardData;
  onRangeChange: (input: {
    preset: ReportDatePreset;
    from?: string;
    to?: string;
  }) => Promise<void>;
  onRefresh: () => Promise<void>;
  isRefreshing?: boolean;
};

function buildExportUrl(data: FinanceDashboardData, format: "csv" | "xlsx" | "pdf") {
  const params = new URLSearchParams({
    preset: data.range.preset,
    format,
  });
  if (data.range.preset === "custom") {
    params.set("from", data.range.from);
    params.set("to", data.range.to);
  }
  params.set("closingDate", data.dailyClosing.date);
  return `/api/admin/reports-finance/export?${params.toString()}`;
}

export function AdminReportsFinanceView({
  reportsData,
  financeData,
  onRangeChange,
  onRefresh,
  isRefreshing,
}: AdminReportsFinanceViewProps) {
  const [preset, setPreset] = useState<ReportDatePreset>(financeData.range.preset);
  const [customFrom, setCustomFrom] = useState(financeData.range.from);
  const [customTo, setCustomTo] = useState(financeData.range.to);
  const [selectedTransaction, setSelectedTransaction] = useState<FinanceTransaction | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collectBooking, setCollectBooking] = useState<FinancePendingBooking | null>(null);
  const [collectOpen, setCollectOpen] = useState(false);

  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<AdminBookingDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [bookingDetailOpen, setBookingDetailOpen] = useState(false);
  const [detailCancelOpen, setDetailCancelOpen] = useState(false);
  const [detailCollectOpen, setDetailCollectOpen] = useState(false);
  const [detailCompleteOpen, setDetailCompleteOpen] = useState(false);

  const [bookingFilter, setBookingFilter] = useState<BookingCardFilter>("all");
  const bookingDetailsSectionRef = useRef<HTMLDivElement>(null);

  const filteredBookingDetails = useMemo(() => {
    switch (bookingFilter) {
      case "active":
        return financeData.bookingDetails.filter((booking) => booking.status !== "cancelled");
      case "completed":
        return financeData.bookingDetails.filter((booking) => booking.status === "completed");
      case "cancelled":
        return financeData.bookingDetails.filter((booking) => booking.status === "cancelled");
      case "manual":
        return financeData.bookingDetails.filter(
          (booking) => booking.source === "manual" && booking.status !== "cancelled",
        );
      case "online":
        return financeData.bookingDetails.filter(
          (booking) => booking.source !== "manual" && booking.status !== "cancelled",
        );
      default:
        return financeData.bookingDetails;
    }
  }, [financeData.bookingDetails, bookingFilter]);

  const BOOKING_FILTER_LABELS: Record<BookingCardFilter, string> = {
    all: "All bookings",
    active: "Active bookings",
    completed: "Completed bookings",
    cancelled: "Cancelled bookings",
    manual: "Manual bookings",
    online: "Online bookings",
  };

  const handleFilterSelect = useCallback((filter: BookingCardFilter) => {
    setBookingFilter(filter);
    bookingDetailsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    setPreset(financeData.range.preset);
    setCustomFrom(financeData.range.from);
    setCustomTo(financeData.range.to);
  }, [financeData.range.from, financeData.range.preset, financeData.range.to, financeData.generatedAt]);

  const applyRange = useCallback(
    async (nextPreset: ReportDatePreset, from = customFrom, to = customTo) => {
      setPreset(nextPreset);
      await onRangeChange({
        preset: nextPreset,
        from: nextPreset === "custom" ? from : undefined,
        to: nextPreset === "custom" ? to : undefined,
      });
    },
    [customFrom, customTo, onRangeChange],
  );

  const paymentMethodSeries = useMemo(
    () =>
      financeData.paymentBreakdown.map((item) => ({
        label: item.method,
        value: item.amount,
      })),
    [financeData.paymentBreakdown],
  );

  const exportActions = (
    <div className="flex flex-wrap gap-2">
      <Button asChild size="sm" variant="outline">
        <a href={buildExportUrl(financeData, "csv")}>
          <Download className="mr-2 size-4" />
          CSV
        </a>
      </Button>
      <Button asChild size="sm" variant="outline">
        <a href={buildExportUrl(financeData, "xlsx")}>
          <FileSpreadsheet className="mr-2 size-4" />
          Excel
        </a>
      </Button>
      <Button asChild size="sm" variant="outline">
        <a href={buildExportUrl(financeData, "pdf")} target="_blank" rel="noreferrer">
          <FileText className="mr-2 size-4" />
          PDF
        </a>
      </Button>
    </div>
  );

  const handleCollect = async (payload: {
    amount: number;
    method: OfflinePaymentMethod;
    referenceNumber?: string;
    notes?: string;
  }) => {
    if (!collectBooking) return;

    const response = await fetch(`/api/admin/bookings/${collectBooking.id}/collect-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      toast.error(body?.error ?? "Failed to collect payment");
      return;
    }

    toast.success("Payment collected");
    setCollectOpen(false);
    setCollectBooking(null);
    await onRefresh();
  };

  const openBookingDetail = useCallback(async (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setBookingDetailOpen(true);
    setIsDetailLoading(true);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load booking");
      const detail = (await response.json()) as AdminBookingDetail;
      setSelectedDetail(detail);
    } catch {
      setSelectedDetail(null);
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  const cancelDetailBooking = async (payload: { reason: string; initiateRefund: boolean }) => {
    if (!selectedBookingId) return;
    const response = await fetch(`/api/admin/bookings/${selectedBookingId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      toast.error(body?.error ?? "Failed to cancel booking");
      return;
    }
    toast.success(
      payload.initiateRefund ? "Booking cancelled and refund initiated" : "Booking cancelled",
    );
    await openBookingDetail(selectedBookingId);
    await onRefresh();
  };

  const collectDetailPayment = async (payload: {
    amount: number;
    method: OfflinePaymentMethod;
    referenceNumber?: string;
    notes?: string;
  }) => {
    if (!selectedBookingId) return;
    const response = await fetch(`/api/admin/bookings/${selectedBookingId}/collect-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      toast.error(body?.error ?? "Failed to collect payment");
      return;
    }
    toast.success("Payment collected");
    setDetailCollectOpen(false);
    await openBookingDetail(selectedBookingId);
    await onRefresh();
  };

  const completeDetailBooking = async (payload: {
    overrideOutstanding?: boolean;
    overrideReason?: string;
  }) => {
    if (!selectedBookingId) return;
    const response = await fetch(`/api/admin/bookings/${selectedBookingId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      toast.error(body?.error ?? "Failed to complete booking");
      return;
    }
    toast.success("Booking completed");
    setDetailCompleteOpen(false);
    await openBookingDetail(selectedBookingId);
    await onRefresh();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Heading level="h3" className="mb-1">
            Reports & Finances
          </Heading>
          <Text className="text-muted-foreground">
            {financeData.range.label} · {financeData.range.from} to {financeData.range.to}
            {isRefreshing ? " · Updating…" : ""}
          </Text>
        </div>
        {exportActions}
      </div>

      <ReportsDateFilter
        preset={preset}
        customFrom={customFrom}
        customTo={customTo}
        onPresetChange={(next) => void applyRange(next)}
        onCustomFromChange={(value) => {
          setCustomFrom(value);
          if (preset === "custom") void applyRange("custom", value, customTo);
        }}
        onCustomToChange={(value) => {
          setCustomTo(value);
          if (preset === "custom") void applyRange("custom", customFrom, value);
        }}
      />

      <ReportsOverviewGrid
        overview={reportsData.overview}
        activeFilter={bookingFilter}
        onFilterSelect={handleFilterSelect}
      />

      <FinanceReconciliationCard reconciliation={financeData.reconciliation} />

      <ReportsSection title="Revenue & Collections" description="Trends across the selected period">
        <SwipeableCharts>
          <SwipeableChartItem>
            <AnalyticsCard title="Revenue Trend" description="Net collections by day (cancelled bookings excluded)">
              <ReportLineChart data={financeData.revenueTrend} valueFormat="currency" />
            </AnalyticsCard>
          </SwipeableChartItem>
          <SwipeableChartItem>
            <AnalyticsCard title="Bookings Per Day" description="Daily booking volume (by slot date)">
              <ReportBarChart data={reportsData.bookingsPerDay} accentClassName="bg-chart-2" />
            </AnalyticsCard>
          </SwipeableChartItem>
          <SwipeableChartItem>
            <AnalyticsCard title="Payment Method Distribution" description="Share of collected revenue">
              <ReportPieChart data={financeData.paymentBreakdown} />
            </AnalyticsCard>
          </SwipeableChartItem>
          <SwipeableChartItem>
            <AnalyticsCard title="Pending Collections Trend" description="Outstanding by booking date">
              <ReportLineChart data={financeData.pendingCollectionsTrend} valueFormat="currency" />
            </AnalyticsCard>
          </SwipeableChartItem>
        </SwipeableCharts>
      </ReportsSection>

      <ReportsSection title="Payment Breakdown" description="Amount, share, and transaction count by method">
        <AnalyticsCard title="Collections by Method">
          <ReportPieChart data={financeData.paymentBreakdown} />
          <div className="mt-6">
            <ReportBarChart data={paymentMethodSeries} valueFormat="currency" accentClassName="bg-chart-2" />
          </div>
        </AnalyticsCard>
      </ReportsSection>

      <ReportsSection title="Booking Analytics" description="When and how customers book">
        <SwipeableCharts>
          <SwipeableChartItem>
            <AnalyticsCard title="Bookings Per Hour" description="Hourly distribution">
              <ReportBarChart data={reportsData.bookingsPerHour} accentClassName="bg-chart-2" />
            </AnalyticsCard>
          </SwipeableChartItem>
          <SwipeableChartItem>
            <AnalyticsCard title="Peak Booking Times" description="Busiest hours">
              <ReportBarChart data={reportsData.peakBookingTimes} accentClassName="bg-chart-3" />
            </AnalyticsCard>
          </SwipeableChartItem>
          <SwipeableChartItem>
            <AnalyticsCard title="Popular Time Slots" description="Most booked start times">
              <ReportBarChart data={reportsData.popularSlots} accentClassName="bg-chart-4" />
            </AnalyticsCard>
          </SwipeableChartItem>
          <SwipeableChartItem>
            <AnalyticsCard title="Popular Days" description="Day-of-week preference">
              <ReportBarChart data={reportsData.popularDays} accentClassName="bg-chart-5" />
            </AnalyticsCard>
          </SwipeableChartItem>
        </SwipeableCharts>
        <AnalyticsCard title="Cancellation Trend" description="Daily cancellations">
          <ReportLineChart data={reportsData.cancellationTrend} />
        </AnalyticsCard>
      </ReportsSection>

      <ReportsSection title="Occupancy Analytics" description="Slot utilization across the period">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard label="Available Slots" value={String(reportsData.occupancy.availableSlots)} />
          <StatsCard label="Booked Slots" value={String(reportsData.occupancy.bookedSlots)} />
          <StatsCard label="Blocked Slots" value={String(reportsData.occupancy.blockedSlots)} />
          <StatsCard label="Maintenance" value={String(reportsData.occupancy.maintenanceSlots)} />
        </div>
        <AnalyticsCard
          title="Occupancy Rate"
          description={`${reportsData.occupancy.occupancyPercent}% of sellable inventory booked`}
        >
          <div className="bg-muted/40 mb-4 h-3 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(reportsData.occupancy.occupancyPercent, 100)}%` }}
            />
          </div>
          <p className="text-2xl font-semibold">{reportsData.occupancy.occupancyPercent}%</p>
        </AnalyticsCard>
        <AnalyticsCard title="Busiest Hours Heatmap" description="Slot bookings by hour">
          <ReportHeatmap data={reportsData.occupancy.heatmap} />
        </AnalyticsCard>
      </ReportsSection>

      <FinanceDailyClosingCard closing={financeData.dailyClosing} />

      <div ref={bookingDetailsSectionRef}>
        <ReportsSection
          title="Booking Details"
          description="Every booking in the selected period — customer, slot, how the advance was paid, and how the balance was (or wasn't) collected"
        >
          {bookingFilter !== "all" ? (
            <button
              type="button"
              onClick={() => setBookingFilter("all")}
              className="border-primary/30 bg-primary/10 text-primary mb-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium"
            >
              {BOOKING_FILTER_LABELS[bookingFilter]} ({filteredBookingDetails.length})
              <X className="size-3.5" />
            </button>
          ) : null}
          <FinanceBookingDetailsTable
            bookings={filteredBookingDetails}
            onSelect={(bookingId) => void openBookingDetail(bookingId)}
          />
        </ReportsSection>
      </div>

      <ReportsSection title="Pending Collections" description="Bookings with outstanding balance">
        <FinancePendingTable
          bookings={financeData.pendingBookings}
          onCollect={(booking) => {
            setCollectBooking(booking);
            setCollectOpen(true);
          }}
        />
      </ReportsSection>

      <ReportsSection title="Transaction History" description="Immutable payment records for the selected period">
        <FinanceTransactionsTable
          transactions={financeData.transactions}
          onSelect={(transaction) => {
            setSelectedTransaction(transaction);
            setDrawerOpen(true);
          }}
        />
      </ReportsSection>

      <FinanceTransactionDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        transaction={selectedTransaction}
      />

      <CollectPaymentDialog
        open={collectOpen}
        onOpenChange={setCollectOpen}
        remainingAmount={collectBooking?.outstanding ?? 0}
        onSubmit={handleCollect}
      />

      <BookingDetailDrawer
        open={bookingDetailOpen}
        onOpenChange={(open) => {
          setBookingDetailOpen(open);
          if (!open) setSelectedBookingId(null);
        }}
        detail={selectedDetail}
        isLoading={isDetailLoading}
        onEdit={() => toast.message("Edit is available in Bookings module")}
        onCancel={() => setDetailCancelOpen(true)}
        onDuplicate={() => toast.message("Duplicate is available in Bookings module")}
        onPrint={() => {
          if (selectedBookingId) window.open(`/api/admin/bookings/${selectedBookingId}/receipt`, "_blank");
        }}
        onCollectPayment={() => setDetailCollectOpen(true)}
        onComplete={() => setDetailCompleteOpen(true)}
      />

      <CancelBookingDialog
        open={detailCancelOpen}
        onOpenChange={setDetailCancelOpen}
        bookingReference={selectedDetail?.bookingReference ?? "this booking"}
        source={selectedDetail?.source}
        advancePaid={selectedDetail?.advancePaid ?? 0}
        onSubmit={cancelDetailBooking}
      />

      <CollectPaymentDialog
        open={detailCollectOpen}
        onOpenChange={setDetailCollectOpen}
        remainingAmount={selectedDetail?.remainingAmount ?? 0}
        onSubmit={collectDetailPayment}
      />

      <CompleteBookingDialog
        open={detailCompleteOpen}
        onOpenChange={setDetailCompleteOpen}
        remainingAmount={selectedDetail?.remainingAmount ?? 0}
        bookingReference={selectedDetail?.bookingReference ?? "this booking"}
        onSubmit={completeDetailBooking}
      />
    </div>
  );
}
