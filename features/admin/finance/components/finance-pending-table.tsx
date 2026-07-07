"use client";

import type { FinancePendingBooking } from "@/features/admin/finance/types/finance.types";
import { formatBookingDateLabel } from "@/features/admin/bookings/lib/booking-utils";
import { Button, TableShell, Text } from "@/components/design-system";
import { formatCurrency } from "@/utils";

type FinancePendingTableProps = {
  bookings: FinancePendingBooking[];
  onCollect: (booking: FinancePendingBooking) => void;
};

export function FinancePendingTable({ bookings, onCollect }: FinancePendingTableProps) {
  if (bookings.length === 0) {
    return <Text className="text-muted-foreground">No pending collections right now.</Text>;
  }

  return (
    <>
      <div className="hidden md:block">
        <TableShell>
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/40 text-muted-foreground text-left text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 font-medium">Booking ID</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Outstanding</th>
                <th className="px-4 py-3 font-medium">Booking Time</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-border/60 border-t">
                  <td className="px-4 py-3 font-medium">{booking.bookingReference}</td>
                  <td className="px-4 py-3">{booking.customerName}</td>
                  <td className="px-4 py-3">{booking.customerPhone}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(booking.outstanding)}</td>
                  <td className="px-4 py-3">
                    {formatBookingDateLabel(booking.bookingDate)} · {booking.startTime}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" onClick={() => onCollect(booking)}>
                      Collect Payment
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      </div>

      <div className="space-y-3 md:hidden">
        {bookings.map((booking) => (
          <div key={booking.id} className="border-border/70 bg-card rounded-[var(--radius-lg)] border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{booking.bookingReference}</p>
                <p className="text-muted-foreground mt-1 text-sm">{booking.customerName}</p>
                <p className="text-muted-foreground text-sm">{booking.customerPhone}</p>
              </div>
              <p className="font-semibold">{formatCurrency(booking.outstanding)}</p>
            </div>
            <p className="text-muted-foreground mt-3 text-sm">
              {formatBookingDateLabel(booking.bookingDate)} · {booking.startTime}
            </p>
            <Button className="mt-4 w-full" size="sm" onClick={() => onCollect(booking)}>
              Collect Payment
            </Button>
          </div>
        ))}
      </div>
    </>
  );
}
