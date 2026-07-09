import { getBookingBySessionId } from "@/features/booking/services/booking.repository";
import { releaseSlotHoldsForSession } from "@/features/booking/services/slot-hold.repository";
import {
  getBookingSessionById,
  updateBookingSessionStatus,
} from "@/features/payments/services/booking-session.repository";
import {
  getPaymentByOrderId,
  getActivePaymentBySessionId,
  markPaymentFailed,
} from "@/features/payments/services/payment.repository";
import { safeLogInfo } from "@/lib/security/safe-logger";

/**
 * Terminal payment failure: mark payment failed, release slot holds, update session.
 * No-op when payment already succeeded or the session/booking is already finalized.
 */
export async function handlePaymentFailure(razorpayOrderId: string): Promise<void> {
  const payment = await getPaymentByOrderId(razorpayOrderId);

  if (payment?.status === "paid") {
    safeLogInfo("payments/lifecycle", "Ignored payment.failed — payment already paid", {
      orderId: razorpayOrderId,
    });
    return;
  }

  if (payment) {
    const session = await getBookingSessionById(payment.bookingSessionId);
    if (session?.status === "payment_completed") {
      safeLogInfo("payments/lifecycle", "Ignored payment.failed — session payment_completed", {
        orderId: razorpayOrderId,
        sessionId: payment.bookingSessionId,
      });
      return;
    }

    const existingBooking = await getBookingBySessionId(payment.bookingSessionId);
    if (existingBooking) {
      safeLogInfo("payments/lifecycle", "Ignored payment.failed — booking already finalized", {
        orderId: razorpayOrderId,
        bookingId: existingBooking.id,
      });
      return;
    }
  }

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
