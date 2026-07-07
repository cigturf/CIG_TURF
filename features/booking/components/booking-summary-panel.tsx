"use client";

import { ChevronRight } from "lucide-react";

import { BookingSummary, Button, PriceSummary, Text } from "@/components/design-system";
import type { BookingSummary as BookingSummaryData } from "@/features/booking/types";
import { formatCurrency } from "@/utils";
import { getBookingDateRangeLabel } from "@/features/booking/utils/slot-timeline";
import { formatDate } from "@/utils/format";
import { cn } from "@/lib/utils";

type BookingSummaryPanelProps = {
  venueName: string;
  dateIso: string | null;
  selectedSlotIds?: string[];
  summary: BookingSummaryData;
  canContinue: boolean;
  onContinue?: () => void;
  className?: string;
  variant?: "sidebar" | "mobile";
};

export function BookingSummaryPanel({
  venueName,
  dateIso,
  selectedSlotIds = [],
  summary,
  canContinue,
  onContinue,
  className,
  variant = "sidebar",
}: BookingSummaryPanelProps) {
  const dateRangeLabel = getBookingDateRangeLabel(dateIso, selectedSlotIds);
  const formattedDate = dateIso
    ? dateRangeLabel && dateRangeLabel.includes("–")
      ? dateRangeLabel
          .split("–")
          .map((part) => formatDate(part.trim()))
          .join(" – ")
      : formatDate(dateIso)
    : "—";

  if (variant === "mobile") {
    return (
      <div
        className={cn(
          "border-border/80 bg-card/95 fixed inset-x-0 bottom-0 z-40 border-t p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md",
          className,
        )}
      >
        <div className="mb-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <Text size="sm" className="truncate font-semibold">
              {summary.timeRange ?? "Select consecutive slots"}
            </Text>
            <Text size="sm" className="text-muted-foreground truncate">
              {formattedDate}
              {summary.slotCount > 0
                ? ` · ${summary.slotCount} slots · ${summary.totalDurationLabel}`
                : null}
            </Text>
          </div>
          <div className="shrink-0 text-right">
            <Text size="sm" className="text-muted-foreground">
              Advance (fixed)
            </Text>
            <Text className="font-semibold">{formatCurrency(summary.advanceAmount)}</Text>
          </div>
        </div>
        <Button
          variant="booking"
          size="lg"
          className="touch-target min-h-11 w-full"
          disabled={!canContinue}
          onClick={onContinue}
        >
          Continue
          <ChevronRight className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <aside className={cn("lg:sticky lg:top-24 lg:self-start", className)}>
      <div className="border-border/70 bg-card rounded-[var(--radius-xl)] border p-5">
        <Text className="mb-4 font-semibold">Booking summary</Text>
        <BookingSummary
          rows={[
            { label: "Venue", value: venueName },
            { label: "Date", value: formattedDate },
            { label: "Time", value: summary.timeRange ?? "—" },
            { label: "Slots", value: summary.slotCount > 0 ? String(summary.slotCount) : "—" },
            { label: "Duration", value: summary.slotCount > 0 ? summary.totalDurationLabel : "—" },
          ]}
        />
        <div className="border-border/60 mt-5 border-t pt-4">
          <PriceSummary
            lines={[
              { label: "Total price", amount: formatCurrency(summary.totalPrice) },
              { label: "Advance (fixed)", amount: formatCurrency(summary.advanceAmount), emphasis: true },
              { label: "Remaining", amount: formatCurrency(summary.remainingAmount) },
            ]}
            total={{ label: "Pay now", amount: formatCurrency(summary.advanceAmount) }}
          />
        </div>
      </div>
      <Button
        variant="booking"
        size="lg"
        className="touch-target mt-4 min-h-11 w-full"
        disabled={!canContinue}
        onClick={onContinue}
      >
        Continue
        <ChevronRight className="size-4" />
      </Button>
    </aside>
  );
}
