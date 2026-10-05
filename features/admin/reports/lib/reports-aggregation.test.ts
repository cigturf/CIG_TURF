import { describe, expect, it } from "vitest";

import type { AdminBookingRecord } from "@/features/admin/bookings/types/admin-booking.types";
import {
  buildBookingsPerDay,
  buildOfflineCollectionsBreakdown,
  buildPaymentBreakdown,
  buildReportOverview,
  excludePendingReviewPayments,
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

    // b2 is cancelled, so only b1 (online, 1200) and b3 (manual, 1500) count
    // toward active totals, source counts, and total booking value.
    expect(overview.totalBookings).toBe(3);
    expect(overview.activeBookings).toBe(2);
    expect(overview.cancelledBookings).toBe(1);
    expect(overview.manualBookings).toBe(1);
    expect(overview.onlineBookings).toBe(1);
    expect(overview.totalAmount).toBe(2700);
    expect(overview.totalRevenue).toBe(700);
    expect(overview.advanceCollected).toBe(200);
    expect(overview.offlineCollections).toBe(500);
    expect(overview.onlineCollections).toBe(200);
    expect(overview.pendingCollections).toBe(1000);
  });

  it("scopes advance collected to advance-type payments only, not remaining/final payments", () => {
    // Regression: a booking's final "remaining" payment must not be counted
    // as an advance, or the Advance Collected figure is inflated.
    const overview = buildReportOverview(
      [createBooking({ totalPrice: 1200, remainingAmount: 0 })],
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
          createdAt: new Date("2026-07-01T00:00:00Z"),
        },
        {
          id: "pay2",
          bookingId: "b1",
          type: "remaining",
          amount: 1000,
          method: "cash",
          collectedBy: null,
          notes: null,
          referenceNumber: null,
          createdAt: new Date("2026-07-07T00:00:00Z"),
        },
      ],
    );

    expect(overview.advanceCollected).toBe(200);
    expect(overview.totalRevenue).toBe(1200);
  });

  it("counts a cancelled booking's collected money as revenue when it was never refunded", () => {
    // Regression: a cancelled booking's advance that the venue kept (no
    // refund issued) is real revenue - it must not be silently dropped just
    // because the booking itself was cancelled.
    const bookings = [
      createBooking({ id: "b1", status: "cancelled", totalPrice: 1200 }),
      createBooking({ id: "b2", status: "confirmed", totalPrice: 900 }),
    ];

    const overview = buildReportOverview(bookings, [
      {
        id: "pay1",
        bookingId: "b1", // cancelled, no refund ever recorded - money was kept
        type: "advance",
        amount: 200,
        method: "cash",
        collectedBy: null,
        notes: null,
        referenceNumber: null,
        createdAt: new Date("2026-07-01T00:00:00Z"),
      },
      {
        id: "pay2",
        bookingId: "b2", // active
        type: "advance",
        amount: 300,
        method: "cash",
        collectedBy: null,
        notes: null,
        referenceNumber: null,
        createdAt: new Date("2026-07-01T00:00:00Z"),
      },
    ]);

    expect(overview.totalRevenue).toBe(500);
    expect(overview.offlineCollections).toBe(500);
    expect(overview.advanceCollected).toBe(500);
    expect(overview.totalAmount).toBe(900);
    expect(overview.cancelledAmount).toBe(1200);
    expect(overview.grossBookingValue).toBe(2100);
  });

  it("nets a cancelled booking's advance back out when it actually was refunded", () => {
    const bookings = [createBooking({ id: "b1", status: "cancelled", totalPrice: 1200 })];

    const overview = buildReportOverview(bookings, [
      {
        id: "pay1",
        bookingId: "b1",
        type: "advance",
        amount: 200,
        method: "online",
        collectedBy: null,
        notes: null,
        referenceNumber: "pay_abc123",
        createdAt: new Date("2026-07-01T00:00:00Z"),
      },
      {
        id: "pay2",
        bookingId: "b1",
        type: "refund",
        amount: 200,
        method: "online",
        collectedBy: "admin-1",
        notes: null,
        referenceNumber: "pay_abc123",
        createdAt: new Date("2026-07-02T00:00:00Z"),
      },
    ]);

    expect(overview.totalRevenue).toBe(0);
    expect(overview.onlineCollections).toBe(0);
    expect(overview.offlineCollections).toBe(0);
  });

  it("buckets an admin-recorded 'online' collection as offline, not Razorpay", () => {
    // Regression: picking "Online" as the method while recording a manual
    // advance/collection never actually touches Razorpay - it must count
    // toward Offline Collections, same as UPI/cash taken at the counter.
    const overview = buildReportOverview(
      [createBooking({ id: "b1", status: "confirmed", totalPrice: 900 })],
      [
        {
          id: "pay1",
          bookingId: "b1",
          type: "remaining",
          amount: 300,
          method: "online",
          collectedBy: "admin-1", // admin chose "Online" at the counter
          notes: null,
          referenceNumber: null,
          createdAt: new Date("2026-07-01T00:00:00Z"),
        },
      ],
    );

    expect(overview.onlineCollections).toBe(0);
    expect(overview.offlineCollections).toBe(300);
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
    expect(breakdown.find((item) => item.method === "Razorpay")?.percentage).toBe(70);
  });

  it("labels an admin-recorded 'online' payment as Online, not Razorpay", () => {
    // Regression: a manual booking's advance or a collected remaining
    // balance can be recorded with method "online" (the admin chose it at
    // the counter), but that is not the same as Razorpay actually capturing
    // the money - only a payment with no collectedBy (the automatic online
    // checkout flow) may say "Razorpay".
    const breakdown = buildPaymentBreakdown([
      {
        id: "pay1",
        bookingId: "b1",
        type: "advance",
        amount: 500,
        method: "online",
        collectedBy: "admin-1",
        notes: "Manual booking advance (online)",
        referenceNumber: null,
        createdAt: new Date(),
      },
    ]);

    expect(breakdown).toHaveLength(1);
    expect(breakdown[0]?.method).toBe("Online");
  });

  it("nets a refund against its method bucket instead of adding it as revenue", () => {
    // Regression: a refund row was being summed with `+ payment.amount` like
    // any other payment, so a refunded ₹300 showed up as +₹300 of "revenue"
    // in that method's bucket instead of cancelling out the original advance.
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
        type: "refund",
        amount: 300,
        method: "cash",
        collectedBy: null,
        notes: null,
        referenceNumber: null,
        createdAt: new Date(),
      },
    ]);

    const cash = breakdown.find((item) => item.method === "Cash");
    expect(cash?.amount).toBe(0);
  });

  it("holds a specific booking's payments out of revenue while under manual review", () => {
    const payments = [
      {
        id: "pay1",
        bookingId: "ab49cb40-72b5-4648-9ea7-47f530eb23d6", // on hold pending the owner's refund decision
        type: "advance" as const,
        amount: 200,
        method: "online" as const,
        collectedBy: null,
        notes: null,
        referenceNumber: null,
        createdAt: new Date(),
      },
      {
        id: "pay2",
        bookingId: "some-other-booking",
        type: "advance" as const,
        amount: 300,
        method: "cash" as const,
        collectedBy: null,
        notes: null,
        referenceNumber: null,
        createdAt: new Date(),
      },
    ];

    expect(excludePendingReviewPayments(payments).map((p) => p.id)).toEqual(["pay2"]);
  });

  it("breaks offline collections down by method, excluding genuine Razorpay payments", () => {
    const breakdown = buildOfflineCollectionsBreakdown([
      {
        id: "pay1",
        bookingId: "b1",
        type: "advance",
        amount: 200,
        method: "online",
        collectedBy: null, // genuine Razorpay - must be excluded from this breakdown
        notes: null,
        referenceNumber: null,
        createdAt: new Date(),
      },
      {
        id: "pay2",
        bookingId: "b1",
        type: "remaining",
        amount: 300,
        method: "cash",
        collectedBy: "admin-1",
        notes: null,
        referenceNumber: null,
        createdAt: new Date(),
      },
      {
        id: "pay3",
        bookingId: "b1",
        type: "remaining",
        amount: 100,
        method: "upi",
        collectedBy: "admin-1",
        notes: null,
        referenceNumber: null,
        createdAt: new Date(),
      },
    ]);

    expect(breakdown.find((item) => item.method === "Razorpay")).toBeUndefined();
    expect(breakdown.find((item) => item.method === "Cash")?.amount).toBe(300);
    expect(breakdown.find((item) => item.method === "UPI")?.amount).toBe(100);
  });
});
