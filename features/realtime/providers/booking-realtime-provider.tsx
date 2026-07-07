"use client";

import { createContext, useContext, type ReactNode } from "react";

import { useRealtimeBookings } from "@/features/realtime/hooks/use-realtime-bookings";

type BookingRealtimeContextValue = ReturnType<typeof useRealtimeBookings>;

const BookingRealtimeContext = createContext<BookingRealtimeContextValue | null>(null);

export function BookingRealtimeProvider({ children }: { children: ReactNode }) {
  const value = useRealtimeBookings();

  return (
    <BookingRealtimeContext.Provider value={value}>{children}</BookingRealtimeContext.Provider>
  );
}

export function useBookingRealtimeContext() {
  const context = useContext(BookingRealtimeContext);
  if (!context) {
    throw new Error("useBookingRealtimeContext must be used within BookingRealtimeProvider");
  }
  return context;
}

export { useRealtimeBookings };
