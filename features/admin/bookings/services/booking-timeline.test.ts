import { describe, expect, it } from "vitest";

import { buildBookingTimeline } from "@/features/admin/bookings/services/booking-timeline.service";
import type { BookingRecord } from "@/features/booking/types/booking-record.types";

const baseBooking: BookingRecord = {
  id: "b1",
  bookingReference: "CIG-20260712-0001",
  userId: "u1",
  bookingSessionId: "s1",
  paymentId: "p1",
  bookingDate: "2026-07-12",
  startTime: "6:00 PM",
  endTime: "7:00 PM",
  selectedSlots: ["2026-07-12-1080"],
  durationMinutes: 60,
  totalPrice: 2000,
  advancePaid: 500,
  remainingAmount: 1500,
  status: "confirmed",
  source: "online",
  notes: null,
  cancellationReason: null,
  arrivedAt: null,
  matchStartedAt: null,
  matchCompletedAt: null,
  customerName: "Rahul",
  customerPhone: "9999999999",
  customerEmail: "rahul@example.com",
  createdAt: new Date("2026-07-06T10:00:00Z"),
  updatedAt: new Date("2026-07-06T10:00:00Z"),
};

describe("buildBookingTimeline", () => {
  it("marks payment as current when remaining balance exists", () => {
    const steps = buildBookingTimeline(baseBooking, [
      {
        id: "pay1",
        bookingId: "b1",
        type: "advance",
        amount: 500,
        method: "online",
        collectedBy: null,
        notes: null,
        referenceNumber: null,
        createdAt: new Date("2026-07-06T10:00:00Z"),
      },
    ]);

    expect(steps.find((step) => step.id === "payment")?.status).toBe("current");
    expect(steps.find((step) => step.id === "confirmed")?.status).toBe("completed");
  });

  it("marks completed booking timeline step", () => {
    const steps = buildBookingTimeline(
      { ...baseBooking, status: "completed", remainingAmount: 0, advancePaid: 2000 },
      [],
    );

    expect(steps.find((step) => step.id === "completed")?.status).toBe("completed");
  });
});
