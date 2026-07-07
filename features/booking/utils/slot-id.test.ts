import { describe, expect, it } from "vitest";

import { buildSlotId, parseSlotId, resolveSlotTimeBounds } from "@/features/booking/utils/slot-id";

describe("slot-id utils", () => {
  it("parses and builds slot ids", () => {
    expect(parseSlotId("2026-07-12-1080")).toEqual({
      dateIso: "2026-07-12",
      startMinute: 1080,
    });
    expect(buildSlotId("2026-07-12", 1080)).toBe("2026-07-12-1080");
  });

  it("resolves slot time bounds", () => {
    const bounds = resolveSlotTimeBounds(["2026-07-12-1080", "2026-07-12-1110"], 30);
    expect(bounds?.startMinute).toBe(1080);
    expect(bounds?.endMinute).toBe(1140);
    expect(bounds?.startTime).toBeTruthy();
    expect(bounds?.endTime).toBeTruthy();
  });
});
