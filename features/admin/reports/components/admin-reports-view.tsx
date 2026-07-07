"use client";

import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ReportBarChart } from "@/features/admin/reports/components/report-bar-chart";
import { ReportHeatmap } from "@/features/admin/reports/components/report-heatmap";
import { ReportLineChart } from "@/features/admin/reports/components/report-line-chart";
import { ReportPieChart } from "@/features/admin/reports/components/report-pie-chart";
import { ReportsDateFilter } from "@/features/admin/reports/components/reports-date-filter";
import { ReportsOverviewGrid } from "@/features/admin/reports/components/reports-overview-grid";
import {
  ReportsSection,
  SwipeableChartItem,
  SwipeableCharts,
} from "@/features/admin/reports/components/reports-section";
import type { ReportDatePreset, ReportsAnalyticsData } from "@/features/admin/reports/types/reports.types";
import {
  AnalyticsCard,
  Button,
  Heading,
  StatsCard,
  Text,
} from "@/components/design-system";
import { formatCurrency } from "@/utils";

type AdminReportsViewProps = {
  data: ReportsAnalyticsData;
  onRangeChange: (input: {
    preset: ReportDatePreset;
    from?: string;
    to?: string;
  }) => Promise<void>;
  isRefreshing?: boolean;
};

function buildExportUrl(
  data: ReportsAnalyticsData,
  format: "csv" | "xlsx" | "pdf",
  kind: "daily" | "weekly" | "monthly" | "custom",
) {
  const params = new URLSearchParams({
    preset: data.range.preset,
    format,
    kind,
  });
  if (data.range.preset === "custom") {
    params.set("from", data.range.from);
    params.set("to", data.range.to);
  }
  return `/api/admin/reports/export?${params.toString()}`;
}

