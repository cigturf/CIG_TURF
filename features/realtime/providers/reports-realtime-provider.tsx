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

import type { ReportDatePreset, ReportsAnalyticsData } from "@/features/admin/reports/types/reports.types";
import { CACHE_TTL } from "@/config/cache.config";
import { REPORTS_REFRESH_EVENTS } from "@/features/events/constants/event-types";
import { useAppEventSubscriber } from "@/features/events/hooks/use-app-event-subscriber";
import { useDebouncedCallback } from "@/lib/performance/use-debounced-callback";

type ReportsRealtimeContextValue = {
  data: ReportsAnalyticsData;
  isRefreshing: boolean;
  refresh: (input?: {
    preset?: ReportDatePreset;
    from?: string;
    to?: string;
  }) => Promise<void>;
  version: number;
};

const ReportsRealtimeContext = createContext<ReportsRealtimeContextValue | null>(null);

async function fetchReportsData(input?: {
  preset?: ReportDatePreset;
  from?: string;
  to?: string;
}): Promise<ReportsAnalyticsData> {
  const params = new URLSearchParams({ preset: input?.preset ?? "last_7_days" });
  if (input?.from) params.set("from", input.from);
  if (input?.to) params.set("to", input.to);

  const response = await fetch(`/api/admin/reports?${params.toString()}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to refresh reports");
  }
  return response.json() as Promise<ReportsAnalyticsData>;
}

export function ReportsRealtimeProvider({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData: ReportsAnalyticsData;
}) {
  const [data, setData] = useState(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(
    async (input?: { preset?: ReportDatePreset; from?: string; to?: string }) => {
      setIsRefreshing(true);
      try {
        const next = await fetchReportsData({
          preset: input?.preset ?? data.range.preset,
          from: input?.from ?? (data.range.preset === "custom" ? data.range.from : undefined),
          to: input?.to ?? (data.range.preset === "custom" ? data.range.to : undefined),
        });
        setData(next);
        setVersion((current) => current + 1);
      } finally {
        setIsRefreshing(false);
      }
    },
    [data.range.from, data.range.preset, data.range.to],
  );

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const debouncedRefresh = useDebouncedCallback(() => {
    void refresh();
  }, CACHE_TTL.adminRefreshDebounce);

  useAppEventSubscriber(REPORTS_REFRESH_EVENTS, debouncedRefresh);

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
    <ReportsRealtimeContext.Provider value={value}>{children}</ReportsRealtimeContext.Provider>
  );
}

export function useReportsRealtime() {
  const context = useContext(ReportsRealtimeContext);
  if (!context) {
    throw new Error("useReportsRealtime must be used within ReportsRealtimeProvider");
  }
  return context;
}
