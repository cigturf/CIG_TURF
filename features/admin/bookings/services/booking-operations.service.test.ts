import { describe, expect, it } from "vitest";

import { buildDashboardOperations } from "@/features/admin/bookings/services/booking-operations.service";
import type { BookingRecord } from "@/features/booking/types/booking-record.types";

function createBooking(overrides: Partial<BookingRecord>): BookingRecord {
  return {
    id: "b1",
    bookingReference: "CIG-001",
    userId: "u1",
    bookingSessionId: "s1",
    paymentId: "p1",
    bookingDate: "2026-07-07",
    startTime: "6:00 PM",
    endTime: "7:00 PM",
    selectedSlots: ["2026-07-07-1080"],
    durationMinutes: 60,
    totalPrice: 2400,
    advancePaid: 200,
    remainingAmount: 2200,
    status: "confirmed",
    source: "online",
    notes: null,
    cancellationReason: null,
    arrivedAt: null,
    matchStartedAt: null,
    matchCompletedAt: null,
    customerName: "Team Alpha",
    customerPhone: "9999999999",
    customerEmail: "team@example.com",
    createdAt: new Date("2026-07-07T10:00:00"),
    updatedAt: new Date("2026-07-07T10:00:00"),
    ...overrides,
  };
}

describe("buildDashboardOperations", () => {
  it("groups current, upcoming, collections, and check-ins", () => {
    const bookings = [
      createBooking({
        id: "1",
        status: "in_progress",
        customerName: "Current Team",
        remainingAmount: 0,
        advancePaid: 2400,
      }),
      createBooking({
        id: "2",
        status: "confirmed",
        customerName: "Waiting Team",
        startTime: "8:00 PM",
      }),
      createBooking({
        id: "3",
        status: "arrived",
        customerName: "Arrived Team",
        remainingAmount: 500,
      }),
    ];

    const result = buildDashboardOperations(bookings);

    expect(result.currentMatch?.customerName).toBe("Current Team");
    expect(result.waitingForCheckIn).toHaveLength(1);
    expect(result.pendingCollections).toHaveLength(2);
  });
});