export function AdminReportsView({ data, onRangeChange, isRefreshing }: AdminReportsViewProps) {
  const [preset, setPreset] = useState<ReportDatePreset>(data.range.preset);
  const [customFrom, setCustomFrom] = useState(data.range.from);
  const [customTo, setCustomTo] = useState(data.range.to);

  useEffect(() => {
    setPreset(data.range.preset);
    setCustomFrom(data.range.from);
    setCustomTo(data.range.to);
  }, [data.range.from, data.range.preset, data.range.to, data.generatedAt]);

  const paymentMethodSeries = useMemo(
    () =>
      data.paymentBreakdown.map((item) => ({
        label: item.method,
        value: item.amount,
      })),
    [data.paymentBreakdown],
  );

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

  const exportActions = useMemo(
    () => (
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <a href={buildExportUrl(data, "csv", "custom")}>
            <Download className="mr-2 size-4" />
            CSV
          </a>
        </Button>
        <Button asChild size="sm" variant="outline">
          <a href={buildExportUrl(data, "xlsx", "custom")}>
            <FileSpreadsheet className="mr-2 size-4" />
            Excel
          </a>
        </Button>
        <Button asChild size="sm" variant="outline">
          <a href={buildExportUrl(data, "pdf", "custom")} target="_blank" rel="noreferrer">
            <FileText className="mr-2 size-4" />
            PDF
          </a>
        </Button>
      </div>
    ),
    [data],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Heading level="h3" className="mb-1">
            Reports & Analytics
          </Heading>
          <Text className="text-muted-foreground">
            {data.range.label} · {data.range.from} to {data.range.to}
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

      <ReportsOverviewGrid overview={data.overview} />

      <ReportsSection title="Interactive Charts" description="Trends across the selected period">
        <SwipeableCharts>
          <SwipeableChartItem>
            <AnalyticsCard title="Bookings Per Day" description="Daily booking volume">
              <ReportBarChart data={data.bookingsPerDay} />
            </AnalyticsCard>
          </SwipeableChartItem>
          <SwipeableChartItem>
            <AnalyticsCard title="Revenue Trend" description="Gross booking value by day">
              <ReportLineChart data={data.revenueTrend} valueFormat="currency" />
            </AnalyticsCard>
          </SwipeableChartItem>
        </SwipeableCharts>
      </ReportsSection>

      <ReportsSection title="Booking Analytics" description="When and how customers book">
        <SwipeableCharts>
          <SwipeableChartItem>
            <AnalyticsCard title="Bookings Per Hour" description="Hourly distribution">
              <ReportBarChart data={data.bookingsPerHour} accentClassName="bg-chart-2" />
            </AnalyticsCard>
          </SwipeableChartItem>
          <SwipeableChartItem>
            <AnalyticsCard title="Peak Booking Times" description="Busiest hours">
              <ReportBarChart data={data.peakBookingTimes} accentClassName="bg-chart-3" />
            </AnalyticsCard>
          </SwipeableChartItem>
          <SwipeableChartItem>
            <AnalyticsCard title="Popular Time Slots" description="Most booked start times">
              <ReportBarChart data={data.popularSlots} accentClassName="bg-chart-4" />
            </AnalyticsCard>
          </SwipeableChartItem>
          <SwipeableChartItem>
            <AnalyticsCard title="Popular Days" description="Day-of-week preference">
              <ReportBarChart data={data.popularDays} accentClassName="bg-chart-5" />
            </AnalyticsCard>
          </SwipeableChartItem>
        </SwipeableCharts>
        <AnalyticsCard title="Cancellation Trend" description="Daily cancellations">
          <ReportLineChart data={data.cancellationTrend} />
        </AnalyticsCard>
      </ReportsSection>

      <ReportsSection title="Revenue Analytics" description="Collections and payment flow">
        <SwipeableCharts>
          <SwipeableChartItem>
            <AnalyticsCard title="Daily Revenue" description="Gross booking value">
              <ReportBarChart data={data.dailyRevenue} valueFormat="currency" />
            </AnalyticsCard>
          </SwipeableChartItem>
          <SwipeableChartItem>
            <AnalyticsCard title="Advance Payments" description="Advance collected per day">
              <ReportLineChart data={data.advancePayments} valueFormat="currency" />
            </AnalyticsCard>
          </SwipeableChartItem>
          <SwipeableChartItem>
            <AnalyticsCard title="Offline Payments" description="Venue collections per day">
              <ReportLineChart data={data.offlinePayments} valueFormat="currency" />
            </AnalyticsCard>
          </SwipeableChartItem>
          <SwipeableChartItem>
            <AnalyticsCard title="Pending Payments" description="Outstanding balance by booking date">
              <ReportLineChart data={data.pendingPayments} valueFormat="currency" />
            </AnalyticsCard>
          </SwipeableChartItem>
          <SwipeableChartItem>
            <AnalyticsCard title="Cash vs UPI vs Card" description="Offline and online collections">
              <ReportBarChart data={paymentMethodSeries} valueFormat="currency" accentClassName="bg-chart-2" />
            </AnalyticsCard>
          </SwipeableChartItem>
        </SwipeableCharts>
      </ReportsSection>

      <ReportsSection title="Occupancy Analytics" description="Slot utilization across the period">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard label="Available Slots" value={String(data.occupancy.availableSlots)} />
          <StatsCard label="Booked Slots" value={String(data.occupancy.bookedSlots)} />
          <StatsCard label="Blocked Slots" value={String(data.occupancy.blockedSlots)} />
          <StatsCard label="Maintenance" value={String(data.occupancy.maintenanceSlots)} />
        </div>
        <AnalyticsCard
          title="Occupancy Rate"
          description={`${data.occupancy.occupancyPercent}% of sellable inventory booked`}
        >
          <div className="bg-muted/40 mb-4 h-3 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(data.occupancy.occupancyPercent, 100)}%` }}
            />
          </div>
          <p className="text-2xl font-semibold">{data.occupancy.occupancyPercent}%</p>
        </AnalyticsCard>
        <AnalyticsCard title="Busiest Hours Heatmap" description="Slot bookings by hour">
          <ReportHeatmap data={data.occupancy.heatmap} />
        </AnalyticsCard>
      </ReportsSection>

      <ReportsSection title="Payment Breakdown" description="Method mix for the selected period">
        <AnalyticsCard title="Collections by Method">
          <ReportPieChart data={data.paymentBreakdown} />
        </AnalyticsCard>
      </ReportsSection>

      <ReportsSection title="Exports" description="Generate filtered reports for your records">
        <div className="grid gap-4 lg:grid-cols-2">
          <AnalyticsCard title="Quick Reports">
            <div className="grid gap-2 sm:grid-cols-2">
              <Button asChild variant="outline">
                <a href={buildExportUrl(data, "pdf", "daily")} target="_blank" rel="noreferrer">
                  Daily Report
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={buildExportUrl(data, "pdf", "weekly")} target="_blank" rel="noreferrer">
                  Weekly Report
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={buildExportUrl(data, "pdf", "monthly")} target="_blank" rel="noreferrer">
                  Monthly Report
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={buildExportUrl(data, "pdf", "custom")} target="_blank" rel="noreferrer">
                  Custom Report
                </a>
              </Button>
            </div>
          </AnalyticsCard>
          <AnalyticsCard title="Current Period Summary">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Revenue</span>
                <span className="font-medium">{formatCurrency(data.overview.totalRevenue)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Advance collected</span>
                <span className="font-medium">{formatCurrency(data.overview.advanceCollected)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-medium">{formatCurrency(data.overview.pendingCollections)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Generated</span>
                <span className="font-medium">{new Date(data.generatedAt).toLocaleString("en-IN")}</span>
              </div>
            </div>
            {exportActions}
          </AnalyticsCard>
        </div>
      </ReportsSection>
    </div>
  );
}
