import { describe, expect, it } from "vitest";

import { buildSubscriptionKey } from "@/features/realtime/lib/subscription-manager";

describe("buildSubscriptionKey", () => {
  it("builds stable keys for deduplication", () => {
    expect(
      buildSubscriptionKey({ table: "booked_slots", event: "*", filter: undefined }),
    ).toBe("booked_slots:*:all");
  });
});
