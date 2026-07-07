import type {
  PricingBand,
  PricingOverrideInput,
  PricingOverrideRule,
  PricingPreviewInput,
  PricingRule,
  PricingSnapshot,
} from "@/features/pricing/types/pricing.types";
import { DEFAULT_SLOT_PRICE } from "@/features/pricing/config/pricing.defaults";

function parseBands(value: unknown): PricingBand[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((band) => {
      if (!band || typeof band !== "object") return null;
      const row = band as Record<string, unknown>;
      const startMinute = Number(row.startMinute);
      const endMinute = Number(row.endMinute);
      const price = Number(row.price);
      if (!Number.isFinite(startMinute) || !Number.isFinite(endMinute) || !Number.isFinite(price)) {
        return null;
      }
      return { startMinute, endMinute, price };
    })
    .filter((band): band is PricingBand => band !== null);
}

export function ruleToOverride(rule: PricingRule): PricingOverrideRule | null {
  if (!rule.active) return null;

  if (rule.type === "override") {
    if (rule.bands.length === 0) return null;
    if (!rule.dateStart) return null;
    return {
      id: rule.id,
      name: rule.name?.trim() || "Override rule",
      dateStart: rule.dateStart,
      dateEnd: rule.dateEnd,
      bands: rule.bands,
      active: rule.active,
      createdAt: rule.createdAt,
    };
  }

  if (rule.type === "range" && rule.startMinute !== null && rule.endMinute !== null) {
    return {
      id: rule.id,
      name: rule.name?.trim() || "Legacy override",
      dateStart: rule.dateStart ?? "1970-01-01",
      dateEnd: rule.dateEnd,
      bands: [{ startMinute: rule.startMinute, endMinute: rule.endMinute, price: rule.price }],
      active: rule.active,
      createdAt: rule.createdAt,
    };
  }

  return null;
}

export function isOverrideActiveOnDate(rule: PricingOverrideRule, dateIso: string): boolean {
  if (!rule.active) return false;
  if (dateIso < rule.dateStart) return false;
  if (rule.dateEnd && dateIso > rule.dateEnd) return false;
  return true;
}

export function getOverrideStatus(
  rule: PricingOverrideRule,
  todayIso: string,
): "active" | "scheduled" | "expired" | "inactive" {
  if (!rule.active) return "inactive";
  if (rule.dateEnd && todayIso > rule.dateEnd) return "expired";
  if (todayIso < rule.dateStart) return "scheduled";
  return "active";
}

export function resolveSlotPrice(input: {
  snapshot: PricingSnapshot;
  dateIso: string;
  startMinute: number;
}): number {
  const { snapshot, dateIso, startMinute } = input;

  const applicableOverrides = snapshot.overrides
    .filter((rule) => isOverrideActiveOnDate(rule, dateIso))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  for (const override of applicableOverrides) {
    for (const band of override.bands) {
      if (startMinute >= band.startMinute && startMinute < band.endMinute) {
        return band.price;
      }
    }
  }

  return snapshot.defaultPrice;
}

export function buildPricingSnapshot(rules: PricingRule[]): PricingSnapshot {
  const normalizedRules = Array.isArray(rules) ? rules : [];
  const defaultRule = normalizedRules.find((rule) => rule.type === "default" && rule.active);
  const defaultPrice = defaultRule?.price ?? DEFAULT_SLOT_PRICE;

  const overrides = normalizedRules
    .filter((rule) => rule.type !== "default")
    .map(ruleToOverride)
    .filter((rule): rule is PricingOverrideRule => rule !== null);

  return { defaultPrice, overrides };
}

export function previewPricingSnapshot(
  baseRules: PricingRule[],
  draft: PricingOverrideInput,
): PricingSnapshot {
  const syntheticRule: PricingRule = {
    id: "preview",
    groupId: "preview",
    version: 1,
    type: "override",
    price: draft.bands[0]?.price ?? DEFAULT_SLOT_PRICE,
    name: draft.name,
    bands: draft.bands,
    startMinute: null,
    endMinute: null,
    dateStart: draft.dateStart,
    dateEnd: draft.dateEnd ?? null,
    weekdays: [],
    priority: 0,
    active: true,
    archivedAt: null,
    createdBy: null,
    createdAt: new Date(),
  };

  return buildPricingSnapshot([syntheticRule, ...baseRules]);
}

function validateBand(band: PricingBand, index: number): string | null {
  if (!band.price || band.price <= 0) {
    return `Band ${index + 1}: price must be greater than zero.`;
  }
  if (band.startMinute < 0 || band.endMinute > 24 * 60) {
    return `Band ${index + 1}: time range must be within 00:00–24:00.`;
  }
  if (band.endMinute <= band.startMinute) {
    return `Band ${index + 1}: end time must be after start time.`;
  }
  return null;
}

export function validateOverrideRule(
  input: PricingOverrideInput,
): { ok: true } | { ok: false; error: string } {
  const name = input.name?.trim();
  if (!name) return { ok: false, error: "Rule name is required." };

  if (!input.dateStart || !/^\d{4}-\d{2}-\d{2}$/.test(input.dateStart)) {
    return { ok: false, error: "Valid start date is required." };
  }

  if (input.dateEnd && !/^\d{4}-\d{2}-\d{2}$/.test(input.dateEnd)) {
    return { ok: false, error: "Invalid end date." };
  }

  if (input.dateEnd && input.dateEnd < input.dateStart) {
    return { ok: false, error: "End date must be on or after start date." };
  }

  if (!Array.isArray(input.bands) || input.bands.length === 0) {
    return { ok: false, error: "Add at least one time slot range." };
  }

  for (let index = 0; index < input.bands.length; index += 1) {
    const bandError = validateBand(input.bands[index]!, index);
    if (bandError) return { ok: false, error: bandError };
  }

  return { ok: true };
}

/** @deprecated Legacy range rule validation */
export function validatePricingRule(input: PricingPreviewInput): { ok: true } | { ok: false; error: string } {
  if (!input.price || input.price <= 0) return { ok: false, error: "Price must be greater than zero." };
  if (input.type === "range") {
    if (input.startMinute === null || input.startMinute === undefined) {
      return { ok: false, error: "Start time is required." };
    }
    if (input.endMinute === null || input.endMinute === undefined) {
      return { ok: false, error: "End time is required." };
    }
    const bandError = validateBand(
      { startMinute: input.startMinute, endMinute: input.endMinute, price: input.price },
      0,
    );
    if (bandError) return { ok: false, error: bandError };
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

export { parseBands };
