"use client";

import { useMemo } from "react";

import { formatBookingDateLabel } from "@/features/admin/bookings/lib/booking-utils";
import { useSlotDateBookings } from "@/features/admin/bookings/hooks/use-slot-date-bookings";
import { BookingSlotCard } from "@/features/booking/components/booking-slot-card";
import { generateSlots, resolveBookingEngineConfig } from "@/features/booking/services";
import { useRealtimeSlots } from "@/features/realtime/hooks/use-realtime-slots";
import { useRealtimePricing } from "@/features/pricing/hooks/use-realtime-pricing";
import { AnalyticsCard, Badge, Input, SkeletonBookingSlot, Text } from "@/components/design-system";
import { useConfigContext } from "@/components/providers/config-provider";

type AdminBookingsSlotOverviewProps = {
  slotDate: string;
  onSlotDateChange: (dateIso: string) => void;
  onSelectBooking: (bookingId: string) => void;
};

export function AdminBookingsSlotOverview({
  slotDate,
  onSlotDateChange,
  onSelectBooking,
}: AdminBookingsSlotOverviewProps) {
  const { publicSettings } = useConfigContext();
  const config = useMemo(() => resolveBookingEngineConfig(publicSettings), [publicSettings]);

  const { bookedSlotIds, blockedSlotIds, maintenanceSlotIds, isHoliday, hydrated } =
    useRealtimeSlots(slotDate);
  const { snapshot: pricingSnapshot } = useRealtimePricing();
  const { bookingBySlotId } = useSlotDateBookings(slotDate);

  const effectiveBookedSlotIds = useMemo(() => {
    const ids = new Set(bookedSlotIds);
    for (const slotId of bookingBySlotId.keys()) {
      ids.add(slotId);
    }
    return ids;
  }, [bookedSlotIds, bookingBySlotId]);

  const slots = useMemo(
    () =>
      generateSlots({
        dateIso: slotDate,
        config,
        now: new Date(),
        selectedSlotIds: [],
        bookedSlotIds: effectiveBookedSlotIds,
        blockedSlotIds: new Set(blockedSlotIds),
        maintenanceSlotIds: new Set(maintenanceSlotIds),
        isHoliday,
        pricing: pricingSnapshot,
      }),
    [
      slotDate,
      config,
      effectiveBookedSlotIds,
      blockedSlotIds,
      maintenanceSlotIds,
      isHoliday,
      pricingSnapshot,
    ],
  );

  const stats = useMemo(() => {
    const available = slots.filter((slot) => slot.status === "available").length;
    const booked = slots.filter((slot) => slot.status === "booked").length;
    const other = slots.length - available - booked;
    return { available, booked, other, total: slots.length };
  }, [slots]);

  const handleSlotSelect = (slotId: string) => {
    const booking = bookingBySlotId.get(slotId);
    if (booking) onSelectBooking(booking.id);
  };

  return (
    <AnalyticsCard
      title="Slot Availability"
      description="Live slot inventory for the selected date — same view customers see when booking."
      action={
        <Input
          type="date"
          value={slotDate}
          onChange={(event) => onSlotDateChange(event.target.value)}
          className="h-9 w-[150px]"
        />
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Text size="sm" className="text-muted-foreground">
          {formatBookingDateLabel(slotDate)}
        </Text>
        <Badge variant="secondary">{stats.available} available</Badge>
        <Badge variant="destructive">{stats.booked} booked</Badge>
        {stats.other > 0 ? <Badge variant="outline">{stats.other} unavailable</Badge> : null}
      </div>

      {!hydrated ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, index) => (
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
            const linkedBooking = bookingBySlotId.get(slot.id);
            const isBooked = slot.status === "booked";
            const canOpenBooking = isBooked && Boolean(linkedBooking);

            return (
              <div key={slot.id} className="relative">
                <BookingSlotCard
                  slot={{
                    ...slot,
                    isSelectable: slot.status === "available" || canOpenBooking,
                  }}
                  onSelect={(slotId) => {
                    if (canOpenBooking) handleSlotSelect(slotId);
                  }}
                />
                {isBooked && linkedBooking ? (
                  <Text
                    size="sm"
                    className="text-muted-foreground mt-1 truncate px-0.5 text-[0.65rem]"
                  >
                    {linkedBooking.customerName}
                  </Text>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </AnalyticsCard>
  );
}
