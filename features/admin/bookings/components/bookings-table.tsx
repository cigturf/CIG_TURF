"use client";

import { MoreHorizontal } from "lucide-react";

import type { AdminBookingRecord } from "@/features/admin/bookings/types/admin-booking.types";
import {
  formatBookingDateLabel,
  formatBookingTimestamp,
  formatDurationLabel,
} from "@/features/admin/bookings/lib/booking-utils";
import {
  resolveBookingStatusBadge,
  resolvePaymentStatusBadge,
} from "@/features/admin/bookings/lib/booking-status";
import {
  Button,
  StatusBadge,
  TableCell,
  TableHeader,
  TableRow,
  TableShell,
  Text,
} from "@/components/design-system";
import { formatCurrency } from "@/utils";

type BookingsTableProps = {
  bookings: AdminBookingRecord[];
  onSelect: (id: string) => void;
  onAction: (action: "view" | "edit" | "cancel" | "duplicate" | "print", booking: AdminBookingRecord) => void;
};

const BOOKINGS_GRID =
  "min-w-[80rem] grid-cols-[10rem_7rem_6.5rem_6.5rem_4.5rem_4.75rem_4.25rem_4.25rem_4.75rem_6.5rem_5.5rem_5.5rem_3rem]";

export function BookingsTable({ bookings, onSelect, onAction }: BookingsTableProps) {
  return (
    <TableShell className="hidden lg:block">
      <TableHeader className={BOOKINGS_GRID}>
        <TableCell header>Booking ID</TableCell>
        <TableCell header>Customer</TableCell>
        <TableCell header>Phone</TableCell>
        <TableCell header>Date</TableCell>
        <TableCell header>Time</TableCell>
        <TableCell header>Duration</TableCell>
        <TableCell header>Total</TableCell>
        <TableCell header>Advance</TableCell>
        <TableCell header>Remaining</TableCell>
        <TableCell header>Payment</TableCell>
        <TableCell header>Status</TableCell>
        <TableCell header>Created</TableCell>
        <TableCell header align="right">
          Actions
        </TableCell>
      </TableHeader>
      {bookings.map((booking) => (
        <div key={booking.id} onClick={() => onSelect(booking.id)} className="cursor-pointer">
          <TableRow className={`${BOOKINGS_GRID} items-center`}>
            <TableCell>
              <Text size="sm" className="truncate font-medium">
                {booking.bookingReference}
              </Text>
            </TableCell>
            <TableCell>
              <Text size="sm" className="truncate">
                {booking.customerName}
              </Text>
            </TableCell>
            <TableCell>
              <Text size="sm" className="truncate">
                {booking.customerPhone}
              </Text>
            </TableCell>
            <TableCell>
              <Text size="sm" className="truncate">
                {formatBookingDateLabel(booking.bookingDate)}
              </Text>
            </TableCell>
            <TableCell>
              <Text size="sm" className="truncate">
                {booking.startTime}
              </Text>
            </TableCell>
            <TableCell>
              <Text size="sm">{formatDurationLabel(booking.durationMinutes)}</Text>
            </TableCell>
            <TableCell>
              <Text size="sm">{formatCurrency(booking.totalPrice)}</Text>
            </TableCell>
            <TableCell>
              <Text size="sm">{formatCurrency(booking.advancePaid)}</Text>
            </TableCell>
            <TableCell>
              <Text size="sm">{formatCurrency(booking.remainingAmount)}</Text>
            </TableCell>
            <TableCell truncate={false}>
              <StatusBadge {...resolvePaymentStatusBadge(booking.paymentStatus)} />
            </TableCell>
            <TableCell truncate={false}>
              <StatusBadge {...resolveBookingStatusBadge(booking.status)} />
            </TableCell>
            <TableCell>
              <Text size="sm" className="text-muted-foreground truncate">
                {formatBookingTimestamp(booking.createdAt)}
              </Text>
            </TableCell>
            <TableCell align="right" truncate={false}>
              <div onClick={(event) => event.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Booking actions"
                  onClick={() => onAction("view", booking)}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </div>
      ))}
    </TableShell>
  );
}
