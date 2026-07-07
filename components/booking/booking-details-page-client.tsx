"use client";

import { BookingDetailsPage } from "@/features/booking/components";
import { useConfigContext } from "@/components/providers/config-provider";

export function BookingDetailsPageClient() {
  const { displayName } = useConfigContext();
  return <BookingDetailsPage venueName={displayName} />;
}
