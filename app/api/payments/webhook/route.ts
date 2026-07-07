import { NextResponse } from "next/server";

import { processRazorpayWebhook } from "@/features/payments/services/payment-webhook.service";
import { verifyRazorpayWebhookSignature } from "@/features/payments/utils/verify-webhook-signature";
import { getRazorpayWebhookSecret } from "@/lib/env";
import { captureError } from "@/lib/monitoring/capture-error";
import { safeLogWarn } from "@/lib/security/safe-logger";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = getRazorpayWebhookSecret();
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 });
  }

  const signature = request.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  const isValid = verifyRazorpayWebhookSignature(rawBody, signature, secret);
  if (!isValid) {
    safeLogWarn("payments/webhook", "Invalid Razorpay webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const result = await processRazorpayWebhook(payload as Parameters<typeof processRazorpayWebhook>[0]);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ received: true, duplicate: result.duplicate });
  } catch (error) {
    captureError(error, { route: "payments/webhook" });
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
