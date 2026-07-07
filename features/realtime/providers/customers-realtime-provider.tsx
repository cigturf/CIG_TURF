"use client";

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
import type {
  CustomerDirectoryData,
  CustomerFilter,
} from "@/features/admin/customers/types/customer.types";
import { CUSTOMERS_REFRESH_EVENTS } from "@/features/events/constants/event-types";
import { useAppEventSubscriber } from "@/features/events/hooks/use-app-event-subscriber";
import { debounce } from "@/lib/performance";

type CustomersRealtimeContextValue = {
  data: CustomerDirectoryData;
  isRefreshing: boolean;
  refresh: (input?: { search?: string; filter?: CustomerFilter }) => Promise<void>;
  version: number;
};

const CustomersRealtimeContext = createContext<CustomersRealtimeContextValue | null>(null);

async function fetchCustomersData(input?: {
  search?: string;
  filter?: CustomerFilter;
}): Promise<CustomerDirectoryData> {
  const params = new URLSearchParams();
  if (input?.search) params.set("search", input.search);
  if (input?.filter && input.filter !== "all") params.set("filter", input.filter);

  const response = await fetch(`/api/admin/customers?${params.toString()}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to refresh customers");
  }
  return response.json() as Promise<CustomerDirectoryData>;
}

export function CustomersRealtimeProvider({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData: CustomerDirectoryData;
}) {
  const [data, setData] = useState(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState<{ search?: string; filter?: CustomerFilter }>({});

  const refresh = useCallback(
    async (input?: { search?: string; filter?: CustomerFilter }) => {
      const nextQuery = input ?? query;
      if (input) setQuery(nextQuery);
      setIsRefreshing(true);
      try {
        const next = await fetchCustomersData(nextQuery);
        setData(next);
        setVersion((current) => current + 1);
      } finally {
        setIsRefreshing(false);
      }
    },
    [query],
  );

  const debouncedRefreshRef = useRef(
    debounce((refreshFn: () => void) => {
      refreshFn();
    }, CACHE_TTL.adminRefreshDebounce),
  );

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useAppEventSubscriber(CUSTOMERS_REFRESH_EVENTS, () => {
    debouncedRefreshRef.current(() => {
      void refresh();
    });
  });

  const value = useMemo(
    () => ({
      data,
      isRefreshing,
      refresh,
      version,
    }),
    [data, isRefreshing, refresh, version],
  );

  return (
    <CustomersRealtimeContext.Provider value={value}>{children}</CustomersRealtimeContext.Provider>
  );
}

export function useCustomersRealtime() {
  const context = useContext(CustomersRealtimeContext);
  if (!context) {
    throw new Error("useCustomersRealtime must be used within CustomersRealtimeProvider");
  }
  return context;
}
