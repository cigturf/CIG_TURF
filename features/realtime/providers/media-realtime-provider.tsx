"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { QUERY_KEYS } from "@/config/query-keys.config";
import { MEDIA_REFRESH_EVENTS } from "@/features/events/constants/event-types";
import { useAppEventSubscriber } from "@/features/events/hooks/use-app-event-subscriber";

const MEDIA_QUERY_KEY = ["admin", "media"];

export function useRealtimeMedia() {
  const queryClient = useQueryClient();

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: MEDIA_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: ["public", "media"] });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.media.public() });
  }, [queryClient]);

  useAppEventSubscriber(MEDIA_REFRESH_EVENTS, invalidate);

  return { invalidate };
}

export function MediaRealtimeProvider({ children }: { children: React.ReactNode }) {
  useRealtimeMedia();
  return children;
}

