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
    bookingDate: "2026-07-11",
    startTime: "2:00 PM",
    endTime: "2:30 PM",
    selectedSlots: ["2026-07-11-840"],
    durationMinutes: 30,
    totalPrice: 600,
    advancePaid: 200,
    remainingAmount: 400,
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
    createdAt: new Date("2026-07-11T08:00:00+05:30"),
    updatedAt: new Date("2026-07-11T08:00:00+05:30"),
    ...overrides,
  };
}

describe("buildDashboardOperations", () => {
  const now = new Date("2026-07-11T14:10:00+05:30");

  it("shows the in-window booking as current and the next slot as upcoming", () => {
    const bookings = [
      createBooking({
        id: "past",
        customerName: "Past Team",
        selectedSlots: ["2026-07-11-780"],
        startTime: "1:00 PM",
        endTime: "1:30 PM",
      }),
      createBooking({
        id: "current",
        customerName: "Current Team",
        selectedSlots: ["2026-07-11-840"],
        startTime: "2:00 PM",
        endTime: "2:30 PM",
      }),
      createBooking({
        id: "upcoming",
        customerName: "Upcoming Team",
        selectedSlots: ["2026-07-11-900"],
        startTime: "3:00 PM",
        endTime: "3:30 PM",
      }),
    ];

    const result = buildDashboardOperations(bookings, {
      now,
      timezone: "Asia/Kolkata",
    });

    expect(result.currentMatch?.id).toBe("current");
    expect(result.upcomingMatch?.id).toBe("upcoming");
  });

  it("does not show past bookings as upcoming", () => {
    const bookings = [
      createBooking({
        id: "past",
        customerName: "Past Team",
        selectedSlots: ["2026-07-11-780"],
        startTime: "1:00 PM",
        endTime: "1:30 PM",
      }),
      createBooking({
        id: "next",
        customerName: "Next Team",
        selectedSlots: ["2026-07-11-900"],
        startTime: "3:00 PM",
        endTime: "3:30 PM",
      }),
    ];

    const result = buildDashboardOperations(bookings, {
      now,
      timezone: "Asia/Kolkata",
    });

    expect(result.currentMatch).toBeNull();
    expect(result.upcomingMatch?.id).toBe("next");
  });
});
