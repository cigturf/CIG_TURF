"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { CACHE_TTL } from "@/config/cache.config";
import { QUERY_KEYS } from "@/config/query-keys.config";
import { buildBookingDateOptions } from "@/features/booking/services/date-options.service";
import { BOOKING_DEFAULTS } from "@/features/booking/config";
import { fetchActivePricingRules } from "@/features/pricing/services/pricing-client.service";
import type { SlotAvailabilitySnapshot } from "@/features/slots/types/slot-management.types";

async function fetchSlotAvailability(dateIso: string): Promise<SlotAvailabilitySnapshot> {
  const response = await fetch(`/api/slots/availability?dateIso=${encodeURIComponent(dateIso)}`);
  if (!response.ok) {
    return {
      bookedSlotIds: [],
      heldSlotIds: [],
      blockedSlotIds: [],
      maintenanceSlotIds: [],
      isHoliday: false,
    };
  }
  return response.json() as Promise<SlotAvailabilitySnapshot>;
}

/** Warms React Query cache for the booking flow before the user interacts. */
export function BookingDataPrefetch() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const dates = buildBookingDateOptions(BOOKING_DEFAULTS.bookingWindowDays).map(
      (option) => option.iso,
    );
    const prefetchDates = dates.slice(0, 3);

    void queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.pricing.active,
      queryFn: fetchActivePricingRules,
      staleTime: CACHE_TTL.pricing,
    });

    for (const dateIso of prefetchDates) {
      void queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.slots.availability(dateIso),
        queryFn: () => fetchSlotAvailability(dateIso),
        staleTime: CACHE_TTL.slots,
      });
    }
  }, [queryClient]);

  return null;
}
