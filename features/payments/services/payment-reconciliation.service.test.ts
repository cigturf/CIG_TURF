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
}));

vi.mock("@/features/payments/services/payment-refund.service", () => ({
  refundOnlineAdvanceWithoutBooking: vi.fn(),
}));

import { getBookingBySessionId } from "@/features/booking/services/booking.repository";
import { finalizeBookingFromSession } from "@/features/booking/services/booking-finalization.service";
import {
  getBookingSessionById,
  updateBookingSessionStatus,
} from "@/features/payments/services/booking-session.repository";
import { listPaidPaymentsInWindow } from "@/features/payments/services/payment.repository";
import { refundOnlineAdvanceWithoutBooking } from "@/features/payments/services/payment-refund.service";
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
  });

  it("skips a payment whose session already has a booking", async () => {
    vi.mocked(getBookingBySessionId).mockResolvedValue({
      id: "booking-1",
    } as Awaited<ReturnType<typeof getBookingBySessionId>>);

    const result = await reconcileStuckPaidSessions();

    expect(result).toEqual({ checked: 1, finalized: 0, refunded: 0, alreadyHandled: 1, errors: 0 });
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
});
