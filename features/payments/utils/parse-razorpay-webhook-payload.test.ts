import { describe, expect, it } from "vitest";

import { parseRazorpayWebhookPaymentRef } from "@/features/payments/utils/parse-razorpay-webhook-payload";

describe("parseRazorpayWebhookPaymentRef", () => {
  it("parses payment.captured from payment.entity", () => {
    const parsed = parseRazorpayWebhookPaymentRef({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_1",
            order_id: "order_1",
            status: "captured",
            method: "upi",
          },
        },
      },
    });

    expect(parsed).toEqual({
      orderId: "order_1",
      paymentId: "pay_1",
      status: "captured",
      method: "upi",
    });
  });

  it("parses order.paid when payment.entity omits order_id but order.entity is present", () => {
    const parsed = parseRazorpayWebhookPaymentRef({
      event: "order.paid",
      payload: {
        order: { entity: { id: "order_1", status: "paid" } },
        payment: {
          entity: {
            id: "pay_1",
            order_id: "",
            status: "captured",
            method: "card",
          },
        },
      },
    });

    expect(parsed).toEqual({
      orderId: "order_1",
      paymentId: "pay_1",
      status: "captured",
      method: "card",
    });
  });

  it("parses payment.failed payloads", () => {
    const parsed = parseRazorpayWebhookPaymentRef({
      event: "payment.failed",
      payload: {
        payment: {
          entity: {
            id: "pay_1",
            order_id: "order_1",
            status: "failed",
          },
        },
      },
    });

    expect(parsed?.orderId).toBe("order_1");
    expect(parsed?.paymentId).toBe("pay_1");
  });

  it("returns null when order.paid has order entity but no payment id", () => {
    const parsed = parseRazorpayWebhookPaymentRef({
      event: "order.paid",
      payload: {
        order: { entity: { id: "order_1", status: "paid" } },
      },
    });

    expect(parsed).toBeNull();
  });

  it("returns null for unrelated events without payment references", () => {
    expect(
      parseRazorpayWebhookPaymentRef({
        event: "subscription.charged",
        payload: {},
      }),
    ).toBeNull();
  });
});
