"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  AdminBookingDetail,
  AdminBookingListQuery,
  AdminBookingListResponse,
  AdminBookingRecord,
} from "@/features/admin/bookings/types/admin-booking.types";
import { DEFAULT_ADMIN_BOOKINGS_QUERY } from "@/features/admin/bookings/lib/booking-filters";
import {
  normalizeAdminBookingDetail,
  normalizeAdminBookingRecord,
} from "@/features/admin/bookings/lib/booking-utils";
import { BOOKING_EVENTS } from "@/features/events/constants/event-types";
import { useAppEventSubscriber } from "@/features/events/hooks/use-app-event-subscriber";
import { useDebouncedCallback } from "@/lib/performance/use-debounced-callback";
import { CACHE_TTL } from "@/config/cache.config";

type BookingsRealtimeContextValue = {
  bookings: AdminBookingRecord[];
  total: number;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
  version: number;
  selectedBookingId: string | null;
  setSelectedBookingId: (id: string | null) => void;
  selectedDetail: AdminBookingDetail | null;
  isDetailLoading: boolean;
  refreshDetail: () => Promise<void>;
  query: AdminBookingListQuery;
  setQuery: (query: AdminBookingListQuery) => void;
};

const BookingsRealtimeContext = createContext<BookingsRealtimeContextValue | null>(null);

function buildQueryString(query: AdminBookingListQuery) {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.dateFilter) params.set("dateFilter", query.dateFilter);
  if (query.customDate) params.set("customDate", query.customDate);
  if (query.sort) params.set("sort", query.sort);
  query.status?.forEach((value) => params.append("status", value));
  query.source?.forEach((value) => params.append("source", value));
  return params.toString();
}

async function fetchBookings(query: AdminBookingListQuery): Promise<AdminBookingListResponse> {
  const qs = buildQueryString(query);
  const response = await fetch(`/api/admin/bookings${qs ? `?${qs}` : ""}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load bookings");
  const data = (await response.json()) as AdminBookingListResponse;
  return {
    ...data,
    bookings: data.bookings.map((booking) =>
      normalizeAdminBookingRecord(
        booking as AdminBookingRecord & { createdAt: Date | string; updatedAt: Date | string },
      ),
    ),
  };
}

async function fetchBookingDetail(id: string): Promise<AdminBookingDetail> {
  const response = await fetch(`/api/admin/bookings/${id}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load booking");
  const detail = (await response.json()) as AdminBookingDetail;
  return normalizeAdminBookingDetail(
    detail as AdminBookingDetail & {
      createdAt: Date | string;
      updatedAt: Date | string;
      payments: Array<{ createdAt: Date | string }>;
    },
  );
}

export function BookingsRealtimeProvider({
  children,
  initialData,
  initialQuery = DEFAULT_ADMIN_BOOKINGS_QUERY,
  initialSelectedId = null,
}: {
  children: ReactNode;
  initialData: AdminBookingListResponse;
  initialQuery?: AdminBookingListQuery;
  initialSelectedId?: string | null;
}) {
  const [query, setQuery] = useState<AdminBookingListQuery>(initialQuery);
  const [hasHydratedFromServer, setHasHydratedFromServer] = useState(true);
  const [bookings, setBookings] = useState(() =>
    initialData.bookings.map((booking) =>
      normalizeAdminBookingRecord(
        booking as AdminBookingRecord & { createdAt: Date | string; updatedAt: Date | string },
      ),
    ),
  );
  const [total, setTotal] = useState(initialData.total);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [version, setVersion] = useState(0);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(initialSelectedId);
  const [selectedDetail, setSelectedDetail] = useState<AdminBookingDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const next = await fetchBookings(query);
      setBookings(next.bookings);
      setTotal(next.total);
      setVersion((current) => current + 1);
    } finally {
      setIsRefreshing(false);
    }
  }, [query]);

  const refreshDetail = useCallback(async () => {
    if (!selectedBookingId) {
      setSelectedDetail(null);
      return;
    }

    setIsDetailLoading(true);
    try {
      const detail = await fetchBookingDetail(selectedBookingId);
      setSelectedDetail(detail);
    } catch {
      setSelectedDetail(null);
    } finally {
      setIsDetailLoading(false);
    }
  }, [selectedBookingId]);

  useEffect(() => {
    if (hasHydratedFromServer) {
      setHasHydratedFromServer(false);
      return;
    }
    void refresh();
  }, [refresh, hasHydratedFromServer]);

  const debouncedRefresh = useDebouncedCallback(() => {
    void refresh();
    if (selectedBookingId) void refreshDetail();
  }, CACHE_TTL.adminRefreshDebounce);

  useEffect(() => {
    void refreshDetail();
  }, [refreshDetail, selectedBookingId]);

  useAppEventSubscriber(BOOKING_EVENTS, debouncedRefresh);

  const value = useMemo(
    () => ({
      bookings,
      total,
      isRefreshing,
      refresh,
      version,
      selectedBookingId,
      setSelectedBookingId,
      selectedDetail,
      isDetailLoading,
      refreshDetail,
      query,
      setQuery,
    }),
    [
      bookings,
      total,
      isRefreshing,
      refresh,
      version,
      selectedBookingId,
      selectedDetail,
      isDetailLoading,
      refreshDetail,
      query,
    ],
  );

  return (
    <BookingsRealtimeContext.Provider value={value}>{children}</BookingsRealtimeContext.Provider>
  );
}

export function useAdminBookings() {
  const context = useContext(BookingsRealtimeContext);
  if (!context) {
    throw new Error("useAdminBookings must be used within BookingsRealtimeProvider");
  }
  return context;
}
