"use client";

import { Text } from "@/components/design-system";
import { BookingSlotCard } from "@/features/booking/components/booking-slot-card";
import type { BookingSlot } from "@/features/booking/types";
import { cn } from "@/lib/utils";

type BookingSlotGridProps = {
  slots: BookingSlot[];
  onToggleSlot: (slotId: string) => void;
  bridgeStartIndex?: number;
  bridgeDateLabel?: string | null;
  className?: string;
};

export function BookingSlotGrid({
  slots,
  onToggleSlot,
  bridgeStartIndex = -1,
  bridgeDateLabel,
  className,
}: BookingSlotGridProps) {
  if (slots.length === 0) {
    return (
      <div
        className={cn(
          "border-border/60 bg-muted/20 rounded-[var(--radius-xl)] border border-dashed p-8 text-center",
          className,
        )}
      >
        <Text className="text-muted-foreground text-sm">Select a date to view available slots.</Text>
      </div>
    );
  }

  const primarySlots = bridgeStartIndex > 0 ? slots.slice(0, bridgeStartIndex) : slots;
  const bridgeSlots = bridgeStartIndex > 0 ? slots.slice(bridgeStartIndex) : [];

  return (
    <div className={cn("space-y-3", className)}>
      <h2 className="text-foreground text-sm font-semibold tracking-wide">Select time slots</h2>
      <p className="text-muted-foreground text-xs">
        Choose consecutive slots for your session. Sessions may continue past midnight into the next
        day.
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-2">
        {primarySlots.map((slot) => (
          <BookingSlotCard key={slot.id} slot={slot} onSelect={onToggleSlot} />
        ))}
      </div>

      {bridgeSlots.length > 0 ? (
        <div className="space-y-3 pt-2">
          <div className="border-border/60 border-t pt-4">
            <h3 className="text-foreground text-sm font-semibold">
              After midnight{bridgeDateLabel ? ` · ${bridgeDateLabel}` : ""}
            </h3>
            <p className="text-muted-foreground mt-1 text-xs">
              Continue your booking on the next calendar day.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-2">
            {bridgeSlots.map((slot) => (
              <BookingSlotCard key={slot.id} slot={slot} onSelect={onToggleSlot} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
