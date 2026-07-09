import { describe, expect, it, vi, beforeEach } from "vitest";

import { handlePaymentFailure } from "@/features/payments/services/payment-lifecycle.service";

vi.mock("@/features/payments/services/payment.repository", () => ({
  getPaymentByOrderId: vi.fn(),
  markPaymentFailed: vi.fn(),
}));

vi.mock("@/features/booking/services/slot-hold.repository", () => ({
  releaseSlotHoldsForSession: vi.fn(),
}));

vi.mock("@/features/booking/services/booking.repository", () => ({
  getBookingBySessionId: vi.fn(),
}));

vi.mock("@/features/payments/services/booking-session.repository", () => ({
  getBookingSessionById: vi.fn(),
  updateBookingSessionStatus: vi.fn(),
}));

import { getPaymentByOrderId, markPaymentFailed } from "@/features/payments/services/payment.repository";
import { releaseSlotHoldsForSession } from "@/features/booking/services/slot-hold.repository";
import { getBookingBySessionId } from "@/features/booking/services/booking.repository";
import {
  getBookingSessionById,
  updateBookingSessionStatus,
} from "@/features/payments/services/booking-session.repository";

const basePayment = {
  id: "pay-1",
  bookingSessionId: "session-1",
  userId: "user-1",
  razorpayOrderId: "order_1",
  razorpayPaymentId: "pay_razorpay",
  amount: 20000,
  currency: "INR",
  status: "created" as const,
  paymentMethod: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("handlePaymentFailure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks payment failed and releases slot holds", async () => {
    vi.mocked(getPaymentByOrderId).mockResolvedValue({
      ...basePayment,
      razorpayPaymentId: null,
    });
    vi.mocked(getBookingSessionById).mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      selectedDate: "2026-07-10",
      selectedSlots: [],
      timeRange: null,
      slotCount: 1,
      totalDurationMinutes: 30,
      totalDurationLabel: "30 min",
      totalPrice: 600,
      advanceAmount: 200,
      remainingAmount: 400,
      profileName: "Test",
      profilePhone: "9999999999",
      profileEmail: "test@example.com",
      status: "payment_started",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(getBookingBySessionId).mockResolvedValue(null);

    await handlePaymentFailure("order_1");

    expect(markPaymentFailed).toHaveBeenCalledWith("order_1");
    expect(releaseSlotHoldsForSession).toHaveBeenCalledWith("session-1");
    expect(updateBookingSessionStatus).toHaveBeenCalledWith("session-1", "failed");
  });

  it("is a no-op when payment is already paid", async () => {
    vi.mocked(getPaymentByOrderId).mockResolvedValue({
      ...basePayment,
      status: "paid",
    });

    await handlePaymentFailure("order_1");

    expect(markPaymentFailed).not.toHaveBeenCalled();
    expect(releaseSlotHoldsForSession).not.toHaveBeenCalled();
    expect(updateBookingSessionStatus).not.toHaveBeenCalled();
  });

  it("is a no-op when session is already payment_completed", async () => {
    vi.mocked(getPaymentByOrderId).mockResolvedValue({
      ...basePayment,
      razorpayPaymentId: null,
    });
    vi.mocked(getBookingSessionById).mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      selectedDate: "2026-07-10",
      selectedSlots: [],
      timeRange: null,
      slotCount: 1,
      totalDurationMinutes: 30,
      totalDurationLabel: "30 min",
      totalPrice: 600,
      advanceAmount: 200,
      remainingAmount: 400,
      profileName: "Test",
      profilePhone: "9999999999",
      profileEmail: "test@example.com",
      status: "payment_completed",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await handlePaymentFailure("order_1");

    expect(markPaymentFailed).not.toHaveBeenCalled();
    expect(releaseSlotHoldsForSession).not.toHaveBeenCalled();
    expect(updateBookingSessionStatus).not.toHaveBeenCalled();
  });

  it("is a no-op when booking is already finalized", async () => {
    vi.mocked(getPaymentByOrderId).mockResolvedValue({
      ...basePayment,
      razorpayPaymentId: null,
    });
    vi.mocked(getBookingSessionById).mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      selectedDate: "2026-07-10",
      selectedSlots: [],
      timeRange: null,
      slotCount: 1,
      totalDurationMinutes: 30,
      totalDurationLabel: "30 min",
      totalPrice: 600,
      advanceAmount: 200,
      remainingAmount: 400,
      profileName: "Test",
      profilePhone: "9999999999",
      profileEmail: "test@example.com",
      status: "payment_started",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(getBookingBySessionId).mockResolvedValue({
      id: "booking-1",
      bookingReference: "CIG-1",
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
      status: "confirmed",
      source: "online",
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
    });

    await handlePaymentFailure("order_1");

    expect(markPaymentFailed).not.toHaveBeenCalled();
    expect(releaseSlotHoldsForSession).not.toHaveBeenCalled();
    expect(updateBookingSessionStatus).not.toHaveBeenCalled();
  });
});
