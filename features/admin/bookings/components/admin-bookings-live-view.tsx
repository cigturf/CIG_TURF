"use client";

import { AdminBookingsView } from "@/features/admin/bookings/components/admin-bookings-view";
import { BookingsRealtimeProvider } from "@/features/admin/bookings/providers/bookings-realtime-provider";
import type { AdminBookingListResponse } from "@/features/admin/bookings/types/admin-booking.types";

type AdminBookingsLiveViewProps = {
  initialData: AdminBookingListResponse;
  initialSelectedId?: string | null;
};

export function AdminBookingsLiveView({
  initialData,
  initialSelectedId = null,
}: AdminBookingsLiveViewProps) {
  return (
    <BookingsRealtimeProvider initialData={initialData} initialSelectedId={initialSelectedId}>
      <AdminBookingsView />
    </BookingsRealtimeProvider>
  );
}
