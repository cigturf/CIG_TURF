import Razorpay from "razorpay";

import { env, getRazorpayWebhookSecret } from "@/lib/env";
import { serializeUnknownError } from "@/lib/errors/serialize-error";

function getRazorpayCredentials() {
  const keyId = env.server.RAZORPAY_KEY_ID?.trim();
  const keySecret = env.server.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured");
  }

  return { keyId, keySecret };
}

export function getPublicRazorpayKeyId(): string {
  const keyId = (
    env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? env.server.RAZORPAY_KEY_ID
  )?.trim();
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

export async function createRazorpayOrder(input: {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, unknown>;
}) {
  const razorpay = getRazorpayClient();

  const notes =
    input.notes && Object.keys(input.notes).length > 0
      ? Object.fromEntries(
          Object.entries(input.notes).map(([k, v]) => [k, String(v)]),
        )
      : undefined;

  const payload: Parameters<Razorpay["orders"]["create"]>[0] = {
    amount: input.amount,
    currency: input.currency,
    receipt: input.receipt,
    ...(notes ? { notes } : {}),
  };

  try {
    const order = await razorpay.orders.create({
      ...payload,
    });

    return {
      orderId: order.id,
      amount: Number(order.amount),
      currency: order.currency,
    };
  } catch (error) {
    throw new Error(`Razorpay order creation failed: ${serializeUnknownError(error)}`);
  }
}
