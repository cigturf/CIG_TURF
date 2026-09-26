import { describe, expect, it, vi } from "vitest";

/**
 * Regression coverage for a real production bug: a Razorpay order can take
 * more than one payment attempt (declined card, UPI timeout, then a
 * successful retry). The first attempt's payment.failed webhook marks our
 * payment row status="failed"; markPaymentPaid's own UPDATE must still be
 * able to move that same row to "paid" when the retry captures — it used to
 * only allow the transition from "created", silently orphaning a genuinely
 * captured payment with no booking and no refund.
 */

const calls: { method: string; args: unknown[] }[] = [];

function makeChainableQuery(resolvedRow: Record<string, unknown> | null) {
  const chain: Record<string, unknown> = {};
  const methods = ["update", "eq", "neq", "in", "select"];
  for (const method of methods) {
    chain[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return chain;
    };
  }
  chain.single = () =>
    Promise.resolve(
      resolvedRow ? { data: resolvedRow, error: null } : { data: null, error: { message: "no rows" } },
    );
  return chain;
}

vi.mock("@/lib/supabase/admin", () => ({
  createServiceRoleClient: vi.fn(),
}));

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { markPaymentPaid } from "@/features/payments/services/payment.repository";

describe("markPaymentPaid", () => {
  it("does not filter out a payment stuck at status='failed' from a prior attempt", async () => {
    calls.length = 0;
    const paidRow = {
      id: "pay-1",
      booking_session_id: "session-1",
      user_id: "user-1",
      razorpay_order_id: "order_1",
      razorpay_payment_id: "pay_retry_success",
      amount: 20000,
      currency: "INR",
      status: "paid",
      payment_method: "upi",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    vi.mocked(createServiceRoleClient).mockReturnValue({
      from: () => makeChainableQuery(paidRow),
    } as never);

    const result = await markPaymentPaid({
      razorpayOrderId: "order_1",
      razorpayPaymentId: "pay_retry_success",
    });

    expect(result?.status).toBe("paid");

    const inCall = calls.find((c) => c.method === "in" && c.args[0] === "status");
    expect(inCall).toBeUndefined();

    const neqCall = calls.find((c) => c.method === "neq");
    expect(neqCall?.args).toEqual(["status", "paid"]);
  });
});
