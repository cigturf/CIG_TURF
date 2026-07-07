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
  AuditCategory,
  AuditDatePreset,
  AuditDirectoryData,
} from "@/features/audit/types/audit.types";
import { AUDIT_REFRESH_EVENTS } from "@/features/events/constants/event-types";
import { useAppEventSubscriber } from "@/features/events/hooks/use-app-event-subscriber";

type AuditRealtimeContextValue = {
  data: AuditDirectoryData;
  isRefreshing: boolean;
  refresh: (input?: {
    preset?: AuditDatePreset;
    from?: string;
    to?: string;
    category?: AuditCategory | "all";
    search?: string;
  }) => Promise<void>;
  version: number;
};

const AuditRealtimeContext = createContext<AuditRealtimeContextValue | null>(null);

async function fetchAuditData(input?: {
  preset?: AuditDatePreset;
  from?: string;
  to?: string;
  category?: AuditCategory | "all";
  search?: string;
}): Promise<AuditDirectoryData> {
  const params = new URLSearchParams({ preset: input?.preset ?? "last_7_days" });
  if (input?.from) params.set("from", input.from);
  if (input?.to) params.set("to", input.to);
  if (input?.category && input.category !== "all") params.set("category", input.category);
  if (input?.search) params.set("search", input.search);

  const response = await fetch(`/api/admin/audit?${params.toString()}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to refresh audit logs");
  return response.json() as Promise<AuditDirectoryData>;
}

export function AuditRealtimeProvider({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData: AuditDirectoryData;
}) {
  const [data, setData] = useState(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState<{
    preset?: AuditDatePreset;
    from?: string;
    to?: string;
    category?: AuditCategory | "all";
    search?: string;
  }>({});

  const refresh = useCallback(
    async (input?: {
      preset?: AuditDatePreset;
      from?: string;
      to?: string;
      category?: AuditCategory | "all";
      search?: string;
    }) => {
      const nextQuery = input ?? query;
      if (input) setQuery(nextQuery);
      setIsRefreshing(true);
      try {
        const next = await fetchAuditData({
          preset: nextQuery.preset ?? data.range.preset,
          from: nextQuery.from ?? (data.range.preset === "custom" ? data.range.from : undefined),
          to: nextQuery.to ?? (data.range.preset === "custom" ? data.range.to : undefined),
          category: nextQuery.category,
          search: nextQuery.search,
        });
        setData(next);
        setVersion((current) => current + 1);
      } finally {
        setIsRefreshing(false);
      }
    },
    [data.range.from, data.range.preset, data.range.to, query],
  );

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useAppEventSubscriber(AUDIT_REFRESH_EVENTS, () => {
    void refresh();
  });

  const value = useMemo(
    () => ({ data, isRefreshing, refresh, version }),
    [data, isRefreshing, refresh, version],
  );

  return <AuditRealtimeContext.Provider value={value}>{children}</AuditRealtimeContext.Provider>;
}

export function useAuditRealtime() {
  const context = useContext(AuditRealtimeContext);
  if (!context) throw new Error("useAuditRealtime must be used within AuditRealtimeProvider");
  return context;
}
