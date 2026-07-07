import { describe, expect, it } from "vitest";

import { buildSubscriptionKey } from "@/features/realtime/lib/subscription-manager";
import { applyBookedSlotChange, parseBookedSlotPayload } from "@/features/realtime/utils/realtime-payload";

describe("realtime payload utils", () => {
  it("parses booked slot insert events", () => {
    const event = parseBookedSlotPayload({
      eventType: "INSERT",
      new: { slot_id: "2026-07-07-540", booking_date: "2026-07-07" },
      old: {},
      schema: "public",
      table: "booked_slots",
      commit_timestamp: "2026-07-07T00:00:00.000Z",
      errors: [],
    } as never);

    expect(event).toEqual({
      type: "insert",
      slotId: "2026-07-07-540",
      bookingDate: "2026-07-07",
      payload: expect.any(Object),
    });
  });

  it("applies slot insert and delete changes", () => {
    const inserted = applyBookedSlotChange(["2026-07-07-510"], {
      type: "insert",
      slotId: "2026-07-07-540",
      bookingDate: "2026-07-07",
      payload: {} as never,
    });

    expect(inserted).toEqual(["2026-07-07-510", "2026-07-07-540"]);

    const deleted = applyBookedSlotChange(inserted, {
      type: "delete",
      slotId: "2026-07-07-510",
      bookingDate: "2026-07-07",
      payload: {} as never,
    });

    expect(deleted).toEqual(["2026-07-07-540"]);
  });
});

describe("subscription manager keys", () => {
  it("builds stable dedupe keys", () => {
    expect(
      buildSubscriptionKey({
        table: "booked_slots",
        event: "*",
        filter: "booking_date=eq.2026-07-07",
      }),
    ).toBe("booked_slots:*:booking_date=eq.2026-07-07");
  });
});
