"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { CACHE_TTL } from "@/config/cache.config";
import { QUERY_KEYS } from "@/config/query-keys.config";
import { fetchActivePricingRules } from "@/features/pricing/services/pricing-client.service";
import type { PricingSnapshot } from "@/features/pricing/types/pricing.types";
import { buildPricingSnapshot } from "@/features/pricing/services/pricing-engine.service";
import {
  APP_EVENT_TYPES,
} from "@/features/events/constants/event-types";
import { useAppEventSubscriber } from "@/features/events/hooks/use-app-event-subscriber";

export function useRealtimePricing() {
  const query = useQuery({
    queryKey: QUERY_KEYS.pricing.active,
    queryFn: fetchActivePricingRules,
    staleTime: CACHE_TTL.pricing,
    gcTime: CACHE_TTL.defaultGc,
  });

  useAppEventSubscriber(
    [
      APP_EVENT_TYPES.PRICING_CREATED,
      APP_EVENT_TYPES.PRICING_UPDATED,
      APP_EVENT_TYPES.PRICING_DELETED,
      APP_EVENT_TYPES.PRICING_ACTIVATED,
      APP_EVENT_TYPES.PRICING_DEACTIVATED,
    ],
    () => {
      void query.refetch();
    },
  );

  const snapshot: PricingSnapshot = useMemo(
    () => buildPricingSnapshot(query.data ?? []),
    [query.data],
  );

  return {
    rules: query.data ?? [],
    snapshot,
    hydrated: query.isFetched,
  };
}
