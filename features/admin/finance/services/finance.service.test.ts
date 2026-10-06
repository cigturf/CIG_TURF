import { describe, expect, it, vi } from "vitest";

import type { AdminBookingRecord, BookingPaymentRecord } from "@/features/admin/bookings/types/admin-booking.types";

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

function payment(overrides: Partial<BookingPaymentRecord>): BookingPaymentRecord {
  return {
    id: "pay-x",
    bookingId: "b1",
    type: "remaining",
    amount: 100,
    method: "cash",
    collectedBy: "admin-1",
    notes: null,
    referenceNumber: null,
    createdAt: new Date("2026-07-07T10:00:00Z"),
    ...overrides,
  };
}

describe("getFinanceDashboardData", () => {
  it("builds the offline collections breakdown from the same payments as the overview total, so they always agree", async () => {
    // Regression: the breakdown used to be built from a payment-date-scoped
    // population while the overview total used a booking-date-scoped one -
    // two different populations that can (and did, in production) disagree,
    // showing e.g. "Offline Collections: ₹7,750" next to a breakdown whose
    // rows summed to well over ₹27,000.
    const bookings = [createBooking({ id: "b1" })];
    const bookingPayments = [
      payment({ id: "p1", bookingId: "b1", method: "cash", amount: 300 }),
      payment({ id: "p2", bookingId: "b1", method: "upi", amount: 200 }),
    ];
    // Deliberately a DIFFERENT population (different amount) to prove the
    // breakdown must not be built from this one.
    const dateScopedPayments = [payment({ id: "p3", bookingId: "b1", method: "cash", amount: 9999 })];

    vi.doMock("@/features/admin/finance/services/finance-data.repository", () => ({
      listAllPaymentRecordsInRange: vi.fn().mockResolvedValue(dateScopedPayments),
      listBookingsInRange: vi.fn().mockResolvedValue(bookings),
      listPendingCollectionBookings: vi.fn().mockResolvedValue([]),
      listPaymentRecordsForBookingIds: vi.fn().mockResolvedValue(bookingPayments),
      listBookingsByIds: vi.fn().mockResolvedValue([]),
    }));

    const { getFinanceDashboardData } = await import("@/features/admin/finance/services/finance.service");
    const data = await getFinanceDashboardData("last_7_days");

    const breakdownTotal = data.offlineCollectionsBreakdown.reduce((sum, item) => sum + item.amount, 0);
    expect(breakdownTotal).toBe(data.overview.offlineCollections);
    expect(data.overview.offlineCollections).toBe(500);

    vi.doUnmock("@/features/admin/finance/services/finance-data.repository");
    vi.resetModules();
  });
});
