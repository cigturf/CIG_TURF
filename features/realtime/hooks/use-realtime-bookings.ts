"use client";

import { useMemo, useState } from "react";

import { BOOKING_EVENTS } from "@/features/events/constants/event-types";
import { useAppEventSubscriber } from "@/features/events/hooks/use-app-event-subscriber";
import type { BookingEventPayload } from "@/features/events/types/event.types";

export function useRealtimeBookings(options: { enabled?: boolean } = {}) {
  const [version, setVersion] = useState(0);
  const [lastBookingId, setLastBookingId] = useState<string | null>(null);

  useAppEventSubscriber(BOOKING_EVENTS, (event) => {
    const payload = event.payload as BookingEventPayload;
    setLastBookingId(payload.bookingId);
    setVersion((current) => current + 1);
  }, { enabled: options.enabled !== false });

  return useMemo(
    () => ({
      version,
      lastBookingId,
    }),
    [version, lastBookingId],
  );
}
