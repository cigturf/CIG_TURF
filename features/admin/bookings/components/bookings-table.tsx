"use client";

import { motion } from "framer-motion";
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
  "min-w-[76rem] grid-cols-[9rem_12rem_7rem_6.5rem_6rem_10rem_7.5rem_7.5rem_7rem_3.5rem]";

const HEADER_CLASS = `${BOOKINGS_GRID} normal-case tracking-normal`;

const STATUS_BORDER_COLOR: Record<string, string> = {
  pending: "border-l-warning",
  confirmed: "border-l-success",
  cancelled: "border-l-destructive",
  completed: "border-l-info",
  default: "border-l-border",
};

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
          Date
        </TableCell>
        <TableCell header truncate={false}>
          Time
        </TableCell>
        <TableCell header truncate={false}>
          Duration
        </TableCell>
        <TableCell header truncate={false} align="right">
          Amount
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
      {bookings.map((booking, index) => {
        const bookingStatus = resolveBookingStatusBadge(booking.status);
        const borderColor = STATUS_BORDER_COLOR[bookingStatus.status] ?? STATUS_BORDER_COLOR.default;

        return (
          <motion.div
            key={booking.id}
            onClick={() => onSelect(booking.id)}
            className={`cursor-pointer border-l-4 ${borderColor}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: Math.min(index, 12) * 0.02 }}
          >
            <TableRow className={`${BOOKINGS_GRID} items-center`}>
              <TableCell truncate={false}>
                <Text size="sm" className="font-medium whitespace-nowrap">
                  {booking.bookingReference}
                </Text>
              </TableCell>
              <TableCell truncate={false}>
                <div className="min-w-0">
                  <Text size="sm" className="truncate font-medium">
                    {booking.customerName}
                  </Text>
                  <Text size="sm" className="text-muted-foreground truncate tabular-nums">
                    {formatPhoneNumber(booking.customerPhone)}
                  </Text>
                </div>
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
                <div>
                  <Text size="sm" className="font-medium whitespace-nowrap tabular-nums">
                    {formatCurrency(booking.advancePaid)}
                    <span className="text-muted-foreground font-normal">
                      {" "}
                      / {formatCurrency(booking.totalPrice)}
                    </span>
                  </Text>
                  {booking.remainingAmount > 0 ? (
                    <Text size="sm" className="text-warning whitespace-nowrap tabular-nums">
                      {formatCurrency(booking.remainingAmount)} due
                    </Text>
                  ) : null}
                </div>
              </TableCell>
              <TableCell truncate={false}>
                <StatusBadge {...resolvePaymentStatusBadge(booking.paymentStatus)} />
              </TableCell>
              <TableCell truncate={false}>
                <StatusBadge {...bookingStatus} />
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
          </motion.div>
        );
      })}
    </TableShell>
  );
}
