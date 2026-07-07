"use client";

import { BookingSummary, Text } from "@/components/design-system";
import type { BookingSession } from "@/features/booking/types";
import { PaymentTrustBadge } from "@/features/payments";
import { formatCurrency } from "@/utils";
import { formatDate } from "@/utils/format";
import { cn } from "@/lib/utils";

type BookingDetailsSummaryProps = {
  venueName: string;
  session: BookingSession;
  className?: string;
};

export function BookingDetailsSummary({
  venueName,
  session,
  className,
}: BookingDetailsSummaryProps) {
  return (
    <div
      className={cn(
        "border-border/70 bg-card rounded-[var(--radius-xl)] border p-5 shadow-[var(--shadow-sm)] sm:p-6",
        className,
      )}
    >
      <Text className="mb-4 font-semibold">Booking summary</Text>
      <BookingSummary
        rows={[
          { label: "Venue", value: venueName },
          { label: "Date", value: formatDate(session.dateIso) },
          { label: "Slots", value: session.timeRange ?? "—" },
          { label: "Duration", value: session.totalDurationLabel },
        ]}
      />
      <div className="border-border/60 mt-5 space-y-3 border-t pt-4">
        <div className="flex items-center justify-between gap-3">
          <Text size="sm" className="text-muted-foreground">
            Total booking
          </Text>
          <Text size="sm" className="font-medium">
            {formatCurrency(session.totalPrice)}
          </Text>
        </div>
        <div className="bg-primary/5 flex items-center justify-between gap-3 rounded-[var(--radius-md)] px-3 py-2.5">
          <div>
            <Text size="sm" className="font-semibold">
              Advance Today
            </Text>
            <Text size="sm" className="text-muted-foreground">
              Pay now online
            </Text>
          </div>
          <Text className="text-primary text-lg font-bold">
            {formatCurrency(session.advanceAmount)}
          </Text>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <Text size="sm" className="font-semibold">
              Remaining at Venue
            </Text>
            <Text size="sm" className="text-muted-foreground">
              Pay on arrival
            </Text>
          </div>
          <Text size="sm" className="font-semibold">
            {formatCurrency(session.remainingAmount)}
          </Text>
        </div>
      </div>
      <PaymentTrustBadge className="mt-5" />
    </div>
  );
}
