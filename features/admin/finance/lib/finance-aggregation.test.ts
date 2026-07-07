import { describe, expect, it } from "vitest";

import type { AdminBookingRecord } from "@/features/admin/bookings/types/admin-booking.types";
import {
  buildDailyClosing,
  buildFinanceOverview,
  buildReconciliation,
} from "@/features/admin/finance/lib/finance-aggregation";

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

describe("finance aggregation", () => {
  it("builds overview from payment records", () => {
    const overview = buildFinanceOverview({
      allPayments: [
        {
          id: "p1",
          bookingId: "b1",
          type: "advance",
          amount: 200,
          method: "online",
          collectedBy: null,
          notes: null,
          referenceNumber: null,
          createdAt: new Date("2026-07-07T10:00:00Z"),
        },
        {
          id: "p2",
          bookingId: "b1",
          type: "remaining",
          amount: 500,
          method: "cash",
          collectedBy: null,
          notes: null,
          referenceNumber: null,
          createdAt: new Date("2026-07-06T10:00:00Z"),
        },
      ],
      periodPayments: [
        {
          id: "p1",
          bookingId: "b1",
          type: "advance",
          amount: 200,
          method: "online",
          collectedBy: null,
          notes: null,
          referenceNumber: null,
          createdAt: new Date("2026-07-07T10:00:00Z"),
        },
      ],
      pendingBookings: [createBooking()],
      periodBookings: [createBooking()],
      today: "2026-07-07",
    });

    expect(overview.todaysRevenue).toBe(200);
    expect(overview.onlineCollections).toBe(200);
    expect(overview.pendingCollections).toBe(1000);
  });

  it("builds daily closing from payment methods", () => {
    const closing = buildDailyClosing({
      date: "2026-07-07",
      payments: [
        {
          id: "p1",
          bookingId: "b1",
          type: "advance",
          amount: 200,
          method: "cash",
          collectedBy: null,
          notes: null,
          referenceNumber: null,
          createdAt: new Date("2026-07-07T10:00:00Z"),
        },
        {
          id: "p2",
          bookingId: "b2",
          type: "advance",
          amount: 300,
          method: "online",
          collectedBy: null,
          notes: null,
          referenceNumber: null,
          createdAt: new Date("2026-07-07T11:00:00Z"),
        },
      ],
      bookings: [
        createBooking(),
        createBooking({
          id: "b2",
          status: "completed",
          source: "manual",
          remainingAmount: 0,
        }),
        createBooking({ id: "b3", status: "cancelled" }),
      ],
    });

    expect(closing.totalRevenue).toBe(500);
    expect(closing.cash).toBe(200);
    expect(closing.razorpay).toBe(300);
    expect(closing.completedBookings).toBe(1);
    expect(closing.cancelledBookings).toBe(1);
    expect(closing.manualBookings).toBe(1);
  });

  it("detects reconciliation discrepancy", () => {
    const reconciliation = buildReconciliation({
      bookings: [createBooking({ totalPrice: 1200, remainingAmount: 1000 })],
      payments: [
        {
          id: "p1",
          bookingId: "b1",
          type: "advance",
          amount: 100,
          method: "online",
          collectedBy: null,
          notes: null,
          referenceNumber: null,
          createdAt: new Date(),
        },
      ],
    });

    expect(reconciliation.expectedRevenue).toBe(1200);
    expect(reconciliation.collectedRevenue).toBe(100);
    expect(reconciliation.outstandingRevenue).toBe(1000);
    expect(reconciliation.hasDiscrepancy).toBe(true);
  });
});
