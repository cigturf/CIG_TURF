import { describe, expect, it } from "vitest";

import { BOOKING_DEFAULTS } from "@/features/booking/config";
import { buildBookingViewSlots } from "@/features/booking/services/booking-view-slots.service";
import { resolveBookingEngineConfig } from "@/features/booking/services/booking-config.service";
import { toggleConsecutiveSlot } from "@/features/booking/utils/consecutive-slots";
import { formatTimeRange } from "@/features/booking/utils/format-time-range";
import { resolveSlotTimeBounds } from "@/features/booking/utils/slot-id";
import {
  areConsecutiveSlotIds,
  selectionSpansMidnight,
} from "@/features/booking/utils/slot-timeline";
import { createEmptyBusinessSettings } from "@/features/business-settings/lib/defaults";
import { toPublicBusinessSettings } from "@/features/business-settings/lib/parse";

function buildConfig() {
  return resolveBookingEngineConfig(toPublicBusinessSettings(createEmptyBusinessSettings()));
}

describe("cross-midnight slot selection", () => {
  it("appends early-morning bridge slots from the next day", () => {
    const config = buildConfig();
    const { slots, bridgeStartIndex } = buildBookingViewSlots({
      dateIso: "2026-07-07",
      config,
      primaryAvailability: {},
      bridgeAvailability: {},
    });

    expect(bridgeStartIndex).toBeGreaterThan(0);
    expect(slots[bridgeStartIndex]?.id).toBe("2026-07-08-0");
  });

  it("allows selecting consecutive slots across midnight", () => {
    const config = buildConfig();
    const { slots } = buildBookingViewSlots({
      dateIso: "2026-07-07",
      config,
      primaryAvailability: {},
      bridgeAvailability: {},
    });

    const lateNight = slots.find((slot) => slot.id === "2026-07-07-1410");
    const afterMidnight = slots.find((slot) => slot.id === "2026-07-08-0");
    expect(lateNight).toBeTruthy();
    expect(afterMidnight).toBeTruthy();

    const first = toggleConsecutiveSlot(slots, [], lateNight!.id, config);
    const second = toggleConsecutiveSlot(slots, first.selectedSlotIds, afterMidnight!.id, config);

    expect(second.rejected).toBe(false);
    expect(second.selectedSlotIds).toEqual(["2026-07-07-1410", "2026-07-08-0"]);
    expect(areConsecutiveSlotIds(second.selectedSlotIds, config.slotDurationMinutes)).toBe(true);
    expect(selectionSpansMidnight(second.selectedSlotIds)).toBe(true);
    expect(formatTimeRange(slots, second.selectedSlotIds)).toMatch(/11:30 pm.*12:30 am/i);
  });

  it("resolves time bounds across two calendar dates", () => {
    const bounds = resolveSlotTimeBounds(
      ["2026-07-07-1410", "2026-07-08-0", "2026-07-08-30"],
      BOOKING_DEFAULTS.slotDurationMinutes,
    );

    expect(bounds?.startTime).toMatch(/11:30/i);
    expect(bounds?.endTime).toMatch(/1:00/i);
  });
});
