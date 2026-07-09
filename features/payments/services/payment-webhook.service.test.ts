import { describe, expect, it, vi, beforeEach } from "vitest";

import { processRazorpayWebhook } from "@/features/payments/services/payment-webhook.service";

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
}));

vi.mock("@/features/booking/services/booking.repository", () => ({
  getBookingBySessionId: vi.fn(),
}));

import {
  getPaymentByOrderId,
  getPaymentByRazorpayPaymentId,
  markPaymentPaid,
} from "@/features/payments/services/payment.repository";
import { handlePaymentFailure } from "@/features/payments/services/payment-lifecycle.service";
import { updateBookingSessionStatus } from "@/features/payments/services/booking-session.repository";
import { finalizeBookingFromPaidSessionIfNeeded } from "@/features/booking/services/booking-finalization.service";
import { getBookingBySessionId } from "@/features/booking/services/booking.repository";

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

describe("processRazorpayWebhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getBookingBySessionId).mockResolvedValue(null);
  });

  it("marks an existing payment as paid and finalizes booking", async () => {
    vi.mocked(getPaymentByOrderId).mockResolvedValue(basePayment);
    vi.mocked(getPaymentByRazorpayPaymentId).mockResolvedValue(null);
    vi.mocked(markPaymentPaid).mockResolvedValue({
      ...basePayment,
      razorpayPaymentId: "pay_razorpay",
      status: "paid",
      paymentMethod: "upi",
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
    expect(finalizeBookingFromPaidSessionIfNeeded).toHaveBeenCalledWith({
      bookingSessionId: "session-1",
      userId: "user-1",
    });
  });

  it("processes order.paid payloads", async () => {
    vi.mocked(getPaymentByOrderId).mockResolvedValue(basePayment);
    vi.mocked(getPaymentByRazorpayPaymentId).mockResolvedValue(null);
    vi.mocked(markPaymentPaid).mockResolvedValue({
      ...basePayment,
      razorpayPaymentId: "pay_razorpay",
      status: "paid",
    });

    const result = await processRazorpayWebhook({
      event: "order.paid",
      payload: {
        order: { entity: { id: "order_1", status: "paid" } },
        payment: {
          entity: { id: "pay_razorpay", order_id: "order_1", status: "captured" },
        },
      },
    });

    expect(result.ok).toBe(true);
    expect(finalizeBookingFromPaidSessionIfNeeded).toHaveBeenCalled();
  });

  it("returns duplicate when payment already paid and skips finalize if booking exists", async () => {
    vi.mocked(getPaymentByOrderId).mockResolvedValue({
      ...basePayment,
      razorpayPaymentId: "pay_razorpay",
      status: "paid",
      paymentMethod: "upi",
    });
    vi.mocked(getBookingBySessionId).mockResolvedValue({
      id: "booking-1",
      bookingSessionId: "session-1",
    } as Awaited<ReturnType<typeof getBookingBySessionId>>);

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
    expect(markPaymentPaid).not.toHaveBeenCalled();
    expect(finalizeBookingFromPaidSessionIfNeeded).not.toHaveBeenCalled();
  });

  it("returns duplicate when payment already paid and still ensures finalize without booking", async () => {
    vi.mocked(getPaymentByOrderId).mockResolvedValue({
      ...basePayment,
      razorpayPaymentId: "pay_razorpay",
      status: "paid",
      paymentMethod: "upi",
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
    expect(markPaymentPaid).not.toHaveBeenCalled();
    expect(finalizeBookingFromPaidSessionIfNeeded).toHaveBeenCalledWith({
      bookingSessionId: "session-1",
      userId: "user-1",
    });
  });

  it("rejects webhook when payment amount mismatches", async () => {
    vi.mocked(getPaymentByOrderId).mockResolvedValue({ ...basePayment, amount: 100 });

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

    expect(result).toEqual({ ok: false, error: "Payment amount mismatch", status: 400 });
    expect(markPaymentPaid).not.toHaveBeenCalled();
  });

  it("delegates payment.failed to lifecycle handler", async () => {
    const result = await processRazorpayWebhook({
      event: "payment.failed",
      payload: {
        payment: {
          entity: {
            id: "pay_razorpay",
            order_id: "order_1",
            status: "failed",
          },
        },
      },
    });

    expect(result).toEqual({ ok: true, duplicate: false });
    expect(handlePaymentFailure).toHaveBeenCalledWith("order_1");
  });

  it("rejects invalid order.paid payloads without payment id", async () => {
    const result = await processRazorpayWebhook({
      event: "order.paid",
      payload: {
        order: { entity: { id: "order_1", status: "paid" } },
      },
    });

    expect(result).toEqual({ ok: false, error: "Invalid webhook payload", status: 400 });
  });
});
