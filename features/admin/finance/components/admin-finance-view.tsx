"use client";

import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { CollectPaymentDialog } from "@/features/admin/bookings/components/collect-payment-dialog";
import type { OfflinePaymentMethod } from "@/features/admin/bookings/types/admin-booking.types";
import {
  FinanceDailyClosingCard,
  FinanceReconciliationCard,
} from "@/features/admin/finance/components/finance-closing-reconciliation";
import { FinanceOverviewGrid } from "@/features/admin/finance/components/finance-overview-grid";
import { FinancePendingTable } from "@/features/admin/finance/components/finance-pending-table";
import { FinanceTransactionDrawer } from "@/features/admin/finance/components/finance-transaction-drawer";
import { FinanceTransactionsTable } from "@/features/admin/finance/components/finance-transactions-table";
import type {
  FinanceDashboardData,
  FinancePendingBooking,
  FinanceTransaction,
} from "@/features/admin/finance/types/finance.types";
import { ReportBarChart } from "@/features/admin/reports/components/report-bar-chart";
import { ReportLineChart } from "@/features/admin/reports/components/report-line-chart";
import { ReportPieChart } from "@/features/admin/reports/components/report-pie-chart";
import { ReportsDateFilter } from "@/features/admin/reports/components/reports-date-filter";
import {
  ReportsSection,
  SwipeableChartItem,
  SwipeableCharts,
} from "@/features/admin/reports/components/reports-section";
import type { ReportDatePreset } from "@/features/admin/reports/types/reports.types";
import {
  AnalyticsCard,
  Button,
  Heading,
  Text,
} from "@/components/design-system";

type AdminFinanceViewProps = {
  data: FinanceDashboardData;
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
  return `/api/admin/finance/export?${params.toString()}`;
}

export function AdminFinanceView({
  data,
  onRangeChange,
  onRefresh,
  isRefreshing,
}: AdminFinanceViewProps) {
  const [preset, setPreset] = useState<ReportDatePreset>(data.range.preset);
  const [customFrom, setCustomFrom] = useState(data.range.from);
  const [customTo, setCustomTo] = useState(data.range.to);
  const [selectedTransaction, setSelectedTransaction] = useState<FinanceTransaction | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collectBooking, setCollectBooking] = useState<FinancePendingBooking | null>(null);
  const [collectOpen, setCollectOpen] = useState(false);

  useEffect(() => {
    setPreset(data.range.preset);
    setCustomFrom(data.range.from);
    setCustomTo(data.range.to);
  }, [data.range.from, data.range.preset, data.range.to, data.generatedAt]);

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
      data.paymentBreakdown.map((item) => ({
        label: item.method,
        value: item.amount,
      })),
    [data.paymentBreakdown],
  );

  const exportActions = (
    <div className="flex flex-wrap gap-2">
      <Button asChild size="sm" variant="outline">
        <a href={buildExportUrl(data, "csv")}>
          <Download className="mr-2 size-4" />
          CSV
        </a>
      </Button>
      <Button asChild size="sm" variant="outline">
        <a href={buildExportUrl(data, "xlsx")}>
          <FileSpreadsheet className="mr-2 size-4" />
          Excel
        </a>
      </Button>
      <Button asChild size="sm" variant="outline">
        <a href={buildExportUrl(data, "pdf")} target="_blank" rel="noreferrer">
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Heading level="h3" className="mb-1">
            Finance & Accounting
          </Heading>
          <Text className="text-muted-foreground">
            {data.range.label} · {data.range.from} to {data.range.to}
            {isRefreshing ? " · Updating…" : ""}
          </Text>
        </div>
        {exportActions}
      </div>

      <FinanceOverviewGrid overview={data.overview} />

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

      <ReportsSection title="Charts" description="Revenue and collection trends">
        <SwipeableCharts>
          <SwipeableChartItem>
            <AnalyticsCard title="Revenue Trend" description="Net collections by day">
              <ReportLineChart data={data.revenueTrend} valueFormat="currency" />
            </AnalyticsCard>
          </SwipeableChartItem>
          <SwipeableChartItem>
            <AnalyticsCard title="Daily Collections" description="Payment transactions by day">
              <ReportBarChart data={data.dailyCollections} valueFormat="currency" />
            </AnalyticsCard>
          </SwipeableChartItem>
          <SwipeableChartItem>
            <AnalyticsCard title="Payment Method Distribution" description="Share of collected revenue">
              <ReportPieChart data={data.paymentBreakdown} />
            </AnalyticsCard>
          </SwipeableChartItem>
          <SwipeableChartItem>
            <AnalyticsCard title="Pending Collections Trend" description="Outstanding by booking date">
              <ReportLineChart data={data.pendingCollectionsTrend} valueFormat="currency" />
            </AnalyticsCard>
          </SwipeableChartItem>
        </SwipeableCharts>
      </ReportsSection>

      <ReportsSection title="Payment Breakdown" description="Amount, share, and transaction count">
        <AnalyticsCard title="Collections by Method">
          <ReportPieChart data={data.paymentBreakdown} />
          <div className="mt-6">
            <ReportBarChart data={paymentMethodSeries} valueFormat="currency" accentClassName="bg-chart-2" />
          </div>
        </AnalyticsCard>
      </ReportsSection>

      <FinanceReconciliationCard reconciliation={data.reconciliation} />
      <FinanceDailyClosingCard closing={data.dailyClosing} />

      <ReportsSection title="Pending Collections" description="Bookings with outstanding balance">
        <FinancePendingTable
          bookings={data.pendingBookings}
          onCollect={(booking) => {
            setCollectBooking(booking);
            setCollectOpen(true);
          }}
        />
      </ReportsSection>

      <ReportsSection title="Transaction History" description="Immutable payment records for the selected period">
        <FinanceTransactionsTable
          transactions={data.transactions}
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
    </div>
  );
}
