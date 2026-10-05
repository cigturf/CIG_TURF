import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/features/booking/services/booking.repository", () => ({
  getBookingBySessionId: vi.fn(),
}));

vi.mock("@/features/booking/services/booking-finalization.service", () => ({
  finalizeBookingFromSession: vi.fn(),
}));

vi.mock("@/features/payments/services/booking-session.repository", () => ({
  getBookingSessionById: vi.fn(),
  updateBookingSessionStatus: vi.fn(),
}));

vi.mock("@/features/payments/services/payment.repository", () => ({
  listPaidPaymentsInWindow: vi.fn(),
  listFailedPaymentsInWindow: vi.fn(),
  markPaymentPaid: vi.fn(),
}));

vi.mock("@/features/payments/services/payment-refund.service", () => ({
  refundOnlineAdvanceWithoutBooking: vi.fn(),
  findCapturedPaymentForOrder: vi.fn(),
}));

import { getBookingBySessionId } from "@/features/booking/services/booking.repository";
import { finalizeBookingFromSession } from "@/features/booking/services/booking-finalization.service";
import {
  getBookingSessionById,
  updateBookingSessionStatus,
} from "@/features/payments/services/booking-session.repository";
import {
  listFailedPaymentsInWindow,
  listPaidPaymentsInWindow,
  markPaymentPaid,
} from "@/features/payments/services/payment.repository";
import {
  findCapturedPaymentForOrder,
  refundOnlineAdvanceWithoutBooking,
} from "@/features/payments/services/payment-refund.service";
import { reconcileStuckPaidSessions } from "@/features/payments/services/payment-reconciliation.service";

