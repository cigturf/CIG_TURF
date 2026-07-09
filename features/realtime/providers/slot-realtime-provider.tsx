"use client";

import { useQuery } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { CACHE_TTL } from "@/config/cache.config";
import { QUERY_KEYS } from "@/config/query-keys.config";
import { parseSlotId } from "@/features/booking/utils/slot-id";
import {
  APP_EVENT_TYPES,
  SLOT_AVAILABILITY_EVENTS,
} from "@/features/events/constants/event-types";
import type { BookingEventPayload } from "@/features/events/types/event.types";
import { useAppEventSubscriber } from "@/features/events/hooks/use-app-event-subscriber";
import { useDebouncedCallback } from "@/lib/performance/use-debounced-callback";

type SlotSnapshot = {
  bookedSlotIds: string[];
  heldSlotIds: string[];
  blockedSlotIds: string[];
  maintenanceSlotIds: string[];
  isHoliday: boolean;
};

type SlotRealtimeContextValue = {
  version: number;
  getSnapshot: (dateIso: string) => SlotSnapshot;
  setInitialSnapshot: (dateIso: string, snapshot: SlotSnapshot) => void;
};

const SlotRealtimeContext = createContext<SlotRealtimeContextValue | null>(null);

function emptySnapshot(): SlotSnapshot {
  return {
    bookedSlotIds: [],
    heldSlotIds: [],
    blockedSlotIds: [],
    maintenanceSlotIds: [],
    isHoliday: false,
  };
}

function slotAffectsDate(slotId: string, dateIso: string): boolean {
  return parseSlotId(slotId)?.dateIso === dateIso;
}

function bookingEventAffectsDate(payload: BookingEventPayload, dateIso: string): boolean {
  if (payload.bookingDate === dateIso) return true;
  return payload.selectedSlots?.some((slotId) => slotAffectsDate(slotId, dateIso)) ?? false;
}

export function SlotRealtimeProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);
  const [snapshotsByDate, setSnapshotsByDate] = useState<Record<string, SlotSnapshot>>({});

  const applySlotInsert = useCallback(
    (
      dateIso: string,
      key: "bookedSlotIds" | "heldSlotIds" | "blockedSlotIds" | "maintenanceSlotIds",
      slotId: string,
    ) => {
      setSnapshotsByDate((current) => {
        const existing = current[dateIso] ?? emptySnapshot();
        const nextIds = existing[key].includes(slotId) ? existing[key] : [...existing[key], slotId];
        return { ...current, [dateIso]: { ...existing, [key]: nextIds } };
      });
      setVersion((current) => current + 1);
    },
    [],
  );

  const applySlotDelete = useCallback((dateIso: string, slotId: string) => {
    setSnapshotsByDate((current) => {
      const existing = current[dateIso] ?? emptySnapshot();
      return {
        ...current,
        [dateIso]: {
          ...existing,
          bookedSlotIds: existing.bookedSlotIds.filter((id) => id !== slotId),
          heldSlotIds: existing.heldSlotIds.filter((id) => id !== slotId),
          blockedSlotIds: existing.blockedSlotIds.filter((id) => id !== slotId),
          maintenanceSlotIds: existing.maintenanceSlotIds.filter((id) => id !== slotId),
        },
      };
    });
    setVersion((current) => current + 1);
  }, []);

  const applyReleasedSlots = useCallback((slotIds: string[]) => {
    for (const slotId of slotIds) {
      const parsed = parseSlotId(slotId);
      if (parsed) applySlotDelete(parsed.dateIso, slotId);
    }
  }, [applySlotDelete]);

  useAppEventSubscriber(APP_EVENT_TYPES.SLOT_BOOKED, (event) => {
    const { slotId, bookingDate, source } = event.payload as {
      slotId: string;
      bookingDate: string;
      source?: string;
    };
    if (source === "hold") {
      applySlotInsert(bookingDate, "heldSlotIds", slotId);
      return;
    }
    applySlotInsert(bookingDate, "bookedSlotIds", slotId);
  });

  useAppEventSubscriber(APP_EVENT_TYPES.SLOT_RELEASED, (event) => {
    const { slotId, bookingDate, source } = event.payload as {
      slotId: string;
      bookingDate: string;
      source?: string;
    };
    if (source === "hold") {
      applySlotDelete(bookingDate, slotId);
      return;
    }
    if (source && source !== "booked") return;
    applySlotDelete(bookingDate, slotId);
  });

  useAppEventSubscriber(APP_EVENT_TYPES.SLOT_BLOCKED, (event) => {
    const { slotId, bookingDate } = event.payload;
    applySlotInsert(bookingDate, "blockedSlotIds", slotId);
  });

  useAppEventSubscriber(APP_EVENT_TYPES.SLOT_UNBLOCKED, (event) => {
    const { slotId, bookingDate } = event.payload;
    applySlotDelete(bookingDate, slotId);
  });

  useAppEventSubscriber(APP_EVENT_TYPES.SLOT_MAINTENANCE, (event) => {
    const { slotId, bookingDate } = event.payload;
    applySlotInsert(bookingDate, "maintenanceSlotIds", slotId);
  });

  useAppEventSubscriber(APP_EVENT_TYPES.SLOT_HOLIDAY, (event) => {
    const payload = event.payload as { bookingDate: string; active: boolean };
    setSnapshotsByDate((current) => {
      const existing = current[payload.bookingDate] ?? emptySnapshot();
      return { ...current, [payload.bookingDate]: { ...existing, isHoliday: payload.active } };
    });
    setVersion((current) => current + 1);
  });

  useAppEventSubscriber(APP_EVENT_TYPES.BOOKING_CANCELLED, (event) => {
    const payload = event.payload as BookingEventPayload;
    if (payload.selectedSlots?.length) {
      applyReleasedSlots(payload.selectedSlots);
    }
  });

  const setInitialSnapshot = useCallback((dateIso: string, snapshot: SlotSnapshot) => {
    setSnapshotsByDate((current) => ({
      ...current,
      [dateIso]: snapshot,
    }));
    setVersion((current) => current + 1);
  }, []);

  const getSnapshot = useCallback(
    (dateIso: string) => snapshotsByDate[dateIso] ?? emptySnapshot(),
    [snapshotsByDate],
  );

  const value = useMemo(
    () => ({
      version,
      getSnapshot,
      setInitialSnapshot,
    }),
    [version, getSnapshot, setInitialSnapshot],
  );

  return <SlotRealtimeContext.Provider value={value}>{children}</SlotRealtimeContext.Provider>;
}

