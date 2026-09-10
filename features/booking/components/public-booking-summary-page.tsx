import Link from "next/link";
import { CalendarCheck, ChevronRight } from "lucide-react";

import { Button, Display, LAYOUT, StatusBadge, Text } from "@/components/design-system";
import { resolveBookingStatusBadge } from "@/features/admin/bookings/lib/booking-status";
import {
  formatBookingDateLabel,
  formatDurationLabel,
} from "@/features/admin/bookings/lib/booking-utils";
import type { PublicBookingSummary } from "@/features/booking/lib/public-booking-summary";
import { cn } from "@/lib/utils";

type PublicBookingSummaryPageProps = {
  booking: PublicBookingSummary;
  venueName: string;
};

export function PublicBookingSummaryPage({ booking, venueName }: PublicBookingSummaryPageProps) {
  const badge = resolveBookingStatusBadge(booking.status);

  return (
    <div className={cn(LAYOUT.containerMd, "py-10 sm:py-14")}>
      <div className="mx-auto max-w-lg text-center">
        <div className="bg-primary/15 text-primary mx-auto mb-6 flex size-16 items-center justify-center rounded-full">
          <CalendarCheck className="size-8" strokeWidth={1.5} />
        </div>
        <Display size="md" className="text-foreground mb-2 tracking-wide">
          BOOKING SUMMARY
        </Display>
        <Text className="text-muted-foreground mb-4">{venueName}</Text>
        <div className="mb-6 flex justify-center">
          <StatusBadge status={badge.status} label={badge.label} />
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-lg">
        <div className="border-border/70 bg-card rounded-[var(--radius-xl)] border p-5 shadow-[var(--shadow-sm)] sm:p-6">
          <SummaryRow label="Booking ID" value={booking.bookingReference} />
          <SummaryRow label="Player" value={booking.customerName} />
          <SummaryRow label="Date" value={formatBookingDateLabel(booking.bookingDate)} />
          <SummaryRow
            label="Time"
            value={`${booking.startTime} – ${booking.endTime}`}
          />
          <SummaryRow label="Duration" value={formatDurationLabel(booking.durationMinutes)} last />
        </div>

        <div className="mt-8 flex justify-center">
          <Link href="/book" className="w-full sm:w-auto">
            <Button variant="booking" size="lg" className="touch-target min-h-12 w-full sm:min-w-[11rem]">
              Book Your Own Slot
              <ChevronRight className="size-4" />
            </Button>
          </Link>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <Text size="sm" className="text-muted-foreground">
            Powered By <span className="text-foreground font-medium">TechSS X Webstudio</span>
          </Text>
          <Link
            href="https://wa.me/919996910306?text=Hi%20Smarth%2C%20I%20saw%20the%20booking%20page%20you%20built%20for%20Chandna%20Indoor%20Ground%20-%20I%27m%20interested%20in%20getting%20a%20website%20made%20too."
            target="_blank"
            rel="noopener noreferrer"
            className="border-border/70 text-muted-foreground hover:border-border hover:text-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
          >
            <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
            Need your website? - Contact Smarth Singh
          </Link>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 py-3 text-sm",
        !last && "border-border/60 border-b",
      )}
    >
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
