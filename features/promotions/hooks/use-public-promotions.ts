"use client";

import { useQuery } from "@tanstack/react-query";

import { CACHE_TTL } from "@/config/cache.config";
import { QUERY_KEYS } from "@/config/query-keys.config";
import type { PromotionDisplayLocation, PromotionPublic } from "@/features/promotions/types";
import { APP_EVENT_TYPES } from "@/features/events/constants/event-types";
import { useAppEventSubscriber } from "@/features/events/hooks/use-app-event-subscriber";
import { useCallback } from "react";

export function usePublicPromotions(location?: PromotionDisplayLocation) {
  const query = useQuery({
    queryKey: QUERY_KEYS.promotions.public(location),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (location) params.set("location", location);
      const res = await fetch(`/api/promotions/public?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load promotions");
      const data = (await res.json()) as { promotions: PromotionPublic[] };
      return data.promotions;
    },
    staleTime: CACHE_TTL.publicPromotions,
    gcTime: CACHE_TTL.defaultGc,
  });

  const invalidate = useCallback(() => {
    void query.refetch();
  }, [query]);

  useAppEventSubscriber(APP_EVENT_TYPES.PROMOTION_CREATED, invalidate);
  useAppEventSubscriber(APP_EVENT_TYPES.PROMOTION_UPDATED, invalidate);
  useAppEventSubscriber(APP_EVENT_TYPES.PROMOTION_PUBLISHED, invalidate);
  useAppEventSubscriber(APP_EVENT_TYPES.PROMOTION_EXPIRED, invalidate);
  useAppEventSubscriber(APP_EVENT_TYPES.PROMOTION_DELETED, invalidate);
  useAppEventSubscriber(APP_EVENT_TYPES.ANNOUNCEMENT_UPDATED, invalidate);

  return query;
}

export function useAnnouncementBar() {
  const query = useQuery({
    queryKey: QUERY_KEYS.promotions.announcement,
    queryFn: async () => {
      const res = await fetch("/api/promotions/public?announcement=true");
      if (!res.ok) throw new Error("Failed to load announcement");
      const data = (await res.json()) as { announcement: PromotionPublic | null };
      return data.announcement;
    },
    staleTime: CACHE_TTL.publicPromotions,
    gcTime: CACHE_TTL.defaultGc,
  });

  const invalidate = useCallback(() => {
    void query.refetch();
  }, [query]);

  useAppEventSubscriber(APP_EVENT_TYPES.ANNOUNCEMENT_UPDATED, invalidate);
  useAppEventSubscriber(APP_EVENT_TYPES.PROMOTION_UPDATED, invalidate);
  useAppEventSubscriber(APP_EVENT_TYPES.PROMOTION_PUBLISHED, invalidate);

  return query;
}
