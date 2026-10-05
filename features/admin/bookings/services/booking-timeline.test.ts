import { describe, expect, it } from "vitest";

import { buildBookingTimeline } from "@/features/admin/bookings/services/booking-timeline.service";
import type { BookingPaymentRecord } from "@/features/admin/bookings/types/admin-booking.types";
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

function payment(overrides: Partial<BookingPaymentRecord>): BookingPaymentRecord {
  return {
    id: "pay-x",
    bookingId: "b1",
    type: "advance",
    amount: 200,
    method: "cash",
    collectedBy: null,
    notes: null,
    referenceNumber: null,
    createdAt: new Date("2026-07-06T10:00:00Z"),
    ...overrides,
  };
}

describe("buildBookingTimeline", () => {
  it("shows the genuine Razorpay advance as its own step, labeled Razorpay", () => {
    const steps = buildBookingTimeline(baseBooking, [
      payment({
        id: "adv1",
        type: "advance",
        amount: 500,
        method: "online",
        collectedBy: null,
        referenceNumber: "pay_abc123",
      }),
    ]);

    const advanceStep = steps.find((step) => step.id === "advance-adv1");
    expect(advanceStep?.label).toBe("Advance Paid");
    expect(advanceStep?.description).toContain("Razorpay");
    expect(advanceStep?.description).toContain("pay_abc123");
  });

  it("shows an admin-recorded advance as Online, not Razorpay", () => {
    const steps = buildBookingTimeline(baseBooking, [
      payment({ id: "adv1", type: "advance", amount: 500, method: "online", collectedBy: "admin-1" }),
    ]);

    expect(steps.find((step) => step.id === "advance-adv1")?.description).toBe(
      "₹500 via Online",
    );
  });

  it("shows each part of a multi-part remaining collection as its own step, in order", () => {
    const steps = buildBookingTimeline(
      { ...baseBooking, remainingAmount: 0 },
      [
        payment({ id: "adv1", type: "advance", amount: 500, method: "online", collectedBy: null }),
        payment({
          id: "rem2",
          type: "remaining",
          amount: 1000,
          method: "upi",
          collectedBy: "admin-1",
          createdAt: new Date("2026-07-12T18:30:00Z"),
        }),
        payment({
          id: "rem1",
          type: "remaining",
          amount: 500,
          method: "cash",
          collectedBy: "admin-1",
          createdAt: new Date("2026-07-12T18:00:00Z"),
        }),
      ],
    );

    const collectedIds = steps.filter((s) => s.id.startsWith("collected-")).map((s) => s.id);
    // rem1 (18:00) must come before rem2 (18:30) regardless of array input order.
    expect(collectedIds).toEqual(["collected-rem1", "collected-rem2"]);
    expect(steps.find((s) => s.id === "collected-rem1")?.description).toBe("₹500 via Cash");
    expect(steps.find((s) => s.id === "collected-rem2")?.description).toBe("₹1,000 via UPI");
    expect(steps.find((s) => s.id === "fully-paid")?.description).toContain("₹2,000");
  });

  it("shows exactly how much is pending vs already collected for a partially paid booking", () => {
    const steps = buildBookingTimeline(baseBooking, [
      payment({ id: "adv1", type: "advance", amount: 500, method: "online", collectedBy: null }),
    ]);

    const pending = steps.find((s) => s.id === "pending");
    expect(pending?.status).toBe("current");
    expect(pending?.description).toContain("₹1,500 still due");
    expect(pending?.description).toContain("₹500 collected so far");
  });

  it("shows the exact cancellation reason and that no refund was issued", () => {
    const steps = buildBookingTimeline(
      {
        ...baseBooking,
        status: "cancelled",
        cancellationReason: "Customer rescheduled",
      },
      [payment({ id: "adv1", type: "advance", amount: 500, method: "online", collectedBy: null })],
    );

    const cancelled = steps.find((s) => s.id === "cancelled");
    expect(cancelled?.description).toBe("Reason: Customer rescheduled");
    const noRefund = steps.find((s) => s.id === "no-refund");
    expect(noRefund?.description).toContain("₹500 was collected");
    expect(steps.some((s) => s.id.startsWith("refund-"))).toBe(false);
  });

  it("shows a successful refund with amount and method when one was issued", () => {
    const steps = buildBookingTimeline(
      { ...baseBooking, status: "cancelled", cancellationReason: "Admin cancelled" },
      [
        payment({ id: "adv1", type: "advance", amount: 500, method: "online", collectedBy: null }),
        payment({
          id: "ref1",
          type: "refund",
          amount: 500,
          method: "online",
          collectedBy: "admin-1",
          referenceNumber: "pay_abc123",
        }),
      ],
    );

    expect(steps.find((s) => s.id === "no-refund")).toBeUndefined();
    const refundStep = steps.find((s) => s.id === "refund-ref1");
    expect(refundStep?.label).toBe("Refund Issued");
    expect(refundStep?.description).toContain("₹500");
  });

  it("marks completed booking timeline step", () => {
    const steps = buildBookingTimeline(
      { ...baseBooking, status: "completed", remainingAmount: 0, advancePaid: 2000 },
      [],
    );

    expect(steps.find((step) => step.id === "completed")?.status).toBe("completed");
  });
});
