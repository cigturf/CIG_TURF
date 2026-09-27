"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

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
  const [isExpanded, setIsExpanded] = useState(false);
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
    const hasSelection = summary.slotCount > 0;

    return (
      <div
        className={cn(
          "border-border/80 bg-card/95 fixed inset-x-0 bottom-0 z-40 border-t shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md",
          className,
        )}
      >
        <AnimatePresence initial={false}>
          {isExpanded ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="max-h-[60vh] overflow-y-auto px-4 pt-4">
                <Text className="mb-3 font-semibold">Booking summary</Text>
                <BookingSummary
                  rows={[
                    { label: "Venue", value: venueName },
                    { label: "Date", value: formattedDate },
                    { label: "Time", value: summary.timeRange ?? "—" },
                    { label: "Slots", value: hasSelection ? String(summary.slotCount) : "—" },
                    { label: "Duration", value: hasSelection ? summary.totalDurationLabel : "—" },
                  ]}
                />
                <div className="border-border/60 mt-4 border-t pt-4">
                  <PriceSummary
                    lines={[
                      {
                        label: "Total price",
                        amount: hasSelection ? formatCurrency(summary.totalPrice) : "—",
                      },
                      {
                        label: "Advance (fixed)",
                        amount: formatCurrency(summary.advanceAmount),
                        emphasis: true,
                      },
                      {
                        label: "Remaining",
                        amount: hasSelection ? formatCurrency(summary.remainingAmount) : "—",
                      },
                    ]}
                    total={{ label: "Pay now", amount: formatCurrency(summary.advanceAmount) }}
                  />
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          aria-expanded={isExpanded}
          className="flex w-full items-end justify-between gap-3 p-4 text-left"
        >
          <div className="min-w-0">
            <Text size="sm" className="truncate font-semibold">
              {summary.timeRange ?? "Select consecutive slots"}
            </Text>
            <Text size="sm" className="text-muted-foreground truncate">
              {formattedDate}
              {hasSelection ? ` · ${summary.slotCount} slots · ${summary.totalDurationLabel}` : null}
            </Text>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="text-right">
              <Text size="sm" className="text-muted-foreground">
                Advance (fixed)
              </Text>
              <Text className="font-semibold">{formatCurrency(summary.advanceAmount)}</Text>
            </div>
            <ChevronDown
              className={cn(
                "text-muted-foreground size-4 shrink-0 transition-transform duration-200",
                isExpanded && "rotate-180",
              )}
            />
          </div>
        </button>

        <div className="px-4 pb-4">
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
              {
                label: "Total price",
                amount: summary.slotCount > 0 ? formatCurrency(summary.totalPrice) : "—",
              },
              { label: "Advance (fixed)", amount: formatCurrency(summary.advanceAmount), emphasis: true },
              {
                label: "Remaining",
                amount: summary.slotCount > 0 ? formatCurrency(summary.remainingAmount) : "—",
              },
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
