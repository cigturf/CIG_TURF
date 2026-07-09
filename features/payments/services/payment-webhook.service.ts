import { finalizeBookingFromPaidSessionIfNeeded } from "@/features/booking/services/booking-finalization.service";
import {
  getPaymentByOrderId,
  getPaymentByRazorpayPaymentId,
  markPaymentPaid,
} from "@/features/payments/services/payment.repository";
import type { PaymentRecord } from "@/features/payments/types/payment.types";
import { PAYMENT_ADVANCE_AMOUNT_PAISE } from "@/features/payments/constants";
import { handlePaymentFailure } from "@/features/payments/services/payment-lifecycle.service";
import { updateBookingSessionStatus } from "@/features/payments/services/booking-session.repository";
import {
  parseRazorpayWebhookPaymentRef,
  type RazorpayWebhookBody,
} from "@/features/payments/utils/parse-razorpay-webhook-payload";
import { safeLogInfo } from "@/lib/security/safe-logger";

export type WebhookProcessResult =
  | { ok: true; duplicate: boolean }
  | { ok: false; error: string; status: number };

async function ensureBookingFinalized(payment: PaymentRecord): Promise<void> {
  await finalizeBookingFromPaidSessionIfNeeded({
    bookingSessionId: payment.bookingSessionId,
    userId: payment.userId,
  });
}

async function processPaymentCaptured(options: {
  orderId: string;
  paymentId: string;
  method?: string | null;
}): Promise<WebhookProcessResult> {
  const payment = await getPaymentByOrderId(options.orderId);
  if (!payment) {
    return { ok: false, error: "Payment record not found", status: 404 };
  }

  if (payment.amount !== PAYMENT_ADVANCE_AMOUNT_PAISE) {
    return { ok: false, error: "Payment amount mismatch", status: 400 };
  }

  if (payment.status === "paid") {
    await updateBookingSessionStatus(payment.bookingSessionId, "payment_completed");
    await ensureBookingFinalized(payment);
    return { ok: true, duplicate: true };
  }

  const existingPayment = await getPaymentByRazorpayPaymentId(options.paymentId);
  if (existingPayment && existingPayment.razorpayOrderId !== options.orderId) {
    return { ok: false, error: "Duplicate payment id", status: 409 };
  }

  const updated = await markPaymentPaid({
    razorpayOrderId: options.orderId,
    razorpayPaymentId: options.paymentId,
    paymentMethod: options.method ?? null,
  });

  if (!updated) {
    return { ok: false, error: "Failed to update payment", status: 500 };
  }

  await updateBookingSessionStatus(payment.bookingSessionId, "payment_completed");
  await ensureBookingFinalized(updated);
  safeLogInfo("payments/webhook", "Payment captured via webhook", {
    orderId: options.orderId,
    paymentId: options.paymentId,
  });

  return { ok: true, duplicate: false };
}

export async function processRazorpayWebhook(
  body: RazorpayWebhookBody,
): Promise<WebhookProcessResult> {
  const event = body.event;
  const parsed = parseRazorpayWebhookPaymentRef(body);

  if (!parsed) {
    return { ok: false, error: "Invalid webhook payload", status: 400 };
  }

  const { orderId, paymentId, status, method } = parsed;

  if (event === "payment.failed") {
    await handlePaymentFailure(orderId);
    safeLogInfo("payments/webhook", "Payment marked failed", { orderId, paymentId });
    return { ok: true, duplicate: false };
  }

  if (event !== "payment.captured" && event !== "order.paid") {
    safeLogInfo("payments/webhook", "Ignored webhook event", { event });
    return { ok: true, duplicate: false };
  }

  if (status && status !== "captured" && status !== "paid") {
    return { ok: true, duplicate: false };
  }

  return processPaymentCaptured({ orderId, paymentId, method });
}
