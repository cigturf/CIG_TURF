"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { QUERY_KEYS } from "@/config/query-keys.config";
import { APP_EVENT_TYPES } from "@/features/events/constants/event-types";
import { useAppEventSubscriber } from "@/features/events/hooks/use-app-event-subscriber";

export function useRealtimeBusinessSettings() {
  const queryClient = useQueryClient();

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.businessSettings.public });
  }, [queryClient]);

  useAppEventSubscriber(APP_EVENT_TYPES.BUSINESS_UPDATED, invalidate);

  return { invalidate };
}

export function BusinessSettingsRealtimeProvider({ children }: { children: React.ReactNode }) {
  useRealtimeBusinessSettings();
  return children;
}
