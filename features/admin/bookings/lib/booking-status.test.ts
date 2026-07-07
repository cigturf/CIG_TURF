import { describe, expect, it } from "vitest";

import {
  canCompleteBooking,
  canMarkArrived,
  canStartMatch,
  resolveBookingStatusBadge,
  resolvePaymentStatusBadge,
} from "@/features/admin/bookings/lib/booking-status";

describe("booking-status", () => {
  it("resolves lifecycle permissions", () => {
    expect(canMarkArrived("confirmed")).toBe(true);
    expect(canStartMatch("arrived")).toBe(true);
    expect(canCompleteBooking("in_progress")).toBe(true);
    expect(canMarkArrived("completed")).toBe(false);
  });

  it("renders readable badges", () => {
    expect(resolveBookingStatusBadge("in_progress").label).toBe("In Progress");
    expect(resolvePaymentStatusBadge("partial").label).toBe("Partially Paid");
  });
});
