import { getAppConfig } from "@/config/app.config";
import { getBookingBySessionId } from "@/features/booking/services/booking.repository";
import { finalizeBookingFromSession } from "@/features/booking/services/booking-finalization.service";
import {
  getBookingSessionById,
  updateBookingSessionStatus,
} from "@/features/payments/services/booking-session.repository";
import { listPaidPaymentsInWindow } from "@/features/payments/services/payment.repository";
import { refundOnlineAdvanceWithoutBooking } from "@/features/payments/services/payment-refund.service";
import { safeLogError, safeLogInfo } from "@/lib/security/safe-logger";

export type ReconciliationResult = {
  checked: number;
  finalized: number;
  refunded: number;
  alreadyHandled: number;
  errors: number;
};

/**
 * Safety net for the case that triggered this: a Razorpay payment captures,
 * but the browser never makes it to /api/bookings/finalize (tab closed,
 * crash, dropped network) — so nothing ever creates the booking or refunds
 * the money. The webhook is meant to catch this near-instantly, but a webhook
 * needs both a Dashboard subscription and RAZORPAY_WEBHOOK_SECRET configured
 * to run at all, so this job is the backstop regardless of whether that's
 * wired up.
 *
 * For every paid-but-unbooked session older than `olderThanMinutes`: retry
 * finalizing first (the slot may still be free — this is the common case, a
 * one-off client failure, not a real conflict), and only refund if that
 * still doesn't produce a booking. Both finalize and refund are idempotent,
 * so re-running this on the same payment is always safe.
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

  const payments = await listPaidPaymentsInWindow(from, to);
  const venueName = getAppConfig().envDisplayName;

  const result: ReconciliationResult = {
    checked: 0,
    finalized: 0,
    refunded: 0,
    alreadyHandled: 0,
    errors: 0,
  };

  for (const payment of payments) {
    result.checked += 1;

    try {
      const existingBooking = await getBookingBySessionId(payment.bookingSessionId);
      if (existingBooking) {
        result.alreadyHandled += 1;
        continue;
      }

      const session = await getBookingSessionById(payment.bookingSessionId);
      if (!session) {
        const refunded = await refundOnlineAdvanceWithoutBooking({
          payment,
          reason: "Reconciliation: booking session record missing",
        });
        if (refunded) result.refunded += 1;
        else result.alreadyHandled += 1;
        continue;
      }

      // Payment is confirmed paid (we only queried status='paid'), but the
      // session may never have been marked payment_completed if the client
      // dropped out between verify() and finalize() — self-heal that so
      // finalize doesn't reject a genuinely-paid session as "unverified".
      if (session.status !== "payment_completed") {
        await updateBookingSessionStatus(session.id, "payment_completed");
      }

      const finalizeResult = await finalizeBookingFromSession({
        bookingSessionId: payment.bookingSessionId,
        userId: payment.userId,
        venueName,
      });

      if (finalizeResult.success) {
        result.finalized += 1;
        safeLogInfo("payment-reconciliation", "Recovered stuck booking", {
          sessionId: payment.bookingSessionId,
          bookingId: finalizeResult.booking.id,
        });
        continue;
      }

      // Still can't finalize — the payment is confirmed paid, so the money
      // must come back. refundOnlineAdvanceWithoutBooking() no-ops (returns
      // false) if a booking now exists or this payment was already refunded
      // — e.g. finalize's own internal handling just did it — so it's safe
      // to call unconditionally here rather than branching on the failure code.
      const refunded = await refundOnlineAdvanceWithoutBooking({
        payment,
        reason: `Reconciliation: ${finalizeResult.message}`,
      });
      if (refunded) result.refunded += 1;
      else result.alreadyHandled += 1;
    } catch (error) {
      result.errors += 1;
      safeLogError("payment-reconciliation", error);
    }
  }

  return result;
}
