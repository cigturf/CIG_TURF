import Razorpay from "razorpay";

import {
  PAYMENT_ADVANCE_AMOUNT_PAISE,
  PAYMENT_CURRENCY,
} from "@/features/payments/constants";

import { env, getRazorpayWebhookSecret } from "@/lib/env";

function getRazorpayCredentials() {
  const keyId = env.server.RAZORPAY_KEY_ID;
  const keySecret = env.server.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured");
  }

  return { keyId, keySecret };
}

export function getPublicRazorpayKeyId(): string {
  const keyId = env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? env.server.RAZORPAY_KEY_ID;
  if (!keyId) {
    throw new Error("Razorpay public key is not configured");
  }
  return keyId;
}

export function isRazorpayLiveMode(): boolean {
  return env.razorpayMode === "live";
}

export { getRazorpayWebhookSecret };

function getRazorpayClient(): Razorpay {
  const { keyId, keySecret } = getRazorpayCredentials();
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export async function createRazorpayOrder(receipt: string) {
  const razorpay = getRazorpayClient();
  const order = await razorpay.orders.create({
    amount: PAYMENT_ADVANCE_AMOUNT_PAISE,
    currency: PAYMENT_CURRENCY,
    receipt,
  });

  return {
    orderId: order.id,
    amount: Number(order.amount),
    currency: order.currency,
  };
}
