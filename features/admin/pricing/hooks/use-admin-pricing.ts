"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { QUERY_KEYS } from "@/config/query-keys.config";
import { fetchAdminPricingRules } from "@/features/pricing/services/pricing-client.service";
import { buildPricingSnapshot } from "@/features/pricing/services/pricing-engine.service";
import type { PricingRule, PricingSnapshot } from "@/features/pricing/types/pricing.types";
import {
  APP_EVENT_TYPES,
} from "@/features/events/constants/event-types";
import { useAppEventSubscriber } from "@/features/events/hooks/use-app-event-subscriber";

export function useAdminPricing() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEYS.pricing.admin,
    queryFn: fetchAdminPricingRules,
    staleTime: 0,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pricing.admin });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pricing.active });
  };

  useAppEventSubscriber(
    [
      APP_EVENT_TYPES.PRICING_CREATED,
      APP_EVENT_TYPES.PRICING_UPDATED,
      APP_EVENT_TYPES.PRICING_DELETED,
      APP_EVENT_TYPES.PRICING_ACTIVATED,
      APP_EVENT_TYPES.PRICING_DEACTIVATED,
    ],
    invalidate,
  );

  const rules = query.data ?? [];

  const snapshot: PricingSnapshot = useMemo(
    () => buildPricingSnapshot(rules.filter((rule) => rule.active)),
    [rules],
  );

  const overrideRules: PricingRule[] = useMemo(
    () => rules.filter((rule) => rule.type === "override" || rule.type === "range"),
    [rules],
  );

  return {
    rules,
    snapshot,
    overrideRules,
    hydrated: query.isFetched,
    isFetching: query.isFetching,
    invalidate,
  };
}
