"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { useBookingRealtimeContext } from "@/features/realtime/providers/booking-realtime-provider";

/** Prepares command palette for future live search providers. */
type RealtimeSearchContextValue = {
  bookingsVersion: number;
};

const RealtimeSearchContext = createContext<RealtimeSearchContextValue | null>(null);

export function RealtimeSearchProvider({ children }: { children: ReactNode }) {
  const { version } = useBookingRealtimeContext();

  const value = useMemo(
    () => ({
      bookingsVersion: version,
    }),
    [version],
  );

  return (
    <RealtimeSearchContext.Provider value={value}>{children}</RealtimeSearchContext.Provider>
  );
}

export function useRealtimeSearchIndex() {
  const context = useContext(RealtimeSearchContext);
  return context?.bookingsVersion ?? 0;
}
