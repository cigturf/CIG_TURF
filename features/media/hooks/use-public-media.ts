"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { CACHE_TTL } from "@/config/cache.config";
import { QUERY_KEYS } from "@/config/query-keys.config";
import { MEDIA_REFRESH_EVENTS } from "@/features/events/constants/event-types";
import { useAppEventSubscriber } from "@/features/events/hooks/use-app-event-subscriber";
import type { MediaAssetPublic, MediaCategory } from "@/features/media/types";

export function usePublicMedia(category?: MediaCategory) {
  const queryClient = useQueryClient();

  useAppEventSubscriber(MEDIA_REFRESH_EVENTS, () => {
    void queryClient.invalidateQueries({ queryKey: ["public", "media"] });
  });

  // Refetch when user returns to the tab after uploading in admin.
  useEffect(() => {
    const onFocus = () => {
      void queryClient.invalidateQueries({ queryKey: ["public", "media"] });
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [queryClient]);

  return useQuery({
    queryKey: QUERY_KEYS.media.public(category),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      const res = await fetch(`/api/media/public?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load media");
      const data = (await res.json()) as { assets: MediaAssetPublic[] };
      return data.assets;
    },
    staleTime: CACHE_TTL.publicMedia,
    gcTime: CACHE_TTL.defaultGc,
  });
}
