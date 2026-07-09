import { describe, expect, it } from "vitest";

import {
  canCompleteBooking,
  resolveBookingStatusBadge,
  resolvePaymentStatusBadge,
} from "@/features/admin/bookings/lib/booking-status";

const booking = {
  status: "confirmed" as const,
  bookingDate: "2026-07-11",
  selectedSlots: ["2026-07-11-840"],
  durationMinutes: 30,
};

describe("booking-status", () => {
  it("allows completion only after scheduled start time", () => {
    const beforeStart = new Date("2026-07-11T13:30:00+05:30");
    const afterStart = new Date("2026-07-11T14:05:00+05:30");

    expect(canCompleteBooking(booking, beforeStart, "Asia/Kolkata")).toBe(false);
    expect(canCompleteBooking(booking, afterStart, "Asia/Kolkata")).toBe(true);
  });

  it("renders readable badges", () => {
    expect(resolveBookingStatusBadge("confirmed").label).toBe("Confirmed");
    expect(resolvePaymentStatusBadge("partial").label).toBe("Partially Paid");
  });
});
