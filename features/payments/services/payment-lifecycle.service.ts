import { releaseSlotHoldsForSession } from "@/features/booking/services/slot-hold.repository";
import { updateBookingSessionStatus } from "@/features/payments/services/booking-session.repository";
import {
  getPaymentByOrderId,
  markPaymentFailed,
} from "@/features/payments/services/payment.repository";
import { safeLogInfo } from "@/lib/security/safe-logger";

/**
 * Terminal payment failure: mark payment failed, release slot holds, update session.
 */
export async function handlePaymentFailure(razorpayOrderId: string): Promise<void> {
  const payment = await getPaymentByOrderId(razorpayOrderId);
  await markPaymentFailed(razorpayOrderId);

  if (!payment) return;

  await releaseSlotHoldsForSession(payment.bookingSessionId);
  await updateBookingSessionStatus(payment.bookingSessionId, "failed");

  safeLogInfo("payments/lifecycle", "Payment failed — holds released", {
    orderId: razorpayOrderId,
    sessionId: payment.bookingSessionId,
  });
}
