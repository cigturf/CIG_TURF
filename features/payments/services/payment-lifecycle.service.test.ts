import { describe, expect, it, vi, beforeEach } from "vitest";

import { handlePaymentFailure } from "@/features/payments/services/payment-lifecycle.service";

vi.mock("@/features/payments/services/payment.repository", () => ({
  getPaymentByOrderId: vi.fn(),
  markPaymentFailed: vi.fn(),
}));

vi.mock("@/features/booking/services/slot-hold.repository", () => ({
  releaseSlotHoldsForSession: vi.fn(),
}));

vi.mock("@/features/payments/services/booking-session.repository", () => ({
  updateBookingSessionStatus: vi.fn(),
}));

import { getPaymentByOrderId, markPaymentFailed } from "@/features/payments/services/payment.repository";
import { releaseSlotHoldsForSession } from "@/features/booking/services/slot-hold.repository";
import { updateBookingSessionStatus } from "@/features/payments/services/booking-session.repository";

describe("handlePaymentFailure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks payment failed and releases slot holds", async () => {
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

    await handlePaymentFailure("order_1");

    expect(markPaymentFailed).toHaveBeenCalledWith("order_1");
    expect(releaseSlotHoldsForSession).toHaveBeenCalledWith("session-1");
    expect(updateBookingSessionStatus).toHaveBeenCalledWith("session-1", "failed");
  });
});
