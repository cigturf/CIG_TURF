import {
  getPaymentByOrderId,
  getPaymentByRazorpayPaymentId,
  markPaymentFailed,
  markPaymentPaid,
} from "@/features/payments/services/payment.repository";
import { updateBookingSessionStatus } from "@/features/payments/services/booking-session.repository";
import { safeLogInfo } from "@/lib/security/safe-logger";

type RazorpayWebhookPaymentEntity = {
  id: string;
  order_id: string;
  status: string;
  method?: string | null;
};

type RazorpayWebhookPayload = {
  event: string;
  payload?: {
    payment?: {
      entity?: RazorpayWebhookPaymentEntity;
    };
  };
};

export type WebhookProcessResult =
  | { ok: true; duplicate: boolean }
  | { ok: false; error: string; status: number };

export async function processRazorpayWebhook(
  body: RazorpayWebhookPayload,
): Promise<WebhookProcessResult> {
  const event = body.event;
  const paymentEntity = body.payload?.payment?.entity;

  if (!paymentEntity?.order_id || !paymentEntity.id) {
    return { ok: false, error: "Invalid webhook payload", status: 400 };
  }

  const orderId = paymentEntity.order_id;
  const paymentId = paymentEntity.id;

  if (event === "payment.failed") {
    await markPaymentFailed(orderId);
    safeLogInfo("payments/webhook", "Payment marked failed", { orderId, paymentId });
    return { ok: true, duplicate: false };
  }

  if (event !== "payment.captured" && event !== "order.paid") {
    safeLogInfo("payments/webhook", "Ignored webhook event", { event });
    return { ok: true, duplicate: false };
  }

  if (paymentEntity.status && paymentEntity.status !== "captured") {
    return { ok: true, duplicate: false };
  }

  const payment = await getPaymentByOrderId(orderId);
  if (!payment) {
    return { ok: false, error: "Payment record not found", status: 404 };
  }

  if (payment.status === "paid") {
    await updateBookingSessionStatus(payment.bookingSessionId, "payment_completed");
    return { ok: true, duplicate: true };
  }

  const existingPayment = await getPaymentByRazorpayPaymentId(paymentId);
  if (existingPayment && existingPayment.razorpayOrderId !== orderId) {
    return { ok: false, error: "Duplicate payment id", status: 409 };
  }

  const updated = await markPaymentPaid({
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
    paymentMethod: paymentEntity.method ?? null,
  });

  if (!updated) {
    return { ok: false, error: "Failed to update payment", status: 500 };
  }

  await updateBookingSessionStatus(payment.bookingSessionId, "payment_completed");
  safeLogInfo("payments/webhook", "Payment captured via webhook", { orderId, paymentId });

  return { ok: true, duplicate: false };
}
