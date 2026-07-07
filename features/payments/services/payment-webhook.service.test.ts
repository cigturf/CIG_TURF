import { describe, expect, it, vi } from "vitest";

import { processRazorpayWebhook } from "@/features/payments/services/payment-webhook.service";

vi.mock("@/features/payments/services/payment.repository", () => ({
  getPaymentByOrderId: vi.fn(),
  getPaymentByRazorpayPaymentId: vi.fn(),
  markPaymentPaid: vi.fn(),
  markPaymentFailed: vi.fn(),
}));

vi.mock("@/features/payments/services/booking-session.repository", () => ({
  updateBookingSessionStatus: vi.fn(),
}));

import {
  getPaymentByOrderId,
  getPaymentByRazorpayPaymentId,
  markPaymentPaid,
} from "@/features/payments/services/payment.repository";
import { updateBookingSessionStatus } from "@/features/payments/services/booking-session.repository";

describe("processRazorpayWebhook", () => {
  it("marks an existing payment as paid", async () => {
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

    const result = await processRazorpayWebhook({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_razorpay",
            order_id: "order_1",
            status: "captured",
            method: "upi",
          },
        },
      },
    });

    expect(result).toEqual({ ok: true, duplicate: false });
    expect(markPaymentPaid).toHaveBeenCalled();
    expect(updateBookingSessionStatus).toHaveBeenCalledWith("session-1", "payment_completed");
  });

  it("returns duplicate when payment already paid", async () => {
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

    const result = await processRazorpayWebhook({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_razorpay",
            order_id: "order_1",
            status: "captured",
          },
        },
      },
    });

    expect(result).toEqual({ ok: true, duplicate: true });
  });
});