export function useSlotRealtimeContext() {
  const context = useContext(SlotRealtimeContext);
  if (!context) {
    throw new Error("useSlotRealtimeContext must be used within SlotRealtimeProvider");
  }
  return context;
}

export function useRealtimeSlots(dateIso: string | null) {
  const { version, getSnapshot, setInitialSnapshot } = useSlotRealtimeContext();
  const refetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const availabilityQuery = useQuery({
    queryKey: dateIso ? QUERY_KEYS.slots.availability(dateIso) : ["slots", "availability", "none"],
    queryFn: async () => {
      const response = await fetch(`/api/slots/availability?dateIso=${encodeURIComponent(dateIso!)}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        return emptySnapshot();
      }
      return response.json() as Promise<SlotSnapshot>;
    },
    enabled: Boolean(dateIso),
    staleTime: 0,
    gcTime: CACHE_TTL.defaultGc,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!dateIso || !availabilityQuery.data) return;
    setInitialSnapshot(dateIso, {
      bookedSlotIds: availabilityQuery.data.bookedSlotIds ?? [],
      heldSlotIds: availabilityQuery.data.heldSlotIds ?? [],
      blockedSlotIds: availabilityQuery.data.blockedSlotIds ?? [],
      maintenanceSlotIds: availabilityQuery.data.maintenanceSlotIds ?? [],
      isHoliday: Boolean(availabilityQuery.data.isHoliday),
    });
  }, [availabilityQuery.dataUpdatedAt, availabilityQuery.data, dateIso, setInitialSnapshot]);

  const scheduleRefetch = useCallback(() => {
    if (!dateIso) return;
    if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current);
    refetchTimerRef.current = setTimeout(() => {
      void availabilityQuery.refetch();
    }, 350);
  }, [availabilityQuery, dateIso]);

  useEffect(() => {
    return () => {
      if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current);
    };
  }, []);

  const debouncedRefetch = useDebouncedCallback(() => {
    scheduleRefetch();
  }, CACHE_TTL.adminRefreshDebounce);

  useAppEventSubscriber(
    [...SLOT_AVAILABILITY_EVENTS, APP_EVENT_TYPES.BOOKING_CREATED, APP_EVENT_TYPES.BOOKING_MANUAL_CREATED, APP_EVENT_TYPES.BOOKING_CANCELLED],
    (event) => {
      if (!dateIso) return;

      if (event.type === APP_EVENT_TYPES.SLOT_AVAILABILITY_REFRESH) {
        const payload = event.payload as { bookingDate?: string; slotId?: string };
        if (payload.bookingDate === dateIso || (payload.slotId && slotAffectsDate(payload.slotId, dateIso))) {
          scheduleRefetch();
        }
        return;
      }

      if (
        event.type === APP_EVENT_TYPES.SLOT_BOOKED ||
        event.type === APP_EVENT_TYPES.SLOT_RELEASED
      ) {
        scheduleRefetch();
        return;
      }

      const payload = event.payload as BookingEventPayload;
      if (bookingEventAffectsDate(payload, dateIso)) {
        debouncedRefetch();
      }
    },
  );

  const snapshot = dateIso ? getSnapshot(dateIso) : null;

  return {
    bookedSlotIds: snapshot?.bookedSlotIds ?? [],
    heldSlotIds: snapshot?.heldSlotIds ?? [],
    blockedSlotIds: snapshot?.blockedSlotIds ?? [],
    maintenanceSlotIds: snapshot?.maintenanceSlotIds ?? [],
    isHoliday: snapshot?.isHoliday ?? false,
    version,
    hydrated: !dateIso || availabilityQuery.isFetched,
  };
}
