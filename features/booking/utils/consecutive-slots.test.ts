import { describe, expect, it } from "vitest";

import { BOOKING_DEFAULTS } from "@/features/booking/config";
import { resolveBookingEngineConfig } from "@/features/booking/services/booking-config.service";
import { calculateSlotPrice } from "@/features/booking/services/pricing-engine.service";
import { generateSlots } from "@/features/booking/services/slot-generator.service";
import { createEmptyBusinessSettings } from "@/features/business-settings/lib/defaults";
import { toPublicBusinessSettings } from "@/features/business-settings/lib/parse";
import type { BookingSlot } from "@/features/booking/types";
import {
  areConsecutiveIndices,
  calculateBookingSummary,
  calculateRemainingAmount,
  countSlotsInWindow,
  formatTimeRange,
  getTodayIso,
  isPastSlotEnd,
  toggleConsecutiveSlot,
} from "@/features/booking/utils";

function buildTestConfig() {
  return {
    ...BOOKING_DEFAULTS,
    holidayPricing: {
      ...BOOKING_DEFAULTS.holidayPricing,
      holidayDates: [...BOOKING_DEFAULTS.holidayPricing.holidayDates],
    },
  };
}

function buildTestSlot(overrides: Partial<BookingSlot> & Pick<BookingSlot, "id" | "sortOrder">): BookingSlot {
  return {
    startTime: "2026-07-10T18:00:00.000Z",
    endTime: "2026-07-10T18:30:00.000Z",
    duration: 30,
    timeLabel: "6:00 pm to 6:30 pm",
    startTimeLabel: "6:00 pm",
    endTimeLabel: "6:30 pm",
    price: 600,
    status: "available",
    isPast: false,
    isSelectable: true,
    isSelected: false,
    ...overrides,
  };
}

const slots = [
  buildTestSlot({ id: "a", sortOrder: 0, timeLabel: "6:00 pm to 6:30 pm", startTimeLabel: "6:00 pm", endTimeLabel: "6:30 pm" }),
  buildTestSlot({ id: "b", sortOrder: 1, timeLabel: "6:30 pm to 7:00 pm", startTimeLabel: "6:30 pm", endTimeLabel: "7:00 pm" }),
  buildTestSlot({ id: "c", sortOrder: 2, timeLabel: "7:00 pm to 7:30 pm", startTimeLabel: "7:00 pm", endTimeLabel: "7:30 pm" }),
  buildTestSlot({
    id: "d",
    sortOrder: 3,
    timeLabel: "7:30 pm to 8:00 pm",
    startTimeLabel: "7:30 pm",
    endTimeLabel: "8:00 pm",
    status: "booked",
    isSelectable: false,
  }),
];

describe("consecutive slot validation", () => {
  it("allows selecting the first available slot", () => {
    const result = toggleConsecutiveSlot(slots, [], "a", buildTestConfig());
    expect(result.selectedSlotIds).toEqual(["a"]);
    expect(result.rejected).toBe(false);
  });

  it("extends selection with adjacent slots", () => {
    const first = toggleConsecutiveSlot(slots, [], "a", buildTestConfig());
    const second = toggleConsecutiveSlot(slots, first.selectedSlotIds, "b", buildTestConfig());
    expect(second.selectedSlotIds).toEqual(["a", "b"]);
    expect(second.rejected).toBe(false);
  });

  it("rejects non-consecutive selection", () => {
    const first = toggleConsecutiveSlot(slots, [], "a", buildTestConfig());
    const second = toggleConsecutiveSlot(slots, first.selectedSlotIds, "c", buildTestConfig());
    expect(second.selectedSlotIds).toEqual(["a"]);
    expect(second.rejected).toBe(true);
    expect(second.rejectionReason).toBe("non_consecutive");
  });

  it("validates consecutive indices", () => {
    expect(areConsecutiveIndices([0, 1, 2])).toBe(true);
    expect(areConsecutiveIndices([0, 2])).toBe(false);
  });

  it("rejects past slots", () => {
    const pastSlot = buildTestSlot({
      id: "past",
      sortOrder: 4,
      status: "past",
      isPast: true,
      isSelectable: false,
    });
    const result = toggleConsecutiveSlot([...slots, pastSlot], [], "past", buildTestConfig());
    expect(result.rejected).toBe(true);
    expect(result.rejectionReason).toBe("past");
  });
});

