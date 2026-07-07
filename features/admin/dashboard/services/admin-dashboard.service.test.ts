import { describe, expect, it } from "vitest";

import type { BookingRecord } from "@/features/booking/types/booking-record.types";

function computeStats(
  bookings: Pick<
    BookingRecord,
    "status" | "advancePaid" | "remainingAmount"
  >[],
  slots: { status: string }[],
) {
  const activeBookings = bookings.filter((booking) => booking.status !== "cancelled");
  const cancelledBookings = bookings.filter((booking) => booking.status === "cancelled").length;

  return {
    todaysBookings: activeBookings.length,
    todaysRevenue: activeBookings.reduce((sum, booking) => sum + booking.advancePaid, 0),
    pendingCollections: activeBookings.reduce((sum, booking) => sum + booking.remainingAmount, 0),
    availableSlots: slots.filter((slot) => slot.status === "available").length,
    occupiedSlots: slots.filter((slot) => slot.status === "booked").length,
    cancelledBookings,
  };
}

describe("admin dashboard stats", () => {
  it("aggregates today metrics from bookings and slots", () => {
    const stats = computeStats(
      [
        {
          status: "confirmed",
          advancePaid: 200,
          remainingAmount: 800,
        },
        {
          status: "confirmed",
          advancePaid: 200,
          remainingAmount: 600,
        },
        {
          status: "cancelled",
          advancePaid: 200,
          remainingAmount: 0,
        },
      ],
      [
        { status: "available" },
        { status: "available" },
        { status: "booked" },
      ],
    );

    expect(stats.todaysBookings).toBe(2);
    expect(stats.todaysRevenue).toBe(400);
    expect(stats.pendingCollections).toBe(1400);
    expect(stats.availableSlots).toBe(2);
    expect(stats.occupiedSlots).toBe(1);
    expect(stats.cancelledBookings).toBe(1);
  });
});
