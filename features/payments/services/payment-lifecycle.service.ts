import { releaseSlotHoldsForSession } from "@/features/booking/services/slot-hold.repository";
import { getBookingSessionById, updateBookingSessionStatus } from "@/features/payments/services/booking-session.repository";
import {
  getPaymentByOrderId,
  getActivePaymentBySessionId,
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

/**
 * Customer abandoned checkout (modal closed or payment failed in browser).
 * Releases slot holds immediately so slots do not appear booked.
 */
export async function abandonPaymentSession(options: {
  bookingSessionId: string;
  userId: string;
}): Promise<{ released: boolean }> {
  const session = await getBookingSessionById(options.bookingSessionId);
  if (!session || session.userId !== options.userId) {
    return { released: false };
  }

  if (session.status === "payment_completed") {
    return { released: false };
  }

  const activePayment = await getActivePaymentBySessionId(options.bookingSessionId);
  if (activePayment?.status === "created") {
    await markPaymentFailed(activePayment.razorpayOrderId);
  }

  await releaseSlotHoldsForSession(options.bookingSessionId);

  if (session.status === "payment_started" || session.status === "failed") {
    await updateBookingSessionStatus(options.bookingSessionId, "failed");
  }

  safeLogInfo("payments/lifecycle", "Payment session abandoned — holds released", {
    sessionId: options.bookingSessionId,
  });

  return { released: true };
}
