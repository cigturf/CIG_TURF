"use client";

import { BookingPage } from "@/features/booking/components";
import { BookingDataPrefetch } from "@/components/booking/booking-data-prefetch";
import { useConfigContext } from "@/components/providers/config-provider";

export function BookingPageClient() {
  const { displayName } = useConfigContext();

  return (
    <>
      <BookingDataPrefetch />
      <BookingPage venueName={displayName} />
    </>
  );
}
