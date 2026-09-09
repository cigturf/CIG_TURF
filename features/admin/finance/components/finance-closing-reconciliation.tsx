"use client";

import type {
  FinanceBookingCounts,
  FinanceDailyClosing,
  FinanceReconciliation,
} from "@/features/admin/finance/types/finance.types";
import { AnalyticsCard, StatsCard } from "@/components/design-system";
import { formatCurrency } from "@/utils";
import { cn } from "@/lib/utils";

type FinanceDailyClosingCardProps = {
  closing: FinanceDailyClosing;
};

export function FinanceDailyClosingCard({ closing }: FinanceDailyClosingCardProps) {
  return (
    <AnalyticsCard
      title="Daily Closing"
      description={`End-of-day summary for ${closing.date}`}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Total Revenue" value={formatCurrency(closing.totalRevenue)} />
        <StatsCard label="Cash" value={formatCurrency(closing.cash)} />
        <StatsCard label="UPI" value={formatCurrency(closing.upi)} />
        <StatsCard label="Card" value={formatCurrency(closing.card)} />
        <StatsCard label="Razorpay" value={formatCurrency(closing.razorpay)} />
        <StatsCard label="Pending" value={formatCurrency(closing.pending)} />
        <StatsCard label="Completed" value={String(closing.completedBookings)} />
        <StatsCard label="Cancelled" value={String(closing.cancelledBookings)} />
        <StatsCard label="Manual" value={String(closing.manualBookings)} />
      </div>
    </AnalyticsCard>
  );
}

type FinanceReconciliationCardProps = {
  reconciliation: FinanceReconciliation;
};

export function FinanceReconciliationCard({ reconciliation }: FinanceReconciliationCardProps) {
  return (
    <AnalyticsCard
      title="Reconciliation"
      description="Expected vs collected vs outstanding for the selected period"
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Expected Revenue" value={formatCurrency(reconciliation.expectedRevenue)} />
        <StatsCard label="Collected Revenue" value={formatCurrency(reconciliation.collectedRevenue)} />
        <StatsCard label="Outstanding" value={formatCurrency(reconciliation.outstandingRevenue)} />
        <StatsCard
          label="Discrepancy"
          value={formatCurrency(reconciliation.discrepancy)}
          className={cn(reconciliation.hasDiscrepancy && "border-destructive/40")}
        />
      </div>
      {reconciliation.hasDiscrepancy ? (
        <p className="text-destructive mt-4 text-sm font-medium">
          A discrepancy was detected. Review transaction history and booking totals.
        </p>
      ) : (
        <p className="text-muted-foreground mt-4 text-sm">
          Collections reconcile with booking totals for this period.
        </p>
      )}
    </AnalyticsCard>
  );
}

type FinanceBookingCountsCardProps = {
  counts: FinanceBookingCounts;
};

export function FinanceBookingCountsCard({ counts }: FinanceBookingCountsCardProps) {
  return (
    <AnalyticsCard
      title="Bookings"
      description="How bookings in the selected period were made"
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Total Bookings" value={String(counts.totalBookings)} />
        <StatsCard label="Active" value={String(counts.activeBookings)} />
        <StatsCard label="Completed" value={String(counts.completedBookings)} />
        <StatsCard label="Cancelled" value={String(counts.cancelledBookings)} />
        <StatsCard
          label="Online"
          value={String(counts.onlineBookings)}
          change={`Worth ${formatCurrency(counts.onlineBookingsValue)}`}
        />
        <StatsCard
          label="Manual (Front Desk)"
          value={String(counts.manualBookings)}
          change={`Worth ${formatCurrency(counts.manualBookingsValue)}`}
        />
      </div>
    </AnalyticsCard>
  );
}
