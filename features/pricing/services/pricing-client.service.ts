"use client";

import type { PricingRule } from "@/features/pricing/types/pricing.types";

function mapPricingRuleDates(rule: PricingRule): PricingRule {
  return {
    ...rule,
    createdAt: new Date((rule as unknown as { createdAt: string }).createdAt),
    archivedAt: (rule as unknown as { archivedAt?: string | null }).archivedAt
      ? new Date((rule as unknown as { archivedAt: string }).archivedAt)
      : null,
  };
}

/** Shared client fetch — must return PricingRule[] for QUERY_KEYS.pricing.active */
export async function fetchActivePricingRules(): Promise<PricingRule[]> {
  const response = await fetch("/api/pricing/active");
  if (!response.ok) return [];

  const data = (await response.json()) as { rules?: PricingRule[] };
  if (!Array.isArray(data.rules)) return [];

  return data.rules.map(mapPricingRuleDates);
}
