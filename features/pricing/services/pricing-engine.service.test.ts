import { describe, expect, it } from "vitest";

import { DEFAULT_SLOT_PRICE } from "@/features/pricing/config/pricing.defaults";
import {
  buildPricingSnapshot,
  resolveSlotPrice,
} from "@/features/pricing/services/pricing-engine.service";
import type { PricingRule } from "@/features/pricing/types/pricing.types";

function makeRule(overrides: Partial<PricingRule> & Pick<PricingRule, "id" | "type" | "price">): PricingRule {
  return {
    groupId: overrides.id,
    version: 1,
    startMinute: null,
    endMinute: null,
    dateStart: null,
    dateEnd: null,
    weekdays: [],
    priority: 0,
    active: true,
    archivedAt: null,
    createdBy: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

describe("pricing engine", () => {
  it("uses DEFAULT_SLOT_PRICE when no default rule exists", () => {
    const snapshot = buildPricingSnapshot([]);
    expect(snapshot.defaultPrice).toBe(DEFAULT_SLOT_PRICE);
    expect(DEFAULT_SLOT_PRICE).toBe(450);
  });

  it("treats non-array rules as empty", () => {
    const snapshot = buildPricingSnapshot({} as never);
    expect(snapshot.defaultPrice).toBe(DEFAULT_SLOT_PRICE);
    expect(snapshot.rules).toEqual([]);
  });

  it("uses default rule price for unmatched slots", () => {
    const snapshot = buildPricingSnapshot([
      makeRule({ id: "default", type: "default", price: 500 }),
    ]);

    expect(
      resolveSlotPrice({
        snapshot,
        dateIso: "2026-07-07",
        startMinute: 600,
      }),
    ).toBe(500);
  });

  it("uses override rule price when a range rule matches", () => {
    const snapshot = buildPricingSnapshot([
      makeRule({ id: "default", type: "default", price: 450 }),
      makeRule({
        id: "morning",
        type: "range",
        price: 700,
        startMinute: 6 * 60,
        endMinute: 9 * 60,
        priority: 10,
      }),
    ]);

    expect(
      resolveSlotPrice({
        snapshot,
        dateIso: "2026-07-07",
        startMinute: 7 * 60,
      }),
    ).toBe(700);

    expect(
      resolveSlotPrice({
        snapshot,
        dateIso: "2026-07-07",
        startMinute: 10 * 60,
      }),
    ).toBe(450);
  });
});