const payment = {
  id: "pay-1",
  bookingSessionId: "session-1",
  userId: "user-1",
  razorpayOrderId: "order_1",
  razorpayPaymentId: "pay_razorpay",
  amount: 50000,
  currency: "INR",
  status: "paid" as const,
  paymentMethod: "upi",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const session = {
  id: "session-1",
  userId: "user-1",
  selectedDate: "2026-09-20",
  selectedSlots: ["slot-1"],
  timeRange: "08:00 – 08:30",
  slotCount: 1,
  totalDurationMinutes: 30,
  totalDurationLabel: "30 min",
  totalPrice: 500,
  advanceAmount: 500,
  remainingAmount: 0,
  profileName: "Test Customer",
  profilePhone: "9990001111",
  profileEmail: "customer@example.com",
  status: "payment_completed" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("reconcileStuckPaidSessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listPaidPaymentsInWindow).mockResolvedValue([payment]);
    vi.mocked(listFailedPaymentsInWindow).mockResolvedValue([]);
  });

  it("skips a payment whose session already has a booking", async () => {
    vi.mocked(getBookingBySessionId).mockResolvedValue({
      id: "booking-1",
    } as Awaited<ReturnType<typeof getBookingBySessionId>>);

    const result = await reconcileStuckPaidSessions();

    expect(result).toEqual({
      checked: 1,
      finalized: 0,
      refunded: 0,
      alreadyHandled: 1,
      errors: 0,
      recoveredFromFailed: 0,
    });
    expect(finalizeBookingFromSession).not.toHaveBeenCalled();
    expect(refundOnlineAdvanceWithoutBooking).not.toHaveBeenCalled();
  });

  it("skips a synthetic manual payment instead of trying to finalize or refund it", async () => {
    // Regression: a failed admin Manual Booking attempt leaves a session
    // stuck at payment_completed with a fake "manual-<uuid>" payment ID -
    // there's no real Razorpay payment to recover or refund, so this must
    // not call finalize (which would mislabel it "online") or attempt a
    // real refund against a payment ID Razorpay has never heard of.
    vi.mocked(listPaidPaymentsInWindow).mockResolvedValue([
      {
        ...payment,
        paymentMethod: "manual",
        razorpayPaymentId: "manual-48b0ee85-3905-403f-b119-8541eb693ace",
      },
    ]);
    vi.mocked(getBookingBySessionId).mockResolvedValue(null);

    const result = await reconcileStuckPaidSessions();

    expect(result.alreadyHandled).toBe(1);
    expect(result.finalized).toBe(0);
    expect(result.refunded).toBe(0);
    expect(finalizeBookingFromSession).not.toHaveBeenCalled();
    expect(refundOnlineAdvanceWithoutBooking).not.toHaveBeenCalled();
  });

  it("recovers the booking when finalize succeeds on retry", async () => {
    vi.mocked(getBookingBySessionId).mockResolvedValue(null);
    vi.mocked(getBookingSessionById).mockResolvedValue(session);
    vi.mocked(finalizeBookingFromSession).mockResolvedValue({
      success: true,
      booking: { id: "booking-1" } as never,
    });

    const result = await reconcileStuckPaidSessions();

    expect(result.finalized).toBe(1);
    expect(refundOnlineAdvanceWithoutBooking).not.toHaveBeenCalled();
    expect(updateBookingSessionStatus).not.toHaveBeenCalled();
  });

  it("self-heals a session stuck at payment_started before retrying finalize", async () => {
    vi.mocked(getBookingBySessionId).mockResolvedValue(null);
    vi.mocked(getBookingSessionById).mockResolvedValue({
      ...session,
      status: "payment_started",
    });
    vi.mocked(finalizeBookingFromSession).mockResolvedValue({
      success: true,
      booking: { id: "booking-1" } as never,
    });

    await reconcileStuckPaidSessions();

    expect(updateBookingSessionStatus).toHaveBeenCalledWith("session-1", "payment_completed");
    expect(finalizeBookingFromSession).toHaveBeenCalled();
  });

  it("refunds when finalize still fails after retry", async () => {
    vi.mocked(getBookingBySessionId).mockResolvedValue(null);
    vi.mocked(getBookingSessionById).mockResolvedValue(session);
    vi.mocked(finalizeBookingFromSession).mockResolvedValue({
      success: false,
      code: "slots_unavailable",
      message: "Slots were taken",
    });
    vi.mocked(refundOnlineAdvanceWithoutBooking).mockResolvedValue(true);

    const result = await reconcileStuckPaidSessions();

    expect(result.refunded).toBe(1);
    expect(refundOnlineAdvanceWithoutBooking).toHaveBeenCalledWith({
      payment,
      reason: "Reconciliation: Slots were taken",
    });
  });

  it("counts as already-handled when refund is a no-op (already refunded or booked)", async () => {
    vi.mocked(getBookingBySessionId).mockResolvedValue(null);
    vi.mocked(getBookingSessionById).mockResolvedValue(session);
    vi.mocked(finalizeBookingFromSession).mockResolvedValue({
      success: false,
      code: "finalize_failed",
      message: "boom",
    });
    vi.mocked(refundOnlineAdvanceWithoutBooking).mockResolvedValue(false);

    const result = await reconcileStuckPaidSessions();

    expect(result.refunded).toBe(0);
    expect(result.alreadyHandled).toBe(1);
  });

  it("refunds directly when the booking session record is missing entirely", async () => {
    vi.mocked(getBookingBySessionId).mockResolvedValue(null);
    vi.mocked(getBookingSessionById).mockResolvedValue(null);
    vi.mocked(refundOnlineAdvanceWithoutBooking).mockResolvedValue(true);

    const result = await reconcileStuckPaidSessions();

    expect(result.refunded).toBe(1);
    expect(finalizeBookingFromSession).not.toHaveBeenCalled();
  });

  it("counts an error without stopping the batch", async () => {
    vi.mocked(listPaidPaymentsInWindow).mockResolvedValue([payment, { ...payment, id: "pay-2" }]);
    vi.mocked(getBookingBySessionId)
      .mockRejectedValueOnce(new Error("db down"))
      .mockResolvedValueOnce({ id: "booking-2" } as Awaited<ReturnType<typeof getBookingBySessionId>>);

    const result = await reconcileStuckPaidSessions();

    expect(result.checked).toBe(2);
    expect(result.errors).toBe(1);
    expect(result.alreadyHandled).toBe(1);
  });

  describe("payments we recorded as failed", () => {
    const failedPayment = { ...payment, status: "failed" as const, razorpayPaymentId: null };

    beforeEach(() => {
      vi.mocked(listPaidPaymentsInWindow).mockResolvedValue([]);
      vi.mocked(listFailedPaymentsInWindow).mockResolvedValue([failedPayment]);
    });

    it("leaves a failed payment alone when Razorpay has no captured attempt for it", async () => {
      vi.mocked(findCapturedPaymentForOrder).mockResolvedValue(null);

      const result = await reconcileStuckPaidSessions();

      expect(result.checked).toBe(1);
      expect(result.recoveredFromFailed).toBe(0);
      expect(markPaymentPaid).not.toHaveBeenCalled();
    });

    it("recovers a payment that failed once but captured on a retry", async () => {
      vi.mocked(findCapturedPaymentForOrder).mockResolvedValue({
        paymentId: "pay_retry_success",
        method: "upi",
      });
      vi.mocked(markPaymentPaid).mockResolvedValue({
        ...failedPayment,
        status: "paid",
        razorpayPaymentId: "pay_retry_success",
      });
      vi.mocked(getBookingBySessionId).mockResolvedValue(null);
      vi.mocked(getBookingSessionById).mockResolvedValue(session);
      vi.mocked(finalizeBookingFromSession).mockResolvedValue({
        success: true,
        booking: { id: "booking-1" } as never,
      });

      const result = await reconcileStuckPaidSessions();

      expect(markPaymentPaid).toHaveBeenCalledWith({
        razorpayOrderId: "order_1",
        razorpayPaymentId: "pay_retry_success",
        paymentMethod: "upi",
      });
      expect(result.recoveredFromFailed).toBe(1);
      expect(result.finalized).toBe(1);
    });
  });
});
