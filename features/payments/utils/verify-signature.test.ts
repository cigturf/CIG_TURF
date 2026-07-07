import { describe, expect, it } from "vitest";
import crypto from "crypto";

import { verifyRazorpaySignature } from "@/features/payments/utils/verify-signature";

describe("verifyRazorpaySignature", () => {
  const secret = "test_secret_key";
  const orderId = "order_test123";
  const paymentId = "pay_test456";

  function sign(order: string, payment: string) {
    return crypto.createHmac("sha256", secret).update(`${order}|${payment}`).digest("hex");
  }

  it("returns true for a valid signature", () => {
    const signature = sign(orderId, paymentId);
    expect(verifyRazorpaySignature(orderId, paymentId, signature, secret)).toBe(true);
  });

  it("returns false for an invalid signature", () => {
    expect(verifyRazorpaySignature(orderId, paymentId, "invalid_signature", secret)).toBe(
      false,
    );
  });

  it("returns false when order id does not match", () => {
    const signature = sign("order_other", paymentId);
    expect(verifyRazorpaySignature(orderId, paymentId, signature, secret)).toBe(false);
  });
});
