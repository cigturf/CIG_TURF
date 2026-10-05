"use client";

import type {
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
          A discrepancy was detected. Review the bookings below.
        </p>
      ) : (
        <p className="text-muted-foreground mt-4 text-sm">
          Collections reconcile with booking totals for this period.
        </p>
      )}

      {reconciliation.discrepancies.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-left">
                <th className="pb-2 pr-4 font-medium">Booking</th>
                <th className="pb-2 pr-4 font-medium">Customer</th>
                <th className="pb-2 pr-4 font-medium">Expected</th>
                <th className="pb-2 pr-4 font-medium">Collected</th>
                <th className="pb-2 pr-4 font-medium">Outstanding</th>
                <th className="pb-2 font-medium">Discrepancy</th>
              </tr>
            </thead>
            <tbody>
              {reconciliation.discrepancies.map((row) => (
                <tr key={row.bookingId} className="border-border/50 border-t">
                  <td className="py-2 pr-4 font-medium whitespace-nowrap">{row.bookingReference}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">{row.customerName}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">{formatCurrency(row.expected)}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">{formatCurrency(row.collected)}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">{formatCurrency(row.outstanding)}</td>
                  <td className="text-destructive py-2 font-medium whitespace-nowrap">
                    {formatCurrency(row.discrepancy)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </AnalyticsCard>
  );
}