describe("booking summary calculations", () => {
  it("merges consecutive slots into a time range", () => {
    expect(formatTimeRange(slots, ["a", "b", "c", "d"])).toBe("6:00 pm to 8:00 pm");
    expect(formatTimeRange(slots, ["a", "b"])).toBe("6:00 pm to 7:00 pm");
  });

  it("calculates summary with fixed advance", () => {
    const config = buildTestConfig();
    const summary = calculateBookingSummary(slots, ["a"], config);
    expect(summary.totalPrice).toBe(600);
    expect(summary.advanceAmount).toBe(200);
    expect(summary.remainingAmount).toBe(400);
    expect(summary.slotCount).toBe(1);
    expect(summary.totalDurationMinutes).toBe(30);

    const fourSlots = calculateBookingSummary(slots, ["a", "b", "c"], config);
    expect(fourSlots.totalPrice).toBe(1800);
    expect(fourSlots.advanceAmount).toBe(200);
    expect(fourSlots.remainingAmount).toBe(1600);
    expect(fourSlots.slotCount).toBe(3);
    expect(fourSlots.totalDurationMinutes).toBe(90);
  });

  it("calculates remaining amount", () => {
    expect(calculateRemainingAmount(6000, 200)).toBe(5800);
    expect(calculateRemainingAmount(2400, 200)).toBe(2200);
  });
});

describe("slot generation engine", () => {
  it("uses defaults when business settings are empty", () => {
    const publicSettings = toPublicBusinessSettings(createEmptyBusinessSettings());
    const config = resolveBookingEngineConfig(publicSettings);
    expect(config.bookingWindowDays).toBe(BOOKING_DEFAULTS.bookingWindowDays);
    expect(config.slotDurationMinutes).toBe(BOOKING_DEFAULTS.slotDurationMinutes);
    expect(config.defaultSlotPrice).toBe(BOOKING_DEFAULTS.defaultSlotPrice);
    expect(config.fixedAdvanceAmount).toBe(BOOKING_DEFAULTS.fixedAdvanceAmount);
  });

  it("generates slots for the full operating window", () => {
    const config = buildTestConfig();
    const generated = generateSlots({ dateIso: "2026-07-10", config });
    const expectedCount = countSlotsInWindow(config.slotDurationMinutes, config.businessHours);

    expect(generated.length).toBe(expectedCount);
    expect(generated[0]?.timeLabel).toMatch(/12:00 am to 12:30 am/i);
    expect(generated.at(-1)?.timeLabel).toMatch(/11:30 pm to/i);
    expect(generated.every((slot) => slot.duration === config.slotDurationMinutes)).toBe(true);
  });

  it("disables past slots for today", () => {
    const config = buildTestConfig();
    const today = getTodayIso();
    const noon = new Date();
    noon.setHours(12, 0, 0, 0);

    const generated = generateSlots({ dateIso: today, config, now: noon });
    const pastSlots = generated.filter((slot) => slot.isPast);
    const futureSlots = generated.filter((slot) => slot.isSelectable);

    expect(pastSlots.length).toBeGreaterThan(0);
    expect(futureSlots.length).toBeGreaterThan(0);
    expect(pastSlots.every((slot) => slot.status === "past")).toBe(true);
    expect(pastSlots.every((slot) => !slot.isSelectable)).toBe(true);
  });

  it("shows all slots for future dates", () => {
    const config = buildTestConfig();
    const generated = generateSlots({
      dateIso: "2099-01-01",
      config,
      now: new Date("2026-07-10T12:00:00"),
    });

    expect(generated.every((slot) => !slot.isPast)).toBe(true);
  });
});

describe("pricing engine", () => {
  it("applies weekend multiplier when enabled", () => {
    const config = buildTestConfig();
    const saturday = "2026-07-11";
    const base = calculateSlotPrice({ dateIso: saturday, startMinute: 18 * 60, basePrice: 600 }, {
      ...config,
      weekendPricing: { enabled: false, multiplier: 1.2 },
    });
    const weekend = calculateSlotPrice({ dateIso: saturday, startMinute: 18 * 60, basePrice: 600 }, {
      ...config,
      weekendPricing: { enabled: true, multiplier: 1.2 },
    });

    expect(weekend).toBe(Math.round(base * 1.2));
  });
});

describe("past slot validation", () => {
  it("detects when a slot end time has passed", () => {
    const now = new Date("2026-07-10T18:15:00");
    expect(isPastSlotEnd("2026-07-10", 18 * 60, now)).toBe(true);
    expect(isPastSlotEnd("2026-07-10", 19 * 60, now)).toBe(false);
    expect(isPastSlotEnd("2026-07-11", 18 * 60, now)).toBe(false);
  });
});
