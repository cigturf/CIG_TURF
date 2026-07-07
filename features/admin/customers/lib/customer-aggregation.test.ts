import { describe, expect, it } from "vitest";

import type { AdminBookingRecord } from "@/features/admin/bookings/types/admin-booking.types";
import {
  buildCustomerDirectory,
  filterCustomers,
  normalizeCustomerKey,
  searchCustomersByBookingReference,
} from "@/features/admin/customers/lib/customer-aggregation";

function createBooking(overrides: Partial<AdminBookingRecord> = {}): AdminBookingRecord {
  return {
    id: "b1",
    bookingReference: "CIG-001",
    userId: "u1",
    bookingSessionId: "s1",
    paymentId: "p1",
    bookingDate: "2026-07-07",
    startTime: "18:00",
    endTime: "19:00",
    selectedSlots: [],
    durationMinutes: 60,
    totalPrice: 1200,
    advancePaid: 200,
    remainingAmount: 1000,
    status: "confirmed",
    source: "online",
    notes: null,
    cancellationReason: null,
    arrivedAt: null,
    matchStartedAt: null,
    matchCompletedAt: null,
    customerName: "Test User",
    customerPhone: "9999999999",
    customerEmail: "test@example.com",
    createdAt: new Date("2026-07-07T08:00:00Z"),
    updatedAt: new Date("2026-07-07T08:00:00Z"),
    paymentStatus: "partial",
    ...overrides,
  };
}

describe("customer aggregation", () => {
  it("normalizes phone to customer key", () => {
    expect(normalizeCustomerKey("+91 99999 99999")).toBe("9999999999");
  });

  it("groups bookings by phone", () => {
    const customers = buildCustomerDirectory(
      [
        createBooking(),
        createBooking({
          id: "b2",
          bookingReference: "CIG-002",
          bookingDate: "2026-07-08",
        }),
      ],
      [
        {
          id: "pay1",
          bookingId: "b1",
          type: "advance",
          amount: 200,
          method: "online",
          collectedBy: null,
          notes: null,
          referenceNumber: null,
          createdAt: new Date(),
        },
      ],
    );

    expect(customers).toHaveLength(1);
    expect(customers[0]?.totalBookings).toBe(2);
    expect(customers[0]?.totalAmountSpent).toBe(200);
    expect(customers[0]?.outstandingAmount).toBe(2000);
    expect(customers[0]?.status).toBe("pending");
  });

  it("filters repeat customers", () => {
    const customers = buildCustomerDirectory(
      [
        createBooking(),
        createBooking({ id: "b2", customerPhone: "8888888888" }),
        createBooking({ id: "b3", bookingReference: "CIG-003" }),
      ],
      [],
    );

    const repeat = filterCustomers(customers, undefined, "repeat");
    expect(repeat).toHaveLength(1);
    expect(repeat[0]?.totalBookings).toBe(2);
  });

  it("searches by booking reference", () => {
    const bookings = [
      createBooking(),
      createBooking({ id: "b2", bookingReference: "CIG-XYZ", customerPhone: "8888888888" }),
    ];
    const customers = buildCustomerDirectory(bookings, []);
    const matches = searchCustomersByBookingReference(customers, bookings, "xyz");
    expect(matches).toHaveLength(1);
    expect(matches[0]?.phone).toBe("8888888888");
  });
});
