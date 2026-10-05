"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { AnalyticsCard, Text } from "@/components/design-system";
import type { ReportPaymentBreakdown } from "@/features/admin/reports/types/reports.types";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils";

type OfflineCollectionsBreakdownCardProps = {
  breakdown: ReportPaymentBreakdown[];
  total: number;
};

export function OfflineCollectionsBreakdownCard({
  breakdown,
  total,
}: OfflineCollectionsBreakdownCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <AnalyticsCard
      title="Offline Collections Breakdown"
      description="Offline Collections total stays as-is — expand to see how much came in by method"
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <Text className="font-semibold">{formatCurrency(total)}</Text>
        <span className="text-muted-foreground flex items-center gap-1 text-sm">
          {open ? "Hide" : "Show"} by method
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
        </span>
      </button>

      {open ? (
        <div className="mt-4 space-y-2">
          {breakdown.length === 0 ? (
            <Text size="sm" className="text-muted-foreground">
              No offline collections in this period.
            </Text>
          ) : (
            breakdown.map((item) => (
              <div
                key={item.method}
                className="border-border/50 flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0"
              >
                <div>
                  <Text size="sm" className="font-medium">
                    {item.method}
                  </Text>
                  <Text size="sm" className="text-muted-foreground">
                    {item.count} transaction{item.count === 1 ? "" : "s"}
                  </Text>
                </div>
                <div className="text-right">
                  <Text size="sm" className="font-semibold">
                    {formatCurrency(item.amount)}
                  </Text>
                  <Text size="sm" className="text-muted-foreground">
                    {item.percentage}%
                  </Text>
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}
    </AnalyticsCard>
  );
}
