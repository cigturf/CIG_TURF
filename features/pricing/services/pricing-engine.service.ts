import type { PricingPreviewInput, PricingRule, PricingSnapshot } from "@/features/pricing/types/pricing.types";
import { DEFAULT_SLOT_PRICE } from "@/features/pricing/config/pricing.defaults";

function weekdayOf(dateIso: string): number {
  return new Date(`${dateIso}T12:00:00`).getDay();
}

export function isRuleApplicable(rule: PricingRule, dateIso: string, startMinute: number): boolean {
  if (!rule.active) return false;

  // Date filtering
  if (rule.dateStart && dateIso < rule.dateStart) return false;
  if (rule.dateEnd && dateIso > rule.dateEnd) return false;

  // Weekday filtering
  if (rule.weekdays.length > 0) {
    const weekday = weekdayOf(dateIso);
    if (!rule.weekdays.includes(weekday)) return false;
  }

  // Time filtering (range rules)
  if (rule.type === "range") {
    if (rule.startMinute === null || rule.endMinute === null) return false;
    return startMinute >= rule.startMinute && startMinute < rule.endMinute;
  }

  // Default rule always applies
  return rule.type === "default";
}

export function resolveSlotPrice(input: {
  snapshot: PricingSnapshot;
  dateIso: string;
  startMinute: number;
}): number {
  const { snapshot, dateIso, startMinute } = input;

  // Deterministic priority:
  // - Specific date (dateStart==dateEnd==dateIso) beats range dates beats weekday beats default
  // - Then explicit priority number
  // - Then createdAt (handled by repository ordering) as tie-breaker

  const candidates = snapshot.rules.filter((rule) => isRuleApplicable(rule, dateIso, startMinute));
  if (candidates.length === 0) return snapshot.defaultPrice;

  const scored = candidates.map((rule) => {
    const specificDate =
      rule.dateStart && rule.dateEnd && rule.dateStart === rule.dateEnd && rule.dateStart === dateIso;
    const hasDateRange = Boolean(rule.dateStart || rule.dateEnd);
    const hasWeekdays = rule.weekdays.length > 0;

    const specificity = specificDate ? 3 : hasDateRange ? 2 : hasWeekdays ? 1 : 0;
    return { rule, specificity };
  });

  scored.sort((a, b) => {
    if (b.specificity !== a.specificity) return b.specificity - a.specificity;
    if (b.rule.priority !== a.rule.priority) return b.rule.priority - a.rule.priority;
    // stable order already applied from repo (created_at desc), keep original
    return 0;
  });

  return scored[0]!.rule.price;
}

export function buildPricingSnapshot(rules: PricingRule[]): PricingSnapshot {
  const normalizedRules = Array.isArray(rules) ? rules : [];
  const defaultRule = normalizedRules.find((rule) => rule.type === "default" && rule.active);
  const defaultPrice = defaultRule?.price ?? DEFAULT_SLOT_PRICE;
  const nonDefault = normalizedRules.filter((rule) => rule.type !== "default" && rule.active);
  return { defaultPrice, rules: nonDefault };
}

export function previewPricingSnapshot(baseRules: PricingRule[], draft: PricingPreviewInput): PricingSnapshot {
  const synthetic: PricingRule = {
    id: "preview",
    groupId: "preview",
    version: 1,
    type: draft.type,
    price: draft.price,
    startMinute: draft.startMinute ?? null,
    endMinute: draft.endMinute ?? null,
    dateStart: draft.dateStart ?? null,
    dateEnd: draft.dateEnd ?? null,
    weekdays: draft.weekdays ?? [],
    priority: draft.priority ?? 0,
    active: true,
    archivedAt: null,
    createdBy: null,
    createdAt: new Date(),
  };

  return buildPricingSnapshot([synthetic, ...baseRules]);
}

export function validatePricingRule(input: PricingPreviewInput): { ok: true } | { ok: false; error: string } {
  if (!input.price || input.price <= 0) return { ok: false, error: "Price must be greater than zero." };
  if (input.type === "range") {
    if (input.startMinute === null || input.startMinute === undefined) {
      return { ok: false, error: "Start time is required." };
    }
    if (input.endMinute === null || input.endMinute === undefined) {
      return { ok: false, error: "End time is required." };
    }
    if (input.startMinute < 0 || input.endMinute > 24 * 60) {
      return { ok: false, error: "Time range must be within 00:00–24:00." };
    }
    if (input.endMinute <= input.startMinute) {
      return { ok: false, error: "End time must be after start time." };
    }
  }
  if (input.dateStart && !/^\d{4}-\d{2}-\d{2}$/.test(input.dateStart)) {
    return { ok: false, error: "Invalid start date." };
  }
  if (input.dateEnd && !/^\d{4}-\d{2}-\d{2}$/.test(input.dateEnd)) {
    return { ok: false, error: "Invalid end date." };
  }
  if (input.dateStart && input.dateEnd && input.dateEnd < input.dateStart) {
    return { ok: false, error: "Date range is invalid." };
  }
  return { ok: true };
}

