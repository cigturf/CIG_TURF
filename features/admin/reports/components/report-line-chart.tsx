"use client";

import type { ReportSeriesPoint } from "@/features/admin/reports/types/reports.types";
import { cn } from "@/lib/utils";

type ReportLineChartProps = {
  data: ReportSeriesPoint[];
  valueFormat?: "number" | "currency";
  className?: string;
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

export function ReportLineChart({
  data,
  valueFormat = "number",
  className,
}: ReportLineChartProps) {
  if (data.length === 0) {
    return (
      <div className={cn("text-muted-foreground flex h-40 items-center justify-center text-sm", className)}>
        No data for this period
      </div>
    );
  }

  const width = 640;
  const height = 180;
  const padding = 16;
  const max = Math.max(...data.map((point) => point.value), 1);
  const step = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;

  const points = data.map((point, index) => {
    const x = padding + index * step;
    const y = height - padding - (point.value / max) * (height - padding * 2);
    return { x, y, point };
  });

  const line = points.map((entry) => `${entry.x},${entry.y}`).join(" ");
  const area = `${padding},${height - padding} ${line} ${width - padding},${height - padding}`;

  return (
    <div className={cn("space-y-3", className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full" role="img" aria-label="Trend chart">
        <defs>
          <linearGradient id="report-line-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#report-line-fill)" />
        <polyline
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={line}
        />
        {points.map((entry) => (
          <circle
            key={entry.point.label}
            cx={entry.x}
            cy={entry.y}
            r="3.5"
            fill="var(--background)"
            stroke="var(--primary)"
            strokeWidth="2"
          >
            <title>
              {entry.point.label}: {formatValue(entry.point.value, valueFormat)}
            </title>
          </circle>
        ))}
      </svg>
      <div className="text-muted-foreground flex justify-between gap-2 text-[10px] sm:text-xs">
        <span>{data[0]?.label}</span>
        {data.length > 2 ? <span>{data[Math.floor(data.length / 2)]?.label}</span> : null}
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}
