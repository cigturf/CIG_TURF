import { describe, expect, it, vi, beforeEach } from "vitest";

import { processRazorpayWebhook } from "@/features/payments/services/payment-webhook.service";
import { finalizeBookingFromSession } from "@/features/booking/services/booking-finalization.service";
import { handlePaymentFailure } from "@/features/payments/services/payment-lifecycle.service";

vi.mock("@/features/payments/services/payment.repository", () => ({
  getPaymentByOrderId: vi.fn(),
  getPaymentByRazorpayPaymentId: vi.fn(),
  markPaymentPaid: vi.fn(),
}));

vi.mock("@/features/payments/services/payment-lifecycle.service", () => ({
  handlePaymentFailure: vi.fn(),
}));

vi.mock("@/features/payments/services/booking-session.repository", () => ({
  updateBookingSessionStatus: vi.fn(),
}));

vi.mock("@/features/booking/services/booking-finalization.service", () => ({
  finalizeBookingFromPaidSessionIfNeeded: vi.fn(),
  finalizeBookingFromSession: vi.fn(),
}));

vi.mock("@/features/booking/services/booking.repository", () => ({
  getBookingBySessionId: vi.fn(),
}));

import {
  getPaymentByOrderId,
  getPaymentByRazorpayPaymentId,
  markPaymentPaid,
} from "@/features/payments/services/payment.repository";
import { updateBookingSessionStatus } from "@/features/payments/services/booking-session.repository";
import { getBookingBySessionId } from "@/features/booking/services/booking.repository";
import { finalizeBookingFromPaidSessionIfNeeded } from "@/features/booking/services/booking-finalization.service";

const basePayment = {
  id: "pay-1",
  bookingSessionId: "session-1",
  userId: "user-1",
  razorpayOrderId: "order_1",
  razorpayPaymentId: null,
  amount: 20000,
  currency: "INR",
  status: "created" as const,
  paymentMethod: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("production concurrency and payment safety", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("duplicate webhook delivery", () => {
    it("does not re-mark payment when webhook arrives twice", async () => {
      vi.mocked(getPaymentByOrderId).mockResolvedValue({
        ...basePayment,
        razorpayPaymentId: "pay_razorpay",
        status: "paid",
        paymentMethod: "upi",
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
      expect(finalizeBookingFromPaidSessionIfNeeded).toHaveBeenCalledTimes(2);
    });
  });

  describe("browser closed after payment", () => {
    it("webhook capture triggers booking finalization backup", async () => {
      vi.mocked(getPaymentByOrderId).mockResolvedValue(basePayment);
      vi.mocked(getPaymentByRazorpayPaymentId).mockResolvedValue(null);
      vi.mocked(markPaymentPaid).mockResolvedValue({
        ...basePayment,
        razorpayPaymentId: "pay_razorpay",
        status: "paid",
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
      expect(finalizeBookingFromPaidSessionIfNeeded).toHaveBeenCalledWith({
        bookingSessionId: "session-1",
        userId: "user-1",
      });
    });
  });

  describe("late payment.failed after capture", () => {
    it("routes late failure events through guarded lifecycle handler", async () => {
      await processRazorpayWebhook({
        event: "payment.failed",
        payload: {
          payment: { entity: { id: "pay_razorpay", order_id: "order_1", status: "failed" } },
        },
      });

      expect(handlePaymentFailure).toHaveBeenCalledWith("order_1");
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
      vi.mocked(finalizeBookingFromSession).mockResolvedValue({
        success: true,
        booking: existing,
      });

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
});
