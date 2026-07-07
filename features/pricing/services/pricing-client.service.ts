"use client";

import type { PricingRule } from "@/features/pricing/types/pricing.types";
import { parseBands } from "@/features/pricing/services/pricing-engine.service";

function mapPricingRuleDates(rule: PricingRule): PricingRule {
  const raw = rule as unknown as {
    createdAt: string;
    archivedAt?: string | null;
    bands?: unknown;
  };

  return {
    ...rule,
    bands: parseBands(raw.bands ?? rule.bands),
    createdAt: new Date(raw.createdAt),
    archivedAt: raw.archivedAt ? new Date(raw.archivedAt) : null,
  };
}

/** Shared client fetch — must return PricingRule[] for QUERY_KEYS.pricing.active */
export async function fetchActivePricingRules(): Promise<PricingRule[]> {
  const response = await fetch("/api/pricing/active", { cache: "no-store" });
  if (!response.ok) return [];

  const data = (await response.json()) as { rules?: PricingRule[] };
  if (!Array.isArray(data.rules)) return [];

  return data.rules.map(mapPricingRuleDates);
}

/** Admin fetch — all rules including inactive, no HTTP cache */
export async function fetchAdminPricingRules(): Promise<PricingRule[]> {
  const response = await fetch("/api/admin/pricing", { cache: "no-store" });
  if (!response.ok) return [];

  const data = (await response.json()) as { rules?: PricingRule[] };
  if (!Array.isArray(data.rules)) return [];

  return data.rules.map(mapPricingRuleDates);
}
