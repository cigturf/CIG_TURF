"use client";

import { ClipboardList } from "lucide-react";

import { resolveBookingStatusBadge } from "@/features/admin/bookings/lib/booking-status";
import { formatBookingDateLabel } from "@/features/admin/bookings/lib/booking-utils";
import type { FinanceBookingDetail } from "@/features/admin/finance/types/finance.types";
import { EmptyState, StatusBadge, TableShell } from "@/components/design-system";
import { formatCurrency, formatPhoneNumber } from "@/utils";
import { cn } from "@/lib/utils";

type FinanceBookingDetailsTableProps = {
  bookings: FinanceBookingDetail[];
};

const BALANCE_LABELS: Record<FinanceBookingDetail["balanceStatus"], string> = {
  paid: "Collected",
  pending: "Pending",
  not_required: "Not required",
};

function BalanceCell({ booking }: { booking: FinanceBookingDetail }) {
  if (booking.balanceStatus === "not_required") {
    return <span className="text-muted-foreground">Not required</span>;
  }
  if (booking.balanceStatus === "paid") {
    return (
      <div>
        <span className="font-medium">{formatCurrency(booking.balancePaidAmount)}</span>
        <span className="text-muted-foreground"> · {booking.balanceMethod}</span>
      </div>
    );
  }
  return (
    <span className="text-warning font-medium">{formatCurrency(booking.balanceDue)} pending</span>
  );
}

export function FinanceBookingDetailsTable({ bookings }: FinanceBookingDetailsTableProps) {
  if (bookings.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No bookings in this period"
        description="Try a wider date range or clear your filters."
      />
    );
  }

  return (
    <>
      <div className="hidden lg:block">
        <TableShell className="[&>div]:overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm">
            <thead className="bg-muted/40 text-muted-foreground text-left text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 font-medium">Booking</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Date &amp; Slot</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Advance Paid</th>
                <th className="px-4 py-3 font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const statusBadge = resolveBookingStatusBadge(booking.status);
                return (
                  <tr key={booking.bookingReference} className="border-border/60 border-t">
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      {booking.bookingReference}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{booking.customerName}</div>
                      <div className="text-muted-foreground tabular-nums">
                        {formatPhoneNumber(booking.customerPhone)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>{formatBookingDateLabel(booking.bookingDate)}</div>
                      <div className="text-muted-foreground">
                        {booking.startTime} – {booking.endTime}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {booking.source === "manual" ? "Manual" : "Online"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge {...statusBadge} />
                    </td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap tabular-nums">
                      {formatCurrency(booking.totalPrice)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {booking.advanceAmount > 0 ? (
                        <div>
                          <span className="font-medium">{formatCurrency(booking.advanceAmount)}</span>
                          <span className="text-muted-foreground"> · {booking.advanceMethod}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <BalanceCell booking={booking} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableShell>
      </div>

      <div className="space-y-3 lg:hidden">
        {bookings.map((booking) => {
          const statusBadge = resolveBookingStatusBadge(booking.status);
          return (
            <div
              key={booking.bookingReference}
              className="border-border/70 bg-card rounded-[var(--radius-lg)] border p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{booking.bookingReference}</p>
                  <p className="text-muted-foreground mt-1 text-sm">{booking.customerName}</p>
                  <p className="text-muted-foreground text-sm tabular-nums">
                    {formatPhoneNumber(booking.customerPhone)}
                  </p>
                </div>
                <StatusBadge {...statusBadge} />
              </div>
              <p className="text-muted-foreground mt-3 text-sm">
                {formatBookingDateLabel(booking.bookingDate)} · {booking.startTime} – {booking.endTime}
                {" · "}
                {booking.source === "manual" ? "Manual" : "Online"}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Total</p>
                  <p className="font-medium">{formatCurrency(booking.totalPrice)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Advance</p>
                  <p className="font-medium">
                    {booking.advanceAmount > 0 ? formatCurrency(booking.advanceAmount) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Balance</p>
                  <p
                    className={cn(
                      "font-medium",
                      booking.balanceStatus === "pending" && "text-warning",
                    )}
                  >
                    {BALANCE_LABELS[booking.balanceStatus]}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
