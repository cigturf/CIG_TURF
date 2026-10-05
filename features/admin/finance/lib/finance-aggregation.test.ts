import { describe, expect, it } from "vitest";

import type { AdminBookingRecord } from "@/features/admin/bookings/types/admin-booking.types";
import {
  buildBookingCounts,
  buildDailyClosing,
  buildFinanceBookingDetails,
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
  it("builds overview totals from the period's own bookings and payments", () => {
    const overview = buildFinanceOverview({
      periodBookingPayments: [
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
      periodBookings: [createBooking({ totalPrice: 1200, remainingAmount: 1000 })],
    });

    expect(overview.totalAmount).toBe(1200);
    expect(overview.collectedAmount).toBe(200);
    expect(overview.onlineCollections).toBe(200);
    expect(overview.pendingCollections).toBe(1000);
  });

  it("scopes pending and collected totals to the selected period's bookings, not the payment date", () => {
    // Booking is scheduled inside the selected period, but its advance was paid
    // days before the period started (a routine occurrence: customers pay to
    // book in advance). The period's payments must still be counted for it.
    const overview = buildFinanceOverview({
      periodBookingPayments: [
        {
          id: "p1",
          bookingId: "b1",
          type: "advance",
          amount: 200,
          method: "online",
          collectedBy: null,
          notes: null,
          referenceNumber: null,
          createdAt: new Date("2026-06-20T10:00:00Z"),
        },
      ],
      periodBookings: [createBooking({ bookingDate: "2026-07-07", remainingAmount: 1000 })],
    });

    expect(overview.onlineCollections).toBe(200);
    expect(overview.pendingCollections).toBe(1000);
    expect(overview.averageBookingValue).toBe(200);
  });

  it("excludes cancelled bookings from period totals, pending, and average value", () => {
    const overview = buildFinanceOverview({
      periodBookingPayments: [],
      periodBookings: [
        createBooking({ id: "b1", status: "cancelled", totalPrice: 1200, remainingAmount: 1000 }),
        createBooking({ id: "b2", status: "confirmed", totalPrice: 900, remainingAmount: 500 }),
      ],
    });

    expect(overview.totalAmount).toBe(900);
    expect(overview.pendingCollections).toBe(500);
    expect(overview.averageBookingValue).toBe(0);
    expect(overview.cancelledAmount).toBe(1200);
    expect(overview.grossBookingValue).toBe(2100);
  });

  it("counts a cancelled booking's collected money when it was never refunded", () => {
    // Regression: a cancelled booking's advance that the venue kept (no
    // refund issued) is real revenue - it must not be dropped from Collected
    // just because the booking itself was cancelled.
    const overview = buildFinanceOverview({
      periodBookingPayments: [
        {
          id: "p1",
          bookingId: "b1", // cancelled booking, kept (no refund)
          type: "advance",
          amount: 200,
          method: "cash",
          collectedBy: null,
          notes: null,
          referenceNumber: null,
          createdAt: new Date("2026-07-01T00:00:00Z"),
        },
        {
          id: "p2",
          bookingId: "b2", // active booking
          type: "advance",
          amount: 300,
          method: "cash",
          collectedBy: null,
          notes: null,
          referenceNumber: null,
          createdAt: new Date("2026-07-01T00:00:00Z"),
        },
      ],
      periodBookings: [
        createBooking({ id: "b1", status: "cancelled", totalPrice: 1200 }),
        createBooking({ id: "b2", status: "confirmed", totalPrice: 900 }),
      ],
    });

    expect(overview.collectedAmount).toBe(500);
    expect(overview.offlineCollections).toBe(500);
    expect(overview.advanceCollected).toBe(500);
  });

  it("buckets an admin-recorded 'online' collection as offline, not Razorpay", () => {
    const overview = buildFinanceOverview({
      periodBookingPayments: [
        {
          id: "p1",
          bookingId: "b1",
          type: "remaining",
          amount: 300,
          method: "online",
          collectedBy: "admin-1",
          notes: null,
          referenceNumber: null,
          createdAt: new Date("2026-07-01T00:00:00Z"),
        },
      ],
      periodBookings: [createBooking({ id: "b1", status: "confirmed", totalPrice: 900 })],
    });

    expect(overview.onlineCollections).toBe(0);
    expect(overview.offlineCollections).toBe(300);
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

  it("reconciles cleanly when a booking's advance was paid before the selected period", () => {
    // Regression: reconciliation must compare a booking's own payments against
    // its own totals, not payments that merely fall inside the date range.
    const reconciliation = buildReconciliation({
      bookings: [createBooking({ totalPrice: 1200, advancePaid: 200, remainingAmount: 1000 })],
      payments: [
        {
          id: "p1",
          bookingId: "b1",
          type: "advance",
          amount: 200,
          method: "online",
          collectedBy: null,
          notes: null,
          referenceNumber: null,
          createdAt: new Date("2026-06-01T00:00:00Z"),
        },
      ],
    });

    expect(reconciliation.expectedRevenue).toBe(1200);
    expect(reconciliation.collectedRevenue).toBe(200);
    expect(reconciliation.outstandingRevenue).toBe(1000);
    expect(reconciliation.hasDiscrepancy).toBe(false);
  });

  it("counts a kept (unrefunded) cancelled booking's advance as collected, not a discrepancy", () => {
    const reconciliation = buildReconciliation({
      bookings: [createBooking({ id: "b1", status: "cancelled", totalPrice: 1200, remainingAmount: 1000 })],
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
          createdAt: new Date("2026-07-01T00:00:00Z"),
        },
      ],
    });

    expect(reconciliation.expectedRevenue).toBe(200);
    expect(reconciliation.collectedRevenue).toBe(200);
    expect(reconciliation.outstandingRevenue).toBe(0);
    expect(reconciliation.hasDiscrepancy).toBe(false);
  });

  it("nets a refunded cancelled booking's advance out of both expected and collected", () => {
    const reconciliation = buildReconciliation({
      bookings: [createBooking({ id: "b1", status: "cancelled", totalPrice: 1200, remainingAmount: 1000 })],
      payments: [
        {
          id: "p1",
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
          id: "p2",
          bookingId: "b1",
          type: "refund",
          amount: 200,
          method: "online",
          collectedBy: "admin-1",
          notes: null,
          referenceNumber: "pay_abc123",
          createdAt: new Date("2026-07-02T00:00:00Z"),
        },
      ],
    });

    expect(reconciliation.expectedRevenue).toBe(0);
    expect(reconciliation.collectedRevenue).toBe(0);
    expect(reconciliation.outstandingRevenue).toBe(0);
    expect(reconciliation.hasDiscrepancy).toBe(false);
  });

  it("counts bookings in the period by status and source, with value by source", () => {
    const counts = buildBookingCounts([
      createBooking({ id: "b1", status: "confirmed", source: "online", totalPrice: 1200 }),
      createBooking({ id: "b2", status: "completed", source: "online", totalPrice: 1200 }),
      createBooking({ id: "b3", status: "completed", source: "manual", totalPrice: 800 }),
      // Cancelled bookings must not count toward active totals or source values.
      createBooking({ id: "b4", status: "cancelled", source: "manual", totalPrice: 5000 }),
    ]);

    expect(counts.totalBookings).toBe(4);
    expect(counts.activeBookings).toBe(3);
    expect(counts.completedBookings).toBe(2);
    expect(counts.cancelledBookings).toBe(1);
    expect(counts.onlineBookings).toBe(2);
    expect(counts.onlineBookingsValue).toBe(2400);
    expect(counts.manualBookings).toBe(1);
    expect(counts.manualBookingsValue).toBe(800);
  });

  it("builds a full per-booking detail row with advance/balance method and reference id", () => {
    const [detail] = buildFinanceBookingDetails(
      [createBooking({ id: "b1", totalPrice: 1200, advancePaid: 200, remainingAmount: 0 })],
      [
        {
          id: "p1",
          bookingId: "b1",
          type: "advance",
          amount: 200,
          method: "online",
          collectedBy: null,
          notes: null,
          referenceNumber: "pay_RZP123",
          createdAt: new Date("2026-07-01T00:00:00Z"),
        },
        {
          id: "p2",
          bookingId: "b1",
          type: "remaining",
          amount: 1000,
          method: "cash",
          collectedBy: "admin1",
          notes: null,
          referenceNumber: null,
          createdAt: new Date("2026-07-07T18:00:00Z"),
        },
      ],
    );

    expect(detail?.advanceAmount).toBe(200);
    expect(detail?.advanceMethod).toBe("Razorpay");
    expect(detail?.advanceReferenceId).toBe("pay_RZP123");
    expect(detail?.balanceDue).toBe(0);
    expect(detail?.balancePaidAmount).toBe(1000);
    expect(detail?.balanceStatus).toBe("paid");
    expect(detail?.balanceMethod).toBe("Cash");
    expect(detail?.isCompleted).toBe(false);
  });

  it("reports the real advance from the payment ledger, not booking.advancePaid once it's been inflated by a later collection", () => {
    // Regression: collectBookingPayment (admin-booking.service.ts) does
    // `advancePaid: booking.advancePaid + amount` every time a remaining
    // balance is collected, so advancePaid ends up equal to totalPrice once
    // a booking is fully paid - it stops meaning "the advance" at all. The
    // booking detail report must use the ledger's own "advance" rows instead.
    // Fixture mirrors a real, corrected booking: a genuine ₹200 Razorpay
    // advance plus a separate ₹200 UPI advance recorded later. The old Edit
    // Amounts bug used to merge both into one fabricated ₹400 "online" row;
    // they've since been split back into their own rows.
    const [detail] = buildFinanceBookingDetails(
      [createBooking({ id: "b1", totalPrice: 1800, advancePaid: 1800, remainingAmount: 0 })],
      [
        {
          id: "p1",
          bookingId: "b1",
          type: "advance",
          amount: 200,
          method: "online",
          collectedBy: null,
          notes: null,
          referenceNumber: "pay_ThkvYmwU4Z0A0S",
          createdAt: new Date("2026-09-29T06:41:53Z"),
        },
        {
          id: "p2",
          bookingId: "b1",
          type: "advance",
          amount: 200,
          method: "upi",
          collectedBy: "admin1",
          notes: null,
          referenceNumber: null,
          createdAt: new Date("2026-09-29T06:41:54Z"),
        },
        {
          id: "p3",
          bookingId: "b1",
          type: "remaining",
          amount: 900,
          method: "upi",
          collectedBy: "admin1",
          notes: null,
          referenceNumber: null,
          createdAt: new Date("2026-10-05T11:46:16Z"),
        },
        {
          id: "p4",
          bookingId: "b1",
          type: "remaining",
          amount: 500,
          method: "cash",
          collectedBy: "admin1",
          notes: null,
          referenceNumber: null,
          createdAt: new Date("2026-10-05T11:46:27Z"),
        },
      ],
    );

    expect(detail?.advanceAmount).toBe(400);
    expect(detail?.advanceMethod).toContain("Razorpay");
    expect(detail?.advanceMethod).toContain("UPI");
    expect(detail?.balancePaidAmount).toBe(1400);
    // Collected across two different methods - both should be visible,
    // not just whichever payment happens to sort first/last.
    expect(detail?.balanceMethod).toContain("UPI");
    expect(detail?.balanceMethod).toContain("Cash");
  });

  it("marks a booking's balance as pending or not required depending on what's left owing", () => {
    const [pendingBooking, fullyAdvancePaidBooking] = buildFinanceBookingDetails(
      [
        createBooking({ id: "b1", totalPrice: 1200, advancePaid: 200, remainingAmount: 1000 }),
        createBooking({ id: "b2", totalPrice: 200, advancePaid: 200, remainingAmount: 0 }),
      ],
      [
        {
          id: "p1",
          bookingId: "b2",
          type: "advance",
          amount: 200,
          method: "upi",
          collectedBy: null,
          notes: null,
          referenceNumber: null,
          createdAt: new Date("2026-07-01T00:00:00Z"),
        },
      ],
    );

    expect(pendingBooking?.balanceStatus).toBe("pending");
    expect(pendingBooking?.balanceMethod).toBe("—");
    // Advance alone covered the full price — no "remaining" payment was ever needed.
    expect(fullyAdvancePaidBooking?.balanceStatus).toBe("not_required");
    expect(fullyAdvancePaidBooking?.balanceMethod).toBe("—");
  });
});
