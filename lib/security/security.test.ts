import crypto from "crypto";

import { describe, expect, it } from "vitest";

import { hasAdminPermission } from "@/features/admin/config/admin-permissions";
import { verifyRazorpaySignature } from "@/features/payments/utils/verify-signature";
import {
  buildRateLimitKey,
  checkRateLimit,
  resetRateLimitsForTests,
  shouldRateLimitRequest,
} from "@/lib/security/rate-limit";
import { escapeHtml, sanitizeRichText } from "@/lib/security/sanitize";

describe("admin authorization", () => {
  it("allows owner full access", () => {
    expect(hasAdminPermission("owner", "finance.view")).toBe(true);
    expect(hasAdminPermission("owner", "audit.view")).toBe(true);
  });

  it("restricts staff to booking visibility", () => {
    expect(hasAdminPermission("staff", "bookings.view")).toBe(true);
    expect(hasAdminPermission("staff", "finance.view")).toBe(false);
    expect(hasAdminPermission("staff", "settings.manage")).toBe(false);
  });
});

describe("rate limiting", () => {
  it("only applies to mutating HTTP methods", () => {
    expect(shouldRateLimitRequest("GET")).toBe(false);
    expect(shouldRateLimitRequest("HEAD")).toBe(false);
    expect(shouldRateLimitRequest("POST")).toBe(true);
    expect(shouldRateLimitRequest("PUT")).toBe(true);
    expect(shouldRateLimitRequest("DELETE")).toBe(true);
  });

  it("blocks requests after the configured limit", () => {
    resetRateLimitsForTests();
    const key = buildRateLimitKey("auth", "127.0.0.1");
    const config = { limit: 2, windowMs: 60_000 };

    expect(checkRateLimit(key, config).ok).toBe(true);
    expect(checkRateLimit(key, config).ok).toBe(true);
    const blocked = checkRateLimit(key, config);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    }
  });
});

describe("payment signature verification", () => {
  it("accepts valid signatures with timing-safe comparison", () => {
    const secret = "test_secret";
    const orderId = "order_123";
    const paymentId = "pay_456";
    const signature = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    expect(verifyRazorpaySignature(orderId, paymentId, signature, secret)).toBe(true);
    expect(verifyRazorpaySignature(orderId, paymentId, "invalid", secret)).toBe(false);
  });
});

describe("xss sanitization", () => {
  it("escapes html entities", () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;&#x2F;script&gt;",
    );
  });

  it("strips script tags from rich text", () => {
    expect(sanitizeRichText('Hello <script>alert(1)</script> world')).toBe("Hello  world");
  });
});
