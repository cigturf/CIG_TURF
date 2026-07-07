import { describe, expect, it } from "vitest";

import {
  DEFAULT_ADMIN_BOOKINGS_QUERY,
  resolveDateRange,
  resolveSlotViewDate,
  resolveSortOrder,
} from "@/features/admin/bookings/lib/booking-filters";
import { getTodayIso } from "@/features/booking/utils/time";

describe("booking filters", () => {
  it("resolves today using local timezone", () => {
    const today = getTodayIso();
    expect(resolveDateRange("today")).toEqual({ from: today, to: today });
  });

  it("resolves custom date range", () => {
    expect(resolveDateRange("custom", "2026-07-12")).toEqual({
      from: "2026-07-12",
      to: "2026-07-12",
    });
  });

  it("syncs slot view date with today filter", () => {
    expect(resolveSlotViewDate({ dateFilter: "today" })).toBe(getTodayIso());
  });

  it("defaults admin bookings query to today", () => {
    expect(DEFAULT_ADMIN_BOOKINGS_QUERY.dateFilter).toBe("today");
  });

  it("defaults sort to newest created_at desc", () => {
    expect(resolveSortOrder("newest")).toEqual({ field: "created_at", ascending: false });
  });
});
