import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/features/booking/services/booking.repository", () => ({
  getBookingBySessionId: vi.fn(),
}));

vi.mock("@/features/booking/services/slot-hold.repository", () => ({
  releaseSlotHoldsForSession: vi.fn(),
}));

vi.mock("razorpay", () => ({
  default: vi.fn().mockImplementation(() => ({
    payments: {
      refund: vi.fn().mockResolvedValue({ id: "rfnd_test" }),
    },
  })),
}));

import { getBookingBySessionId } from "@/features/booking/services/booking.repository";
import { refundOnlineAdvanceWithoutBooking } from "@/features/payments/services/payment-refund.service";

const basePayment = {
  id: "pay-1",
  bookingSessionId: "session-1",
  userId: "user-1",
  razorpayOrderId: "order_1",
  razorpayPaymentId: "pay_razorpay",
  amount: 20000,
  currency: "INR",
  status: "paid" as const,
  paymentMethod: "upi",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("refundOnlineAdvanceWithoutBooking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getBookingBySessionId).mockResolvedValue(null);
  });

  it("skips refund when a confirmed booking already exists for the session", async () => {
    vi.mocked(getBookingBySessionId).mockResolvedValue({
      id: "booking-1",
      bookingSessionId: "session-1",
    } as Awaited<ReturnType<typeof getBookingBySessionId>>);

    const result = await refundOnlineAdvanceWithoutBooking({
      payment: basePayment,
      reason: "Slots unavailable after payment",
    });

    expect(result).toBe(false);
  });
});
