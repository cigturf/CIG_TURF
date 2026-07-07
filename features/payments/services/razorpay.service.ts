import Razorpay from "razorpay";

import {
  PAYMENT_ADVANCE_AMOUNT_PAISE,
  PAYMENT_CURRENCY,
} from "@/features/payments/constants";

function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured");
  }

  return { keyId, keySecret };
}

export function getPublicRazorpayKeyId(): string {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID;
  if (!keyId) {
    throw new Error("Razorpay public key is not configured");
  }
  return keyId;
}

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
