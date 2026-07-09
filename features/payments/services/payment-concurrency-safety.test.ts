import { describe, expect, it, vi, beforeEach } from "vitest";

import { processRazorpayWebhook } from "@/features/payments/services/payment-webhook.service";
import { finalizeBookingFromSession } from "@/features/booking/services/booking-finalization.service";
import { handlePaymentFailure } from "@/features/payments/services/payment-lifecycle.service";

vi.mock("@/features/payments/services/payment.repository", () => ({
  getPaymentByOrderId: vi.fn(),
  getPaymentByRazorpayPaymentId: vi.fn(),
  markPaymentPaid: vi.fn(),
  getPaidPaymentBySessionId: vi.fn(),
}));

vi.mock("@/features/payments/services/payment-lifecycle.service", () => ({
  handlePaymentFailure: vi.fn(),
}));

vi.mock("@/features/payments/services/booking-session.repository", () => ({
  getBookingSessionById: vi.fn(),
  isBookingSessionExpired: vi.fn(),
  updateBookingSessionStatus: vi.fn(),
}));

vi.mock("@/features/booking/services/booking.repository", () => ({
  getBookingBySessionId: vi.fn(),
  createBookingRecord: vi.fn(),
  deleteBookingById: vi.fn(),
}));

vi.mock("@/features/booking/services/booked-slot.repository", () => ({
  getUnavailableSlotIds: vi.fn(),
  reserveBookedSlots: vi.fn(),
  releaseBookedSlotsForBooking: vi.fn(),
}));

vi.mock("@/features/booking/services/slot-hold.repository", () => ({
  releaseSlotHoldsForSession: vi.fn(),
}));

vi.mock("@/features/payments/services/payment-refund.service", () => ({
  refundOnlineAdvanceWithoutBooking: vi.fn(),
}));

vi.mock("@/features/admin/bookings/services/booking-payment.repository", () => ({
  createBookingPaymentRecord: vi.fn(),
  listPaymentRecordsForBooking: vi.fn(),
}));

vi.mock("@/features/booking/services/booking-reference.service", () => ({
  generateBookingReference: vi.fn().mockResolvedValue("CIG-CONC-001"),
}));

vi.mock("@/features/communication/services/communication-dispatcher", () => ({
  dispatchBookingConfirmedEmails: vi.fn(),
  publishCommunicationEvent: vi.fn(),
}));

import {
  getPaymentByOrderId,
  getPaymentByRazorpayPaymentId,
  markPaymentPaid,
} from "@/features/payments/services/payment.repository";
import { updateBookingSessionStatus } from "@/features/payments/services/booking-session.repository";
import { getBookingBySessionId } from "@/features/booking/services/booking.repository";

/**
 * Integration-style tests for production concurrency and payment safety.
 * Uses service mocks to simulate race conditions without a live database.
 */
describe("production concurrency and payment safety", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("duplicate webhook delivery", () => {
    it("does not re-mark payment when webhook arrives twice", async () => {
      vi.mocked(getPaymentByOrderId).mockResolvedValue({
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

      const first = await processRazorpayWebhook({
        event: "payment.captured",
        payload: {
          payment: { entity: { id: "pay_razorpay", order_id: "order_1", status: "captured" } },
        },
      });
      const second = await processRazorpayWebhook({
        event: "payment.captured",
        payload: {
          payment: { entity: { id: "pay_razorpay", order_id: "order_1", status: "captured" } },
        },
      });

      expect(first).toEqual({ ok: true, duplicate: true });
      expect(second).toEqual({ ok: true, duplicate: true });
      expect(markPaymentPaid).not.toHaveBeenCalled();
    });
  });

  describe("double-click payment / finalize retry", () => {
    it("returns existing booking without creating a second record", async () => {
      const existing = {
        id: "booking-1",
        bookingReference: "CIG-EXIST",
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
        customerPhone: "9876543210",
        customerEmail: "test@example.com",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(getBookingBySessionId).mockResolvedValue(existing);

      const result = await finalizeBookingFromSession({
        bookingSessionId: "session-1",
        userId: "user-1",
        venueName: "CIG",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.booking.id).toBe("booking-1");
      }
    });
  });

  describe("payment failure releases holds", () => {
    it("webhook payment.failed triggers lifecycle cleanup", async () => {
      await processRazorpayWebhook({
        event: "payment.failed",
        payload: {
          payment: { entity: { id: "pay_x", order_id: "order_1", status: "failed" } },
        },
      });

      expect(handlePaymentFailure).toHaveBeenCalledWith("order_1");
    });
  });

  describe("webhook + client verify coordination", () => {
    it("webhook marks session payment_completed without creating booking", async () => {
      vi.mocked(getPaymentByOrderId).mockResolvedValue({
        id: "pay-1",
        bookingSessionId: "session-1",
        userId: "user-1",
        razorpayOrderId: "order_1",
        razorpayPaymentId: null,
        amount: 20000,
        currency: "INR",
        status: "created",
        paymentMethod: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(getPaymentByRazorpayPaymentId).mockResolvedValue(null);
      vi.mocked(markPaymentPaid).mockResolvedValue({
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

      await processRazorpayWebhook({
        event: "payment.captured",
        payload: {
          payment: {
            entity: { id: "pay_razorpay", order_id: "order_1", status: "captured", method: "upi" },
          },
        },
      });

      expect(updateBookingSessionStatus).toHaveBeenCalledWith("session-1", "payment_completed");
    });
  });
});
