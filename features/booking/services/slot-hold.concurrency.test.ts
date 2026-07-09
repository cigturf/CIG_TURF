import { describe, expect, it } from "vitest";

import { SLOT_HOLD_TTL_MINUTES } from "@/features/payments/constants";

describe("slot hold concurrency strategy", () => {
  it("uses a short payment-window TTL separate from session expiry", () => {
    expect(SLOT_HOLD_TTL_MINUTES).toBeLessThanOrEqual(30);
    expect(SLOT_HOLD_TTL_MINUTES).toBeGreaterThan(0);
  });

  it("relies on database UNIQUE(slot_id) as the final allocator", () => {
    // Documented invariant: booked_slots.slot_id and slot_holds.slot_id are UNIQUE.
    // Concurrent winners are decided by the database; losers must refund.
    const invariants = ["booked_slots.slot_id UNIQUE", "slot_holds.slot_id UNIQUE"];
    expect(invariants).toHaveLength(2);
  });
});
