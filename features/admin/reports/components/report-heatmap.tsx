"use client";

import type { ReportSeriesPoint } from "@/features/admin/reports/types/reports.types";
import { cn } from "@/lib/utils";

type ReportHeatmapProps = {
  data: ReportSeriesPoint[];
  className?: string;
};

export function ReportHeatmap({ data, className }: ReportHeatmapProps) {
  const max = Math.max(...data.map((point) => point.value), 1);

  return (
    <div className={cn("grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8", className)}>
      {data.map((point) => {
        const intensity = point.value / max;
        return (
          <div
            key={point.label}
            className="border-border/60 flex aspect-square flex-col items-center justify-center rounded-lg border p-2 text-center"
            style={{
              backgroundColor: `color-mix(in oklab, var(--primary) ${Math.round(intensity * 70)}%, transparent)`,
            }}
            title={`${point.label}: ${point.value} slots`}
          >
            <span className="text-[10px] font-medium sm:text-xs">{point.label}</span>
            <span className="text-muted-foreground mt-1 text-[10px]">{point.value}</span>
          </div>
        );
      })}
    </div>
  );
}
