import Razorpay from "razorpay";

import { createBookingPaymentRecord } from "@/features/admin/bookings/services/booking-payment.repository";
import type { PaymentRecord } from "@/features/payments/types/payment.types";
import { releaseSlotHoldsForSession } from "@/features/booking/services/slot-hold.repository";
import { env } from "@/lib/env";
import { safeLogError, safeLogInfo } from "@/lib/security/safe-logger";

function getRazorpayClient(): Razorpay {
  const keyId = env.server.RAZORPAY_KEY_ID?.trim();
  const keySecret = env.server.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured");
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export async function refundRazorpayPayment(options: {
  razorpayPaymentId: string;
  amountPaise: number;
  notes?: Record<string, string>;
}): Promise<{ refundId: string }> {
  const razorpay = getRazorpayClient();
  const refund = await razorpay.payments.refund(options.razorpayPaymentId, {
    amount: options.amountPaise,
    notes: options.notes,
  });

  return { refundId: refund.id };
}

export async function refundOnlineAdvanceForBooking(options: {
  payment: PaymentRecord;
  bookingId: string;
  amountInr: number;
  reason: string;
  collectedBy?: string | null;
}): Promise<boolean> {
  if (!options.payment.razorpayPaymentId) {
    safeLogError("payment-refund", new Error("Missing razorpay payment id for refund"));
    return false;
  }

  try {
    await refundRazorpayPayment({
      razorpayPaymentId: options.payment.razorpayPaymentId,
      amountPaise: options.payment.amount,
      notes: { reason: options.reason, booking_id: options.bookingId },
    });

    await createBookingPaymentRecord({
      bookingId: options.bookingId,
      type: "refund",
      amount: options.amountInr,
      method: "online",
      referenceNumber: options.payment.razorpayPaymentId,
      collectedBy: options.collectedBy ?? null,
      notes: options.reason,
    });

    safeLogInfo("payment-refund", "Advance refunded", {
      bookingId: options.bookingId,
      paymentId: options.payment.id,
    });
    return true;
  } catch (error) {
    safeLogError("payment-refund", error);
    return false;
  }
}

export async function refundOnlineAdvanceWithoutBooking(options: {
  payment: PaymentRecord;
  reason: string;
}): Promise<boolean> {
  if (!options.payment.razorpayPaymentId) {
    safeLogError("payment-refund", new Error("Missing razorpay payment id for refund"));
    return false;
  }

  try {
    await refundRazorpayPayment({
      razorpayPaymentId: options.payment.razorpayPaymentId,
      amountPaise: options.payment.amount,
      notes: { reason: options.reason, booking_session_id: options.payment.bookingSessionId },
    });

    safeLogInfo("payment-refund", "Advance refunded without booking", {
      sessionId: options.payment.bookingSessionId,
      paymentId: options.payment.id,
    });
    await releaseSlotHoldsForSession(options.payment.bookingSessionId);
    return true;
  } catch (error) {
    safeLogError("payment-refund", error);
    return false;
  }
}
