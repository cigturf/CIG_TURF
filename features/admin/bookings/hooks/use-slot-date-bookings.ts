"use client";

import { useEffect, useMemo, useState } from "react";

import type { AdminBookingRecord } from "@/features/admin/bookings/types/admin-booking.types";
import { normalizeAdminBookingRecord } from "@/features/admin/bookings/lib/booking-utils";
import { APP_EVENT_TYPES, BOOKING_EVENTS } from "@/features/events/constants/event-types";
import { useAppEventSubscriber } from "@/features/events/hooks/use-app-event-subscriber";

async function fetchBookingsForDate(dateIso: string): Promise<AdminBookingRecord[]> {
  const params = new URLSearchParams({
    dateFilter: "custom",
    customDate: dateIso,
  });
  const response = await fetch(`/api/admin/bookings?${params.toString()}`, { cache: "no-store" });
  if (!response.ok) return [];
  const data = (await response.json()) as { bookings: AdminBookingRecord[] };
  return data.bookings.map((booking) =>
    normalizeAdminBookingRecord(
      booking as AdminBookingRecord & { createdAt: Date | string; updatedAt: Date | string },
    ),
  );
}

/** Bookings for a specific slot date — independent of table filters. */
export function useSlotDateBookings(dateIso: string) {
  const [bookings, setBookings] = useState<AdminBookingRecord[]>([]);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void fetchBookingsForDate(dateIso).then((rows) => {
      if (!cancelled) setBookings(rows);
    });

    return () => {
      cancelled = true;
    };
  }, [dateIso, version]);

  useAppEventSubscriber(
    [...BOOKING_EVENTS, APP_EVENT_TYPES.SLOT_BLOCKED, APP_EVENT_TYPES.SLOT_UNBLOCKED],
    () => {
      setVersion((current) => current + 1);
    },
  );

  const bookingBySlotId = useMemo(() => {
    const map = new Map<string, AdminBookingRecord>();
    for (const booking of bookings) {
      if (booking.status === "cancelled") continue;
      for (const slotId of booking.selectedSlots) {
        map.set(slotId, booking);
      }
    }
    return map;
  }, [bookings]);

  return { bookings, bookingBySlotId, version };
}
