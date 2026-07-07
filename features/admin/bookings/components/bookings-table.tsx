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
import { formatCurrency, formatPhoneNumber } from "@/utils";

type BookingsTableProps = {
  bookings: AdminBookingRecord[];
  onSelect: (id: string) => void;
  onAction: (action: "view" | "edit" | "cancel" | "duplicate" | "print", booking: AdminBookingRecord) => void;
};

/** Wide layout so headers and INR amounts stay fully visible; scroll horizontally on smaller screens. */
const BOOKINGS_GRID =
  "min-w-[94rem] grid-cols-[11rem_8.5rem_7.5rem_9.5rem_6.5rem_7.5rem_6.75rem_6.75rem_6.75rem_9rem_7.5rem_5.75rem_3.5rem]";

const HEADER_CLASS = `${BOOKINGS_GRID} normal-case tracking-normal`;

export function BookingsTable({ bookings, onSelect, onAction }: BookingsTableProps) {
  return (
    <TableShell className="hidden lg:block [&>div]:overflow-x-auto">
      <TableHeader className={HEADER_CLASS}>
        <TableCell header truncate={false}>
          Booking ID
        </TableCell>
        <TableCell header truncate={false}>
          Customer
        </TableCell>
        <TableCell header truncate={false}>
          Phone
        </TableCell>
        <TableCell header truncate={false}>
          Date
        </TableCell>
        <TableCell header truncate={false}>
          Time
        </TableCell>
        <TableCell header truncate={false}>
          Duration
        </TableCell>
        <TableCell header truncate={false} align="right">
          Total
        </TableCell>
        <TableCell header truncate={false} align="right">
          Advance
        </TableCell>
        <TableCell header truncate={false} align="right">
          Remaining
        </TableCell>
        <TableCell header truncate={false}>
          Payment
        </TableCell>
        <TableCell header truncate={false}>
          Status
        </TableCell>
        <TableCell header truncate={false}>
          Created
        </TableCell>
        <TableCell header truncate={false} align="right">
          Actions
        </TableCell>
      </TableHeader>
      {bookings.map((booking) => (
        <div key={booking.id} onClick={() => onSelect(booking.id)} className="cursor-pointer">
          <TableRow className={`${BOOKINGS_GRID} items-center`}>
            <TableCell truncate={false}>
              <Text size="sm" className="font-medium whitespace-nowrap">
                {booking.bookingReference}
              </Text>
            </TableCell>
            <TableCell truncate={false}>
              <Text size="sm" className="whitespace-nowrap">
                {booking.customerName}
              </Text>
            </TableCell>
            <TableCell truncate={false}>
              <Text size="sm" className="whitespace-nowrap tabular-nums">
                {formatPhoneNumber(booking.customerPhone)}
              </Text>
            </TableCell>
            <TableCell truncate={false}>
              <Text size="sm" className="whitespace-nowrap">
                {formatBookingDateLabel(booking.bookingDate)}
              </Text>
            </TableCell>
            <TableCell truncate={false}>
              <Text size="sm" className="whitespace-nowrap">
                {booking.startTime}
              </Text>
            </TableCell>
            <TableCell truncate={false}>
              <Text size="sm" className="whitespace-nowrap">
                {formatDurationLabel(booking.durationMinutes)}
              </Text>
            </TableCell>
            <TableCell truncate={false} align="right">
              <Text size="sm" className="whitespace-nowrap tabular-nums">
                {formatCurrency(booking.totalPrice)}
              </Text>
            </TableCell>
            <TableCell truncate={false} align="right">
              <Text size="sm" className="whitespace-nowrap tabular-nums">
                {formatCurrency(booking.advancePaid)}
              </Text>
            </TableCell>
            <TableCell truncate={false} align="right">
              <Text size="sm" className="whitespace-nowrap tabular-nums">
                {formatCurrency(booking.remainingAmount)}
              </Text>
            </TableCell>
            <TableCell truncate={false}>
              <StatusBadge {...resolvePaymentStatusBadge(booking.paymentStatus)} />
            </TableCell>
            <TableCell truncate={false}>
              <StatusBadge {...resolveBookingStatusBadge(booking.status)} />
            </TableCell>
            <TableCell truncate={false}>
              <Text size="sm" className="text-muted-foreground whitespace-nowrap tabular-nums">
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
