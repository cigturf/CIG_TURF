"use client";

import type { ReportSeriesPoint } from "@/features/admin/reports/types/reports.types";
import { cn } from "@/lib/utils";

type ReportBarChartProps = {
  data: ReportSeriesPoint[];
  valueFormat?: "number" | "currency";
  className?: string;
  accentClassName?: string;
};

function formatValue(value: number, format: "number" | "currency") {
  if (format === "currency") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
      notation: value >= 100000 ? "compact" : "standard",
    }).format(value);
  }
  return value.toLocaleString("en-IN");
}

export function ReportBarChart({
  data,
  valueFormat = "number",
  className,
  accentClassName = "bg-primary",
}: ReportBarChartProps) {
  const max = Math.max(...data.map((point) => point.value), 1);

  if (data.length === 0) {
    return (
      <div className={cn("text-muted-foreground flex h-40 items-center justify-center text-sm", className)}>
        No data for this period
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex h-44 items-end gap-1.5 sm:gap-2">
        {data.map((point) => {
          const height = Math.max((point.value / max) * 100, point.value > 0 ? 8 : 0);
          return (
            <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <span className="text-muted-foreground text-[10px] font-medium sm:text-xs">
                {formatValue(point.value, valueFormat)}
              </span>
              <div className="flex h-28 w-full items-end">
                <div
                  className={cn("w-full rounded-t-md transition-all duration-500", accentClassName)}
                  style={{ height: `${height}%` }}
                  title={`${point.label}: ${formatValue(point.value, valueFormat)}`}
                />
              </div>
              <span className="text-muted-foreground w-full truncate text-center text-[10px] sm:text-xs">
                {point.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
