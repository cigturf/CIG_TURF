export type RazorpayWebhookPaymentEntity = {
  id: string;
  order_id: string;
  status: string;
  method?: string | null;
};

export type RazorpayWebhookOrderEntity = {
  id: string;
  status?: string;
};

export type RazorpayWebhookBody = {
  event: string;
  payload?: {
    payment?: {
      entity?: RazorpayWebhookPaymentEntity;
    };
    order?: {
      entity?: RazorpayWebhookOrderEntity;
    };
  };
};

export type ParsedRazorpayWebhookPaymentRef = {
  orderId: string;
  paymentId: string;
  status: string;
  method?: string | null;
};

/**
 * Normalizes Razorpay webhook payloads for payment.captured, order.paid, and payment.failed.
 * Supports payment.entity (standard) and order.paid with order.entity + payment.entity.
 */
export function parseRazorpayWebhookPaymentRef(
  body: RazorpayWebhookBody,
): ParsedRazorpayWebhookPaymentRef | null {
  const paymentEntity = body.payload?.payment?.entity;
  const orderEntity = body.payload?.order?.entity;

  if (paymentEntity?.id) {
    const orderId = paymentEntity.order_id?.trim() || orderEntity?.id;
    if (orderId) {
      return {
        orderId,
        paymentId: paymentEntity.id,
        status: paymentEntity.status ?? (body.event === "order.paid" ? "captured" : paymentEntity.status),
        method: paymentEntity.method,
      };
    }
  }

  if (body.event === "order.paid" && orderEntity?.id) {
    return null;
  }

  return null;
}
