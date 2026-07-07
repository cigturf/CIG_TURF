"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { getEventBus, type EventBus } from "@/features/events/lib/event-bus";

const EventBusContext = createContext<EventBus | null>(null);

export function EventBusProvider({ children }: { children: ReactNode }) {
  const bus = useMemo(() => getEventBus(), []);

  return <EventBusContext.Provider value={bus}>{children}</EventBusContext.Provider>;
}

export function useEventBus(): EventBus {
  const context = useContext(EventBusContext);
  if (!context) {
    throw new Error("useEventBus must be used within EventBusProvider");
  }
  return context;
}
