"use client";

import Link from "next/link";

import type { DashboardOperationsData } from "@/features/admin/dashboard/types/dashboard.types";
import {
  resolveBookingStatusBadge,
  resolvePaymentStatusBadge,
} from "@/features/admin/bookings/lib/booking-status";
import { AnalyticsCard, Button, StatusBadge, Text } from "@/components/design-system";
import { formatCurrency } from "@/utils";

type DashboardTodayOperationsSectionProps = {
  operations: DashboardOperationsData;
};

function OperationsCard({
  title,
  booking,
  emptyLabel,
}: {
  title: string;
  booking: DashboardOperationsData["currentMatch"];
  emptyLabel: string;
}) {
  return (
    <div className="border-border/70 bg-muted/15 rounded-[var(--radius-lg)] border p-4">
      <Text size="sm" className="text-muted-foreground mb-2">
        {title}
      </Text>
      {booking ? (
        <div className="space-y-2">
          <Text className="font-semibold">{booking.customerName}</Text>
          <Text size="sm" className="text-muted-foreground">
            {booking.bookingReference} · {booking.startTime} – {booking.endTime}
          </Text>
          <div className="flex flex-wrap gap-2">
            <StatusBadge {...resolveBookingStatusBadge(booking.status)} />
            <StatusBadge {...resolvePaymentStatusBadge(booking.paymentStatus)} />
          </div>
          {booking.remainingAmount > 0 ? (
            <Text size="sm" className="text-destructive font-medium">
              Outstanding {formatCurrency(booking.remainingAmount)}
            </Text>
          ) : null}
          <Link href={`/admin/bookings?id=${booking.id}`}>
            <Button size="sm" variant="outline" className="mt-2">
              Open Booking
            </Button>
          </Link>
        </div>
      ) : (
        <Text size="sm" className="text-muted-foreground">
          {emptyLabel}
        </Text>
      )}
    </div>
  );
}

function OperationsList({
  title,
  bookings,
  emptyLabel,
}: {
  title: string;
  bookings: DashboardOperationsData["pendingCollections"];
  emptyLabel: string;
}) {
  return (
    <div className="space-y-3">
      <Text className="font-medium">{title}</Text>
      {bookings.length === 0 ? (
        <Text size="sm" className="text-muted-foreground">
          {emptyLabel}
        </Text>
      ) : (
        bookings.slice(0, 4).map((booking) => (
          <Link
            key={booking.id}
            href={`/admin/bookings?id=${booking.id}`}
            className="border-border/70 hover:bg-muted/20 block rounded-[var(--radius-md)] border p-3 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <Text size="sm" className="font-medium">
                  {booking.customerName}
                </Text>
                <Text size="sm" className="text-muted-foreground">
                  {booking.startTime} · {booking.bookingReference}
                </Text>
              </div>
              <StatusBadge {...resolveBookingStatusBadge(booking.status)} />
            </div>
            {booking.remainingAmount > 0 ? (
              <Text size="sm" className="text-destructive mt-2 font-medium">
                {formatCurrency(booking.remainingAmount)} due
              </Text>
            ) : null}
          </Link>
        ))
      )}
    </div>
  );
}

export function DashboardTodayOperationsSection({
  operations,
}: DashboardTodayOperationsSectionProps) {
  return (
    <AnalyticsCard
      title="Today's Operations"
      description="Your primary working screen — live match flow, collections, and check-ins."
      action={
        <Link href="/admin/bookings">
          <Button size="sm" variant="outline">
            Open Bookings
          </Button>
        </Link>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <OperationsCard
          title="Current Match"
          booking={operations.currentMatch}
          emptyLabel="No match in progress right now."
        />
        <OperationsCard
          title="Upcoming Match"
          booking={operations.upcomingMatch}
          emptyLabel="No upcoming confirmed bookings today."
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <OperationsList
          title="Pending Collections"
          bookings={operations.pendingCollections}
          emptyLabel="All collections are settled for today."
        />
        <OperationsList
          title="Waiting for Check-in"
          bookings={operations.waitingForCheckIn}
          emptyLabel="No teams waiting to check in."
        />
      </div>
    </AnalyticsCard>
  );
}
