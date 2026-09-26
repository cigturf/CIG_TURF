import { NextResponse } from "next/server";

import { getCronSecret } from "@/lib/env";
import { captureError } from "@/lib/monitoring/capture-error";
import { reconcileStuckPaidSessions } from "@/features/payments/services/payment-reconciliation.service";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Safety net for payments that captured on Razorpay but never produced a
 * booking (the browser closed/crashed right after paying, before finalize()
 * ran, and the webhook didn't cover it either). Vercel Cron calls this with
 * `Authorization: Bearer $CRON_SECRET` automatically when CRON_SECRET is set
 * and a schedule is defined in vercel.json; an external scheduler can call it
 * the same way.
 */
export async function GET(request: Request) {
  const secret = getCronSecret();
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await reconcileStuckPaidSessions();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    captureError(error, { route: "cron/reconcile-payments" });
    return NextResponse.json({ error: "Reconciliation failed" }, { status: 500 });
  }
}
