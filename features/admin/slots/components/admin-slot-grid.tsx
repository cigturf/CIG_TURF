"use client";

import { useMemo } from "react";

import type { BookingSlot } from "@/features/booking/types";
import type { AdminBookingRecord } from "@/features/admin/bookings/types/admin-booking.types";
import { BookingSlotCard } from "@/features/booking/components/booking-slot-card";
import { AnalyticsCard, Button, SkeletonBookingSlot, Text } from "@/components/design-system";
import { formatCurrency } from "@/utils";

type AdminSlotGridProps = {
  dateIso: string;
  slots: BookingSlot[];
  hydrated: boolean;
  selectedSlotIds: string[];
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
  bookingBySlotId,
  onSlotPress,
  onClearSelection,
  onBulkAction,
}: AdminSlotGridProps) {
  const selectableCount = selectedSlotIds.length;

  const markers = useMemo(() => {
    const items: string[] = [];
    for (let minutes = 0; minutes < 24 * 60; minutes += 30) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      const label = new Date(2020, 0, 1, h, m).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      items.push(label);
    }
    return items;
  }, []);

  return (
    <AnalyticsCard
      title="Timeline & Slot Grid"
      description="Tap slots to open bookings or select for bulk actions. Matches customer slot grid."
      action={
        selectableCount > 0 ? (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onClearSelection}>
              Clear ({selectableCount})
            </Button>
            <Button size="sm" onClick={onBulkAction}>
              Bulk Actions
            </Button>
          </div>
        ) : null
      }
    >
      <div className="border-border/60 mb-4 overflow-x-auto rounded-[var(--radius-md)] border">
        <div className="flex min-w-max items-center gap-3 px-3 py-2">
          {markers.map((label) => (
            <Text key={label} size="sm" className="text-muted-foreground whitespace-nowrap text-xs">
              {label}
            </Text>
          ))}
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
                    {booking.bookingReference} · {booking.customerName} · {formatCurrency(booking.remainingAmount)} due
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

