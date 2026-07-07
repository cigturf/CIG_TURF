import { describe, expect, it } from "vitest";

import { DEFAULT_SLOT_PRICE } from "@/features/pricing/config/pricing.defaults";
import {
  buildPricingSnapshot,
  getOverrideStatus,
  isOverrideActiveOnDate,
  resolveSlotPrice,
} from "@/features/pricing/services/pricing-engine.service";
import type { PricingRule } from "@/features/pricing/types/pricing.types";

function makeRule(overrides: Partial<PricingRule> & Pick<PricingRule, "id" | "type" | "price">): PricingRule {
  return {
    groupId: overrides.id,
    version: 1,
    name: null,
    bands: [],
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
    expect(snapshot.overrides).toEqual([]);
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

  it("uses override band price when date and time match", () => {
    const snapshot = buildPricingSnapshot([
      makeRule({ id: "default", type: "default", price: 450 }),
      makeRule({
        id: "summer",
        type: "override",
        price: 700,
        name: "Summer mornings",
        dateStart: "2026-07-01",
        dateEnd: "2026-08-31",
        bands: [
          { startMinute: 6 * 60, endMinute: 9 * 60, price: 700 },
          { startMinute: 18 * 60, endMinute: 22 * 60, price: 900 },
        ],
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
        startMinute: 19 * 60,
      }),
    ).toBe(900);

    expect(
      resolveSlotPrice({
        snapshot,
        dateIso: "2026-07-07",
        startMinute: 10 * 60,
      }),
    ).toBe(450);
  });

  it("falls back to default after override end date", () => {
    const snapshot = buildPricingSnapshot([
      makeRule({ id: "default", type: "default", price: 450 }),
      makeRule({
        id: "promo",
        type: "override",
        price: 600,
        name: "Promo week",
        dateStart: "2026-07-01",
        dateEnd: "2026-07-05",
        bands: [{ startMinute: 6 * 60, endMinute: 22 * 60, price: 600 }],
      }),
    ]);

    expect(
      resolveSlotPrice({
        snapshot,
        dateIso: "2026-07-10",
        startMinute: 7 * 60,
      }),
    ).toBe(450);
  });

  it("supports legacy range rules", () => {
    const snapshot = buildPricingSnapshot([
      makeRule({ id: "default", type: "default", price: 450 }),
      makeRule({
        id: "morning",
        type: "range",
        price: 700,
        startMinute: 6 * 60,
        endMinute: 9 * 60,
        dateStart: "2026-01-01",
      }),
    ]);

    expect(
      resolveSlotPrice({
        snapshot,
        dateIso: "2026-07-07",
        startMinute: 7 * 60,
      }),
    ).toBe(700);
  });

  it("reports override status by date", () => {
    const override = {
      id: "x",
      name: "Test",
      dateStart: "2026-07-10",
      dateEnd: "2026-07-20",
      bands: [{ startMinute: 360, endMinute: 540, price: 500 }],
      active: true,
      createdAt: new Date(),
    };

    expect(getOverrideStatus(override, "2026-07-05")).toBe("scheduled");
    expect(getOverrideStatus(override, "2026-07-15")).toBe("active");
    expect(getOverrideStatus(override, "2026-07-25")).toBe("expired");
    expect(isOverrideActiveOnDate(override, "2026-07-25")).toBe(false);
  });
});
