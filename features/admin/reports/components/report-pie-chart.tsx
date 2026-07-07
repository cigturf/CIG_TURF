"use client";

import type { ReportPaymentBreakdown } from "@/features/admin/reports/types/reports.types";
import { formatCurrency } from "@/utils";
import { cn } from "@/lib/utils";

const SLICE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "#94a3b8",
];

type ReportPieChartProps = {
  data: ReportPaymentBreakdown[];
  className?: string;
};

export function ReportPieChart({ data, className }: ReportPieChartProps) {
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  if (total === 0) {
    return (
      <div className={cn("text-muted-foreground flex h-48 items-center justify-center text-sm", className)}>
        No payments recorded
      </div>
    );
  }

  let cursor = 0;
  const gradient = data
    .map((item, index) => {
      const start = cursor;
      cursor += (item.amount / total) * 100;
      return `${SLICE_COLORS[index % SLICE_COLORS.length]} ${start}% ${cursor}%`;
    })
    .join(", ");

  return (
    <div className={cn("grid gap-6 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center", className)}>
      <div
        className="mx-auto size-40 rounded-full shadow-inner"
        style={{ background: `conic-gradient(${gradient})` }}
        aria-hidden
      />
      <ul className="space-y-3">
        {data.map((item, index) => (
          <li key={item.method} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: SLICE_COLORS[index % SLICE_COLORS.length] }}
              />
              <span className="truncate">{item.method}</span>
            </div>
            <div className="text-right">
              <div className="font-medium">{formatCurrency(item.amount)}</div>
              <div className="text-muted-foreground text-xs">{item.percentage}% · {item.count} txns</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
