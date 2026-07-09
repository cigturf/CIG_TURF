import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/features/booking/services/booking.repository", () => ({
  getBookingById: vi.fn(),
  updateBookingRecord: vi.fn(),
}));

vi.mock("@/features/booking/services/booked-slot.repository", () => ({
  releaseBookedSlotsForBooking: vi.fn(),
}));

vi.mock("@/features/booking/services/slot-hold.repository", () => ({
  releaseSlotHoldsForSession: vi.fn(),
}));

vi.mock("@/features/payments/services/payment.repository", () => ({
  getPaymentById: vi.fn(),
}));

vi.mock("@/features/payments/services/payment-refund.service", () => ({
  refundOnlineAdvanceForBooking: vi.fn(),
}));

vi.mock("@/features/admin/bookings/services/booking-payment.repository", () => ({
  listPaymentRecordsForBooking: vi.fn(),
  createBookingPaymentRecord: vi.fn(),
}));

vi.mock("@/features/admin/bookings/services/booking-audit.repository", () => ({
  createBookingAuditLog: vi.fn(),
  listAuditLogsForBooking: vi.fn(),
}));

vi.mock("@/features/communication/services/communication-dispatcher", () => ({
  dispatchBookingCancelledEmails: vi.fn(),
  publishCommunicationEvent: vi.fn(),
}));

import { cancelAdminBooking } from "@/features/admin/bookings/services/admin-booking.service";
import { getBookingById, updateBookingRecord } from "@/features/booking/services/booking.repository";
import { releaseBookedSlotsForBooking } from "@/features/booking/services/booked-slot.repository";
import { getPaymentById } from "@/features/payments/services/payment.repository";
import { refundOnlineAdvanceForBooking } from "@/features/payments/services/payment-refund.service";
import { listPaymentRecordsForBooking } from "@/features/admin/bookings/services/booking-payment.repository";
import { listAuditLogsForBooking } from "@/features/admin/bookings/services/booking-audit.repository";

const baseBooking = {
  id: "booking-1",
  bookingReference: "CIG-TEST-001",
  userId: "user-1",
  bookingSessionId: "session-1",
  paymentId: "pay-1",
  bookingDate: "2026-07-11",
  startTime: "2:00 PM",
  endTime: "2:30 PM",
  selectedSlots: ["2026-07-11-840"],
  durationMinutes: 30,
  totalPrice: 600,
  advancePaid: 200,
  remainingAmount: 400,
  status: "confirmed" as const,
  source: "online" as const,
  notes: null,
  cancellationReason: null,
  arrivedAt: null,
  matchStartedAt: null,
  matchCompletedAt: null,
  customerName: "Test User",
  customerPhone: "9876543210",
  customerEmail: "test@example.com",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("cancelAdminBooking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(releaseBookedSlotsForBooking).mockResolvedValue(["2026-07-11-840"]);
    vi.mocked(getBookingById).mockResolvedValue(baseBooking);
    vi.mocked(updateBookingRecord).mockResolvedValue({
      ...baseBooking,
      status: "cancelled",
      cancellationReason: "Customer request",
    });
    vi.mocked(listPaymentRecordsForBooking).mockResolvedValue([]);
    vi.mocked(getPaymentById).mockResolvedValue({
      id: "pay-1",
      bookingSessionId: "session-1",
      userId: "user-1",
      razorpayOrderId: "order_1",
      razorpayPaymentId: "pay_razorpay",
      amount: 20000,
      currency: "INR",
      status: "paid",
      paymentMethod: "upi",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(refundOnlineAdvanceForBooking).mockResolvedValue(true);
    vi.mocked(listAuditLogsForBooking).mockResolvedValue([]);
  });

  it("cancels without refund when initiateRefund is false", async () => {
    await cancelAdminBooking(
      "booking-1",
      { reason: "Customer request", initiateRefund: false },
      { userId: "admin-1" },
    );

    expect(refundOnlineAdvanceForBooking).not.toHaveBeenCalled();
    expect(updateBookingRecord).toHaveBeenCalledWith("booking-1", {
      status: "cancelled",
      cancellationReason: "Customer request",
    });
  });

  it("refunds before cancelling when initiateRefund is true", async () => {
    await cancelAdminBooking(
      "booking-1",
      { reason: "Customer request", initiateRefund: true },
      { userId: "admin-1" },
    );

    expect(refundOnlineAdvanceForBooking).toHaveBeenCalled();
    expect(updateBookingRecord).toHaveBeenCalled();
  });

  it("does not cancel when refund fails", async () => {
    vi.mocked(refundOnlineAdvanceForBooking).mockResolvedValue(false);

    await expect(
      cancelAdminBooking(
        "booking-1",
        { reason: "Customer request", initiateRefund: true },
        { userId: "admin-1" },
      ),
    ).rejects.toThrow("Refund could not be processed");

    expect(updateBookingRecord).not.toHaveBeenCalled();
  });
});
