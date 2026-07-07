"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";

import { useAuthSession } from "@/features/auth/hooks";
import { AUTH_ROUTES } from "@/features/auth/types";
import { buildLoginUrl } from "@/features/auth/utils/redirect";
import { Display, LAYOUT, Text } from "@/components/design-system";
import { BookingDateSelector } from "@/features/booking/components/booking-date-selector";
import { BookingPromoBanners } from "@/features/booking/components/booking-promo-banners";
import { BookingSlotGrid } from "@/features/booking/components/booking-slot-grid";
import { BookingSummaryPanel } from "@/features/booking/components/booking-summary-panel";
import { useBookingSelection } from "@/features/booking/hooks";
import { BOOKING_MESSAGES, saveBookingSession } from "@/features/booking/utils";
import { cn } from "@/lib/utils";

type BookingPageProps = {
  venueName: string;
};

export function BookingPage({ venueName }: BookingPageProps) {
  const router = useRouter();
  const { isAuthenticated, isPending } = useAuthSession();
  const { dateOptions, slots, bridgeStartIndex, bridgeDateLabel, selection, selectDate, toggleSlot, summary, canContinue } =
    useBookingSelection();

  const handleContinue = () => {
    if (!canContinue) {
      toast.message(BOOKING_MESSAGES.noSelection);
      return;
    }

    saveBookingSession(selection, summary);

    if (isPending) return;

    if (isAuthenticated) {
      router.push(AUTH_ROUTES.bookingDetails);
      return;
    }

    router.push(buildLoginUrl(AUTH_ROUTES.bookingDetails));
  };

  return (
    <div className={cn(LAYOUT.containerXl, "pb-36 pt-6 sm:pt-8 lg:pb-12")}>
      <div className="mb-6 sm:mb-8">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ChevronLeft className="size-4" />
          Back to {venueName}
        </Link>
        <Display size="sm" className="text-foreground">
          Book your slot
        </Display>
        <Text className="text-muted-foreground mt-2 max-w-2xl">
          Pick a date and consecutive time slots. Late-night sessions can continue past midnight.
        </Text>
      </div>

      <BookingPromoBanners />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-8">
          <BookingDateSelector
            dates={dateOptions}
            selectedDateIso={selection.dateIso}
            onSelectDate={selectDate}
          />
          <BookingSlotGrid
            slots={slots}
            bridgeStartIndex={bridgeStartIndex}
            bridgeDateLabel={bridgeDateLabel}
            onToggleSlot={toggleSlot}
          />
        </div>

        <div className="mobile-hidden">
          <BookingSummaryPanel
            venueName={venueName}
            dateIso={selection.dateIso}
            selectedSlotIds={selection.selectedSlotIds}
            summary={summary}
            canContinue={canContinue}
            onContinue={handleContinue}
            variant="sidebar"
          />
        </div>
      </div>

      <div className="mobile-only">
        <BookingSummaryPanel
          venueName={venueName}
          dateIso={selection.dateIso}
          selectedSlotIds={selection.selectedSlotIds}
          summary={summary}
          canContinue={canContinue}
          onContinue={handleContinue}
          variant="mobile"
        />
      </div>
    </div>
  );
}
