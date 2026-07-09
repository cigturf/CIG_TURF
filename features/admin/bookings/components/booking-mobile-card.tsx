"use client";

import type { AdminBookingRecord } from "@/features/admin/bookings/types/admin-booking.types";
import {
  formatBookingDateLabel,
  formatDurationLabel,
} from "@/features/admin/bookings/lib/booking-utils";
import {
  canCollectPayment,
  canCompleteBooking,
  resolveBookingStatusBadge,
  resolvePaymentStatusBadge,
} from "@/features/admin/bookings/lib/booking-status";
import { Badge, Button, StatusBadge, Text } from "@/components/design-system";
import { formatCurrency } from "@/utils";
import { cn } from "@/lib/utils";

type BookingQuickAction = "collect" | "complete" | "print";

type BookingMobileCardProps = {
  booking: AdminBookingRecord;
  onSelect: (id: string) => void;
  onQuickAction?: (action: BookingQuickAction, bookingId: string) => void;
};

export function BookingMobileCard({ booking, onSelect, onQuickAction }: BookingMobileCardProps) {
  return (
    <div
      className={cn(
        "border-border/80 bg-card w-full rounded-[var(--radius-lg)] border p-4 text-left",
      )}
    >
      <button type="button" onClick={() => onSelect(booking.id)} className="w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Text className="truncate font-semibold">{booking.bookingReference}</Text>
            <Text size="sm" className="text-muted-foreground mt-0.5 truncate">
              {booking.customerName} · {booking.customerPhone}
            </Text>
          </div>
          <StatusBadge {...resolveBookingStatusBadge(booking.status)} />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <Text size="sm" className="text-muted-foreground">
              Date & Time
            </Text>
            <Text size="sm" className="mt-0.5 font-medium">
              {formatBookingDateLabel(booking.bookingDate)}
            </Text>
            <Text size="sm" className="text-muted-foreground">
              {booking.startTime} · {formatDurationLabel(booking.durationMinutes)}
            </Text>
          </div>
          <div>
            <Text size="sm" className="text-muted-foreground">
              Amount
            </Text>
            <Text size="sm" className="mt-0.5 font-medium">
              {formatCurrency(booking.totalPrice)}
            </Text>
            <Text size="sm" className="text-muted-foreground">
              Remaining {formatCurrency(booking.remainingAmount)}
            </Text>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge {...resolvePaymentStatusBadge(booking.paymentStatus)} />
          <Badge variant="outline">{booking.source === "manual" ? "Manual" : "Online"}</Badge>
        </div>
      </button>

      {onQuickAction ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {canCollectPayment(booking.status) && booking.remainingAmount > 0 ? (
            <Button size="sm" variant="outline" onClick={() => onQuickAction("collect", booking.id)}>
              Collect
            </Button>
          ) : null}
          {canCompleteBooking(booking) ? (
            <Button size="sm" variant="outline" onClick={() => onQuickAction("complete", booking.id)}>
              Complete
            </Button>
          ) : null}
          <Button size="sm" variant="outline" onClick={() => onQuickAction("print", booking.id)}>
            Receipt
          </Button>
        </div>
      ) : null}
    </div>
  );
}
