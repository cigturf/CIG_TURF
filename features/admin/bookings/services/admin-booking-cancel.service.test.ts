import { describe, expect, it, vi, beforeEach } from "vitest";

import { cancelAdminBooking } from "@/features/admin/bookings/services/admin-booking.service";

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
  listPaymentRecordsForBooking: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/features/admin/bookings/services/booking-audit.repository", () => ({
  listAuditLogsForBooking: vi.fn().mockResolvedValue([]),
  createBookingAuditLog: vi.fn(),
}));

vi.mock("@/features/communication/services/communication-dispatcher", () => ({
  dispatchBookingCancelledEmails: vi.fn(),
  publishCommunicationEvent: vi.fn(),
}));

import { getBookingById, updateBookingRecord } from "@/features/booking/services/booking.repository";
import { releaseBookedSlotsForBooking } from "@/features/booking/services/booked-slot.repository";
import { getPaymentById } from "@/features/payments/services/payment.repository";
import { refundOnlineAdvanceForBooking } from "@/features/payments/services/payment-refund.service";

const actor = { userId: "admin-1", email: "admin@example.com" };

const booking = {
  id: "booking-1",
  bookingReference: "CIG-001",
  userId: "user-1",
  bookingSessionId: "session-1",
  paymentId: "pay-1",
  bookingDate: "2026-07-10",
  startTime: "18:00",
  endTime: "18:30",
  selectedSlots: ["2026-07-10-1080"],
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
  customerName: "Test",
  customerPhone: "9999999999",
  customerEmail: "test@example.com",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("cancelAdminBooking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getBookingById).mockResolvedValue(booking);
    vi.mocked(updateBookingRecord).mockResolvedValue({ ...booking, status: "cancelled" });
    vi.mocked(releaseBookedSlotsForBooking).mockResolvedValue(booking.selectedSlots);
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
  });

  it("does not refund when issueRefund is false", async () => {
    await cancelAdminBooking("booking-1", { reason: "Customer request", issueRefund: false }, actor);

    expect(refundOnlineAdvanceForBooking).not.toHaveBeenCalled();
  });

  it("refunds online advance when issueRefund is true", async () => {
    await cancelAdminBooking("booking-1", { reason: "Customer request", issueRefund: true }, actor);

    expect(refundOnlineAdvanceForBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingId: "booking-1",
        amountInr: 200,
        reason: "Customer request",
      }),
    );
  });
});
