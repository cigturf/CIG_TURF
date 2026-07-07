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

import type { AdminDashboardData } from "@/features/admin/dashboard/types/dashboard.types";
import { CACHE_TTL } from "@/config/cache.config";
import { DASHBOARD_REFRESH_EVENTS } from "@/features/events/constants/event-types";
import { useAppEventSubscriber } from "@/features/events/hooks/use-app-event-subscriber";
import { useDebouncedCallback } from "@/lib/performance/use-debounced-callback";

type DashboardRealtimeContextValue = {
  data: AdminDashboardData;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
  version: number;
};

const DashboardRealtimeContext = createContext<DashboardRealtimeContextValue | null>(null);

async function fetchDashboardData(): Promise<AdminDashboardData> {
  const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to refresh dashboard");
  }
  return response.json() as Promise<AdminDashboardData>;
}

export function DashboardRealtimeProvider({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData: AdminDashboardData;
}) {
  const [data, setData] = useState(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const next = await fetchDashboardData();
      setData(next);
      setVersion((current) => current + 1);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const debouncedRefresh = useDebouncedCallback(() => {
    void refresh();
  }, CACHE_TTL.adminRefreshDebounce);

  useAppEventSubscriber(DASHBOARD_REFRESH_EVENTS, debouncedRefresh);

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
    <DashboardRealtimeContext.Provider value={value}>{children}</DashboardRealtimeContext.Provider>
  );
}

export function useRealtimeDashboard() {
  const context = useContext(DashboardRealtimeContext);
  if (!context) {
    throw new Error("useRealtimeDashboard must be used within DashboardRealtimeProvider");
  }
  return context;
}
