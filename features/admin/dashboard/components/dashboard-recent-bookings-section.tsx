import Link from "next/link";
import { CalendarDays } from "lucide-react";

import { ADMIN_ROUTES } from "@/features/admin/config/admin-navigation";
import type { BookingRecord } from "@/features/booking/types/booking-record.types";
import {
  AnalyticsCard,
  Button,
  EmptyState,
  StatusBadge,
  TableCell,
  TableHeader,
  TableRow,
  TableShell,
  Text,
} from "@/components/design-system";
import { formatCurrency } from "@/utils";

const RECENT_BOOKINGS_GRID =
  "min-w-[52rem] grid-cols-[10rem_7rem_5.5rem_6rem_5rem_5.5rem_4rem]";

type DashboardRecentBookingsSectionProps = {
  bookings: BookingRecord[];
};

function resolveStatus(status: BookingRecord["status"]) {
  if (status === "confirmed") return { label: "Confirmed", status: "confirmed" as const };
  if (status === "cancelled") return { label: "Cancelled", status: "cancelled" as const };
  if (status === "completed") return { label: "Completed", status: "completed" as const };
  return { label: "Expired", status: "default" as const };
}

export function DashboardRecentBookingsSection({
  bookings,
}: DashboardRecentBookingsSectionProps) {
  return (
    <AnalyticsCard
      title="Recent Bookings"
      description="Latest 10 bookings across the venue"
      action={
        <Button variant="outline" size="sm" asChild>
          <Link href={ADMIN_ROUTES.bookings}>View all</Link>
        </Button>
      }
    >
      {bookings.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No bookings yet"
          description="Confirmed bookings will appear here as customers complete checkout."
        />
      ) : (
        <TableShell>
          <TableHeader className={RECENT_BOOKINGS_GRID}>
            <TableCell header>Booking ID</TableCell>
            <TableCell header>Customer</TableCell>
            <TableCell header>Time</TableCell>
            <TableCell header>Status</TableCell>
            <TableCell header>Advance</TableCell>
            <TableCell header>Remaining</TableCell>
            <TableCell header align="right">
              View
            </TableCell>
          </TableHeader>
          {bookings.map((booking) => (
            <TableRow key={booking.id} className={RECENT_BOOKINGS_GRID}>
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
                <Text size="sm" className="text-muted-foreground truncate">
                  {booking.startTime}
                </Text>
              </TableCell>
              <TableCell truncate={false}>
                <StatusBadge {...resolveStatus(booking.status)} />
              </TableCell>
              <TableCell>
                <Text size="sm">{formatCurrency(booking.advancePaid)}</Text>
              </TableCell>
              <TableCell>
                <Text size="sm">{formatCurrency(booking.remainingAmount)}</Text>
              </TableCell>
              <TableCell align="right" truncate={false}>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`${ADMIN_ROUTES.bookings}?id=${booking.id}`}>View</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableShell>
      )}
    </AnalyticsCard>
  );
}
