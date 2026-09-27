"use client";

import { useMemo } from "react";

import type { BookingSlot } from "@/features/booking/types";
import type { AdminBookingRecord } from "@/features/admin/bookings/types/admin-booking.types";
import { BookingSlotCard } from "@/features/booking/components/booking-slot-card";
import { AnalyticsCard, Button, SkeletonBookingSlot, Text } from "@/components/design-system";
import { getTodayIso } from "@/features/booking/utils/time";
import { formatCurrency } from "@/utils";
import { cn } from "@/lib/utils";

type AdminSlotGridProps = {
  dateIso: string;
  slots: BookingSlot[];
  hydrated: boolean;
  selectedSlotIds: string[];
  selectionMode?: boolean;
  bookingBySlotId: Map<string, AdminBookingRecord>;
  onSlotPress: (slotId: string, status: BookingSlot["status"]) => void;
  onClearSelection: () => void;
  onBulkAction: () => void;
};

export function AdminSlotGrid({
  dateIso,
  slots,
  hydrated,
  selectedSlotIds,
  selectionMode = false,
  bookingBySlotId,
  onSlotPress,
  onClearSelection,
  onBulkAction,
}: AdminSlotGridProps) {
  const selectableCount = selectedSlotIds.length;
  const isToday = dateIso === getTodayIso();

  const markers = useMemo(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + Math.floor(now.getMinutes() / 30) * 30;
    const items: { label: string; minutes: number }[] = [];
    for (let minutes = 0; minutes < 24 * 60; minutes += 30) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      const label = new Date(2020, 0, 1, h, m).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      items.push({ label, minutes });
    }
    return { items, currentMinutes };
  }, []);

  return (
    <AnalyticsCard
      title="Timeline & Slot Grid"
      description={
        selectionMode
          ? "Selection mode on — tap available or blocked slots, then Apply."
          : "Tap available slots to book. Use “Block Slots” to mark slots unavailable."
      }
      action={
        selectableCount > 0 ? (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onClearSelection}>
              Clear ({selectableCount})
            </Button>
            <Button size="sm" onClick={onBulkAction}>
              Apply
            </Button>
          </div>
        ) : null
      }
    >
      <div className="border-border/60 bg-muted/20 sticky top-0 z-10 mb-4 overflow-x-auto rounded-[var(--radius-md)] border">
        <div className="flex min-w-max items-center gap-3 px-3 py-2">
          {markers.items.map((marker) => {
            const isNow = isToday && marker.minutes === markers.currentMinutes;
            return (
              <Text
                key={marker.label}
                size="sm"
                className={cn(
                  "whitespace-nowrap text-xs",
                  isNow
                    ? "text-primary rounded-full bg-primary/10 px-1.5 py-0.5 font-semibold"
                    : "text-muted-foreground",
                )}
              >
                {marker.label}
              </Text>
            );
          })}
        </div>
      </div>

      {!hydrated ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 12 }).map((_, index) => (
            <SkeletonBookingSlot key={index} />
          ))}
        </div>
      ) : slots.length === 0 ? (
        <div className="border-border/60 bg-muted/20 rounded-[var(--radius-xl)] border border-dashed p-8 text-center">
          <Text className="text-muted-foreground text-sm">No slots configured for this date.</Text>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {slots.map((slot) => {
            const booking = bookingBySlotId.get(slot.id);
            const isSelected = selectedSlotIds.includes(slot.id);

            return (
              <div key={slot.id} className="relative">
                <BookingSlotCard
                  slot={{
                    ...slot,
                    isSelected,
                    isSelectable:
                      slot.status === "available" ||
                      slot.status === "booked" ||
                      slot.status === "reserved" ||
                      slot.status === "blocked" ||
                      slot.status === "maintenance",
                  }}
                  onSelect={() => onSlotPress(slot.id, slot.status)}
                />
                {booking ? (
                  <Text
                    size="sm"
                    className="text-muted-foreground mt-1 line-clamp-2 px-0.5 text-[0.65rem] leading-snug"
                    title={`${booking.bookingReference} · ${booking.customerName} · ${formatCurrency(booking.remainingAmount)} due`}
                  >
                    {booking.bookingReference} · {booking.customerName} ·{" "}
                    {formatCurrency(booking.remainingAmount)} due
                  </Text>
                ) : slot.status === "reserved" ? (
                  <Text
                    size="sm"
                    className="text-muted-foreground mt-1 px-0.5 text-[0.65rem] leading-snug"
                  >
                    Payment hold · tap to release
                  </Text>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
      <Text size="sm" className="text-muted-foreground mt-4">
        Date: {dateIso}
      </Text>
    </AnalyticsCard>
  );
}
