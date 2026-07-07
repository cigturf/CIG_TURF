"use client";

import type { ReportDatePreset } from "@/features/admin/reports/types/reports.types";
import { Button, Input } from "@/components/design-system";
import { cn } from "@/lib/utils";

const PRESETS: { id: ReportDatePreset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "last_7_days", label: "Last 7 Days" },
  { id: "last_15_days", label: "Last 15 Days" },
  { id: "last_30_days", label: "Last 30 Days" },
  { id: "this_month", label: "This Month" },
  { id: "previous_month", label: "Previous Month" },
  { id: "custom", label: "Custom" },
];

type ReportsDateFilterProps = {
  preset: ReportDatePreset;
  customFrom: string;
  customTo: string;
  onPresetChange: (preset: ReportDatePreset) => void;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
};

export function ReportsDateFilter({
  preset,
  customFrom,
  customTo,
  onPresetChange,
  onCustomFromChange,
  onCustomToChange,
}: ReportsDateFilterProps) {
  return (
    <div className="space-y-3">
      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
        {PRESETS.map((item) => (
          <Button
            key={item.id}
            type="button"
            size="sm"
            variant={preset === item.id ? "default" : "outline"}
            className={cn("shrink-0")}
            onClick={() => onPresetChange(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>
      {preset === "custom" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Input type="date" value={customFrom} onChange={(event) => onCustomFromChange(event.target.value)} />
          <Input type="date" value={customTo} onChange={(event) => onCustomToChange(event.target.value)} />
        </div>
      ) : null}
    </div>
  );
}
