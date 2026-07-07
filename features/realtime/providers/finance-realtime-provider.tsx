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

import type { FinanceDashboardData } from "@/features/admin/finance/types/finance.types";
import { CACHE_TTL } from "@/config/cache.config";
import { FINANCE_REFRESH_EVENTS } from "@/features/events/constants/event-types";
import { useAppEventSubscriber } from "@/features/events/hooks/use-app-event-subscriber";
import { useDebouncedCallback } from "@/lib/performance/use-debounced-callback";
import type { ReportDatePreset } from "@/features/admin/reports/types/reports.types";

type FinanceRealtimeContextValue = {
  data: FinanceDashboardData;
  isRefreshing: boolean;
  refresh: (input?: {
    preset?: ReportDatePreset;
    from?: string;
    to?: string;
    closingDate?: string;
  }) => Promise<void>;
  version: number;
};

const FinanceRealtimeContext = createContext<FinanceRealtimeContextValue | null>(null);

async function fetchFinanceData(input?: {
  preset?: ReportDatePreset;
  from?: string;
  to?: string;
  closingDate?: string;
}): Promise<FinanceDashboardData> {
  const params = new URLSearchParams({ preset: input?.preset ?? "last_7_days" });
  if (input?.from) params.set("from", input.from);
  if (input?.to) params.set("to", input.to);
  if (input?.closingDate) params.set("closingDate", input.closingDate);

  const response = await fetch(`/api/admin/finance?${params.toString()}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to refresh finance dashboard");
  }
  return response.json() as Promise<FinanceDashboardData>;
}

export function FinanceRealtimeProvider({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData: FinanceDashboardData;
}) {
  const [data, setData] = useState(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(
    async (input?: {
      preset?: ReportDatePreset;
      from?: string;
      to?: string;
      closingDate?: string;
    }) => {
      setIsRefreshing(true);
      try {
        const next = await fetchFinanceData({
          preset: input?.preset ?? data.range.preset,
          from: input?.from ?? (data.range.preset === "custom" ? data.range.from : undefined),
          to: input?.to ?? (data.range.preset === "custom" ? data.range.to : undefined),
          closingDate: input?.closingDate ?? data.dailyClosing.date,
        });
        setData(next);
        setVersion((current) => current + 1);
      } finally {
        setIsRefreshing(false);
      }
    },
    [data.dailyClosing.date, data.range.from, data.range.preset, data.range.to],
  );

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const debouncedRefresh = useDebouncedCallback(() => {
    void refresh();
  }, CACHE_TTL.adminRefreshDebounce);

  useAppEventSubscriber(FINANCE_REFRESH_EVENTS, debouncedRefresh);

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
    <FinanceRealtimeContext.Provider value={value}>{children}</FinanceRealtimeContext.Provider>
  );
}

export function useFinanceRealtime() {
  const context = useContext(FinanceRealtimeContext);
  if (!context) {
    throw new Error("useFinanceRealtime must be used within FinanceRealtimeProvider");
  }
  return context;
}
