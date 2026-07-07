import crypto from "crypto";

import { describe, expect, it } from "vitest";

import { verifyRazorpayWebhookSignature } from "@/features/payments/utils/verify-webhook-signature";

describe("verifyRazorpayWebhookSignature", () => {
  it("accepts a valid webhook signature", () => {
    const body = '{"event":"payment.captured"}';
    const secret = "webhook_secret";
    const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");

    expect(verifyRazorpayWebhookSignature(body, signature, secret)).toBe(true);
  });

  it("rejects an invalid webhook signature", () => {
    expect(verifyRazorpayWebhookSignature("{}", "bad-signature", "secret")).toBe(false);
  });
});
