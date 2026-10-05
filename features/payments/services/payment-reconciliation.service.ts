import { getAppConfig } from "@/config/app.config";
import { getBookingBySessionId } from "@/features/booking/services/booking.repository";
import { finalizeBookingFromSession } from "@/features/booking/services/booking-finalization.service";
import {
  getBookingSessionById,
  updateBookingSessionStatus,
} from "@/features/payments/services/booking-session.repository";
import {
  listFailedPaymentsInWindow,
  listPaidPaymentsInWindow,
  markPaymentPaid,
} from "@/features/payments/services/payment.repository";
import {
  findCapturedPaymentForOrder,
  refundOnlineAdvanceWithoutBooking,
} from "@/features/payments/services/payment-refund.service";
import type { PaymentRecord } from "@/features/payments/types/payment.types";
import { safeLogError, safeLogInfo } from "@/lib/security/safe-logger";

export type ReconciliationResult = {
  checked: number;
  finalized: number;
  refunded: number;
  alreadyHandled: number;
  errors: number;
  /** Payments we'd recorded as "failed" that Razorpay confirms actually captured on a retry. */
  recoveredFromFailed: number;
};

type RecoveryOutcome = "finalized" | "refunded" | "alreadyHandled";

/**
 * Given a payment we're confident is genuinely paid, try to produce the
 * booking it should have produced — self-healing the session status and
 * retrying finalize first (the slot may still be free, the common case for a
 * one-off client failure), refunding only if that still doesn't work. Both
 * finalize and refund are idempotent, so re-running this on the same payment
 * is always safe.
 */
async function recoverPaidPayment(
  payment: PaymentRecord,
  venueName: string,
  reasonPrefix: string,
): Promise<RecoveryOutcome> {
  const existingBooking = await getBookingBySessionId(payment.bookingSessionId);
  if (existingBooking) return "alreadyHandled";

  // A synthetic "manual-<uuid>" payment never went through Razorpay — it's a
  // failed admin Manual Booking attempt, not a captured payment with real
  // money to protect. Nothing to finalize (finalizeBookingFromSession now
  // refuses it) and nothing to refund (there's no real Razorpay payment ID
  // to refund), so there's nothing for reconciliation to do here.
  if (payment.paymentMethod === "manual" || payment.razorpayPaymentId?.startsWith("manual-")) {
    return "alreadyHandled";
  }

  const session = await getBookingSessionById(payment.bookingSessionId);
  if (!session) {
    const refunded = await refundOnlineAdvanceWithoutBooking({
      payment,
      reason: `${reasonPrefix}: booking session record missing`,
    });
    return refunded ? "refunded" : "alreadyHandled";
  }

  // Payment is confirmed paid, but the session may never have been marked
  // payment_completed if the client dropped out between verify() and
  // finalize() — self-heal that so finalize doesn't reject a genuinely-paid
  // session as "unverified".
  if (session.status !== "payment_completed") {
    await updateBookingSessionStatus(session.id, "payment_completed");
  }

  const finalizeResult = await finalizeBookingFromSession({
    bookingSessionId: payment.bookingSessionId,
    userId: payment.userId,
    venueName,
  });

  if (finalizeResult.success) {
    safeLogInfo("payment-reconciliation", "Recovered stuck booking", {
      sessionId: payment.bookingSessionId,
      bookingId: finalizeResult.booking.id,
    });
    return "finalized";
  }

  // Still can't finalize — the payment is confirmed paid, so the money must
  // come back. refundOnlineAdvanceWithoutBooking() no-ops (returns false) if
  // a booking now exists or this payment was already refunded — e.g.
  // finalize's own internal handling just did it — so it's safe to call
  // unconditionally rather than branching on the failure code.
  const refunded = await refundOnlineAdvanceWithoutBooking({
    payment,
    reason: `${reasonPrefix}: ${finalizeResult.message}`,
  });
  return refunded ? "refunded" : "alreadyHandled";
}

function applyOutcome(result: ReconciliationResult, outcome: RecoveryOutcome): void {
  if (outcome === "finalized") result.finalized += 1;
  else if (outcome === "refunded") result.refunded += 1;
  else result.alreadyHandled += 1;
}

/**
 * Safety net for two related failure modes:
 *
 * 1. A Razorpay payment captures, but the browser never makes it to
 *    /api/bookings/finalize (tab closed, crash, dropped network) — so
 *    nothing ever creates the booking or refunds the money.
 * 2. A payment attempt fails and the customer immediately retries and
 *    succeeds on the same order (routine — a declined card or a UPI timeout
 *    followed by a successful retry, not an edge case). The first attempt's
 *    payment.failed webhook marked our record "failed"; until fixed,
 *    markPaymentPaid's own status guard then refused to move that same row
 *    to "paid" for the retry's capture, silently orphaning a real payment
 *    with no booking and no refund. That's fixed going forward, but existing
 *    rows already stuck at "failed" need to be re-checked against Razorpay
 *    directly to find out whether a later attempt actually captured.
 *
 * The webhook is meant to catch #1 near-instantly, but needs both a
 * Dashboard subscription and RAZORPAY_WEBHOOK_SECRET configured to run at
 * all, so this job is the backstop regardless of whether that's wired up.
 */
export async function reconcileStuckPaidSessions(options?: {
  olderThanMinutes?: number;
  withinHours?: number;
}): Promise<ReconciliationResult> {
  const olderThanMinutes = options?.olderThanMinutes ?? 10;
  const withinHours = options?.withinHours ?? 48;

  const now = Date.now();
  const to = new Date(now - olderThanMinutes * 60_000);
  const from = new Date(now - withinHours * 60 * 60_000);

  const venueName = getAppConfig().envDisplayName;

  const result: ReconciliationResult = {
    checked: 0,
    finalized: 0,
    refunded: 0,
    alreadyHandled: 0,
    errors: 0,
    recoveredFromFailed: 0,
  };

  const paidPayments = await listPaidPaymentsInWindow(from, to);
  for (const payment of paidPayments) {
    result.checked += 1;
    try {
      const outcome = await recoverPaidPayment(payment, venueName, "Reconciliation");
      applyOutcome(result, outcome);
    } catch (error) {
      result.errors += 1;
      safeLogError("payment-reconciliation", error);
    }
  }

  const failedPayments = await listFailedPaymentsInWindow(from, to);
  for (const payment of failedPayments) {
    result.checked += 1;
    try {
      const captured = await findCapturedPaymentForOrder(payment.razorpayOrderId);
      if (!captured) {
        result.alreadyHandled += 1;
        continue;
      }

      const updated = await markPaymentPaid({
        razorpayOrderId: payment.razorpayOrderId,
        razorpayPaymentId: captured.paymentId,
        paymentMethod: captured.method,
      });
      if (!updated) {
        result.errors += 1;
        safeLogError(
          "payment-reconciliation",
          new Error("markPaymentPaid returned null for a Razorpay-confirmed capture"),
        );
        continue;
      }

      result.recoveredFromFailed += 1;
      safeLogInfo("payment-reconciliation", "Recovered payment marked failed after a retry captured", {
        sessionId: payment.bookingSessionId,
        razorpayOrderId: payment.razorpayOrderId,
        razorpayPaymentId: captured.paymentId,
      });

      const outcome = await recoverPaidPayment(
        updated,
        venueName,
        "Reconciliation (recovered from failed)",
      );
      applyOutcome(result, outcome);
    } catch (error) {
      result.errors += 1;
      safeLogError("payment-reconciliation", error);
    }
  }

  return result;
}
