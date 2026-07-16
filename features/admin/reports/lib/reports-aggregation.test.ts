import { describe, expect, it } from "vitest";

import type { AdminBookingRecord } from "@/features/admin/bookings/types/admin-booking.types";
import {
  buildBookingsPerDay,
  buildPaymentBreakdown,
  buildReportOverview,
} from "@/features/admin/reports/lib/reports-aggregation";

function createBooking(
  overrides: Partial<AdminBookingRecord> = {},
): AdminBookingRecord {
  return {
    id: "b1",
    bookingReference: "CIG-001",
    userId: "u1",
    bookingSessionId: "s1",
    paymentId: "p1",
    bookingDate: "2026-07-07",
    startTime: "18:00",
    endTime: "19:00",
    selectedSlots: ["2026-07-07-1080"],
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

describe("reports aggregation", () => {
  it("builds overview metrics", () => {
    const bookings = [
      createBooking(),
      createBooking({
        id: "b2",
        status: "cancelled",
        source: "manual",
        totalPrice: 800,
      }),
      createBooking({
        id: "b3",
        status: "completed",
        source: "manual",
        remainingAmount: 0,
        totalPrice: 1500,
      }),
    ];

    const overview = buildReportOverview(bookings, [
      {
        id: "pay1",
        bookingId: "b1",
        type: "advance",
        amount: 200,
        method: "online",
        collectedBy: null,
        notes: null,
        referenceNumber: null,
        createdAt: new Date("2026-07-07T08:00:00Z"),
      },
      {
        id: "pay2",
        bookingId: "b3",
        type: "remaining",
        amount: 500,
        method: "cash",
        collectedBy: null,
        notes: null,
        referenceNumber: null,
        createdAt: new Date("2026-07-07T09:00:00Z"),
      },
    ]);

    expect(overview.totalBookings).toBe(3);
    expect(overview.cancelledBookings).toBe(1);
    expect(overview.manualBookings).toBe(2);
    expect(overview.onlineBookings).toBe(1);
    expect(overview.totalRevenue).toBe(700);
    expect(overview.offlineCollections).toBe(500);
    expect(overview.pendingCollections).toBe(1000);
  });

  it("builds bookings per day series", () => {
    const series = buildBookingsPerDay(
      [createBooking(), createBooking({ id: "b2", bookingDate: "2026-07-08" })],
      "2026-07-07",
      "2026-07-08",
    );

    expect(series).toHaveLength(2);
    expect(series[0]?.value).toBe(1);
    expect(series[1]?.value).toBe(1);
  });

  it("builds payment breakdown percentages", () => {
    const breakdown = buildPaymentBreakdown([
      {
        id: "pay1",
        bookingId: "b1",
        type: "advance",
        amount: 300,
        method: "cash",
        collectedBy: null,
        notes: null,
        referenceNumber: null,
        createdAt: new Date(),
      },
      {
        id: "pay2",
        bookingId: "b1",
        type: "advance",
        amount: 700,
        method: "online",
        collectedBy: null,
        notes: null,
        referenceNumber: null,
        createdAt: new Date(),
      },
    ]);

    expect(breakdown).toHaveLength(2);
    expect(breakdown.find((item) => item.method === "Cash")?.percentage).toBe(30);
    expect(breakdown.find((item) => item.method === "Online (Razorpay)")?.percentage).toBe(70);
  });
});
