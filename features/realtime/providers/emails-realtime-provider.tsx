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

import type { EmailDirectoryData } from "@/features/admin/emails/types/admin-emails.types";
import { usePostgresChanges } from "@/features/realtime/hooks/use-postgres-changes";

type EmailsRealtimeContextValue = {
  data: EmailDirectoryData;
  isRefreshing: boolean;
  refresh: (search?: string) => Promise<void>;
  version: number;
};

const EmailsRealtimeContext = createContext<EmailsRealtimeContextValue | null>(null);

async function fetchEmailData(search?: string): Promise<EmailDirectoryData> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  const response = await fetch(`/api/admin/emails?${params.toString()}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to refresh email logs");
  return response.json() as Promise<EmailDirectoryData>;
}

export function EmailsRealtimeProvider({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData: EmailDirectoryData;
}) {
  const [data, setData] = useState(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [version, setVersion] = useState(0);
  const [search, setSearch] = useState<string | undefined>();

  const refresh = useCallback(async (nextSearch?: string) => {
    if (nextSearch !== undefined) setSearch(nextSearch);
    setIsRefreshing(true);
    try {
      const next = await fetchEmailData(nextSearch ?? search);
      setData(next);
      setVersion((current) => current + 1);
    } finally {
      setIsRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  usePostgresChanges({
    table: "email_logs",
    onChange: () => {
      void refresh();
    },
  });

  const value = useMemo(
    () => ({ data, isRefreshing, refresh, version }),
    [data, isRefreshing, refresh, version],
  );

  return <EmailsRealtimeContext.Provider value={value}>{children}</EmailsRealtimeContext.Provider>;
}

export function useEmailsRealtime() {
  const context = useContext(EmailsRealtimeContext);
  if (!context) throw new Error("useEmailsRealtime must be used within EmailsRealtimeProvider");
  return context;
}
