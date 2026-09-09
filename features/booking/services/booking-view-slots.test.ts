import { describe, expect, it } from "vitest";

import { buildBookingViewSlots } from "@/features/booking/services/booking-view-slots.service";
import { resolveBookingEngineConfig } from "@/features/booking/services/booking-config.service";
import { createEmptyBusinessSettings } from "@/features/business-settings/lib/defaults";
import { toPublicBusinessSettings } from "@/features/business-settings/lib/parse";

function buildConfig() {
  return resolveBookingEngineConfig(toPublicBusinessSettings(createEmptyBusinessSettings()));
}

// 2026-07-07T13:17:00Z is 6:47pm IST.
const SIX_FORTY_SEVEN_PM_IST = new Date("2026-07-07T13:17:00Z");

describe("buildBookingViewSlots hidePastSlots", () => {
  it("keeps every slot, past included, when hidePastSlots is not set (admin / order validation path)", () => {
    const { slots } = buildBookingViewSlots({
      dateIso: "2026-07-07",
      config: buildConfig(),
      now: SIX_FORTY_SEVEN_PM_IST,
      primaryAvailability: {},
      bridgeAvailability: {},
    });

    const sixPm = slots.find((slot) => slot.id === "2026-07-07-1080"); // 6:00pm-6:30pm, already ended
    const sixThirtyPm = slots.find((slot) => slot.id === "2026-07-07-1110"); // 6:30pm-7:00pm, in progress

    expect(sixPm?.isPast).toBe(true);
    expect(sixPm?.isSelectable).toBe(false);
    expect(sixThirtyPm?.isPast).toBe(false);
  });

  it("drops today's already-ended slots entirely when hidePastSlots is set (customer booking path)", () => {
    const { slots } = buildBookingViewSlots({
      dateIso: "2026-07-07",
      config: buildConfig(),
      now: SIX_FORTY_SEVEN_PM_IST,
      hidePastSlots: true,
      primaryAvailability: {},
      bridgeAvailability: {},
    });

    // 6:00pm-6:30pm ended at 6:30pm, before "now" (6:47pm): must be gone.
    expect(slots.find((slot) => slot.id === "2026-07-07-1080")).toBeUndefined();
    // 6:30pm-7:00pm hasn't ended yet: must still be visible.
    expect(slots.find((slot) => slot.id === "2026-07-07-1110")).toBeTruthy();
    // Nothing in the remaining list should ever be past.
    expect(slots.every((slot) => !slot.isPast)).toBe(true);
  });

  it("does not affect a future date's slots even when hidePastSlots is set", () => {
    const withPast = buildBookingViewSlots({
      dateIso: "2026-07-08",
      config: buildConfig(),
      now: SIX_FORTY_SEVEN_PM_IST,
      primaryAvailability: {},
      bridgeAvailability: {},
    });
    const withHidden = buildBookingViewSlots({
      dateIso: "2026-07-08",
      config: buildConfig(),
      now: SIX_FORTY_SEVEN_PM_IST,
      hidePastSlots: true,
      primaryAvailability: {},
      bridgeAvailability: {},
    });

    expect(withHidden.slots.length).toBe(withPast.slots.length);
  });

  it("keeps the after-midnight bridge slots intact and correctly indexed once past slots are dropped", () => {
    const { slots, bridgeStartIndex } = buildBookingViewSlots({
      dateIso: "2026-07-07",
      config: buildConfig(),
      now: SIX_FORTY_SEVEN_PM_IST,
      hidePastSlots: true,
      primaryAvailability: {},
      bridgeAvailability: {},
    });

    expect(bridgeStartIndex).toBeGreaterThan(0);
    expect(slots[bridgeStartIndex]?.id).toBe("2026-07-08-0");
    // Every slot in the primary section must precede every bridge slot chronologically.
    const primaryMaxOrder = Math.max(...slots.slice(0, bridgeStartIndex).map((slot) => slot.sortOrder));
    const bridgeMinOrder = Math.min(...slots.slice(bridgeStartIndex).map((slot) => slot.sortOrder));
    expect(bridgeMinOrder).toBeGreaterThan(primaryMaxOrder);
  });
});
