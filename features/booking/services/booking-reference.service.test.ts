import { describe, expect, it, vi } from "vitest";

import { generateBookingReference } from "@/features/booking/services/booking-reference.service";

vi.mock("@/features/booking/services/booking.repository", () => ({
  countBookingsForDate: vi.fn(),
}));

import { countBookingsForDate } from "@/features/booking/services/booking.repository";

describe("generateBookingReference", () => {
  it("formats CIG-YYYYMMDD-XXXX with padded sequence", async () => {
    vi.mocked(countBookingsForDate).mockResolvedValue(40);
    const reference = await generateBookingReference("2026-07-12");
    expect(reference).toBe("CIG-20260712-0041");
  });
});
