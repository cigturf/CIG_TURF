import { NextResponse } from "next/server";

import { isAdminUser } from "@/features/auth/services";
import { verifyPaymentSchema } from "@/features/payments/schemas/verify-payment.schema";
import {
  getBookingSessionById,
  updateBookingSessionStatus,
} from "@/features/payments/services/booking-session.repository";
import {
  getPaymentByOrderId,
  getPaymentByRazorpayPaymentId,
  markPaymentPaid,
} from "@/features/payments/services/payment.repository";
import { verifyRazorpaySignature } from "@/features/payments/utils/verify-signature";
import { publishCommunicationEvent } from "@/features/communication/services/communication-dispatcher";
import { APP_EVENT_TYPES } from "@/features/events/constants/event-types";
import { parseJsonBody } from "@/lib/api/parse-request";
import { apiErrorResponse } from "@/lib/security/safe-error";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, verifyPaymentSchema);
  if (!parsed.success) return parsed.response;

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return apiErrorResponse("Unable to connect", 503, "payments/verify");
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 });
  }

  if (await isAdminUser(user.id)) {
    return NextResponse.json({ error: "Admin accounts cannot book as customers." }, { status: 403 });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return apiErrorResponse("Payment service unavailable", 503, "payments/verify");
  }

  const { bookingSessionId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    parsed.data;

  const bookingSession = await getBookingSessionById(bookingSessionId);
  if (!bookingSession || bookingSession.userId !== user.id) {
    return NextResponse.json({ error: "Booking session not found" }, { status: 404 });
  }

  if (bookingSession.status === "payment_completed") {
    return NextResponse.json({ success: true, bookingSessionId });
  }

  const payment = await getPaymentByOrderId(razorpay_order_id);
  if (!payment || payment.bookingSessionId !== bookingSessionId || payment.userId !== user.id) {
    return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
  }

  if (payment.status === "paid") {
    await updateBookingSessionStatus(bookingSessionId, "payment_completed");
    return NextResponse.json({ success: true, bookingSessionId });
  }

  if (
    payment.razorpayPaymentId &&
    payment.razorpayPaymentId !== razorpay_payment_id
  ) {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 409 });
  }

  const existingPayment = await getPaymentByRazorpayPaymentId(razorpay_payment_id);
  if (existingPayment && existingPayment.razorpayOrderId !== razorpay_order_id) {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 409 });
  }

  const isValid = verifyRazorpaySignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    secret,
  );

  if (!isValid) {
    publishCommunicationEvent(APP_EVENT_TYPES.PAYMENT_FAILED, {
      paymentId: payment.id,
      bookingSessionId,
      customerEmail: bookingSession.profileEmail,
      reason: "Signature verification failed",
      status: "failed",
    });
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  const updatedPayment = await markPaymentPaid({
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
  });

  if (!updatedPayment) {
    return apiErrorResponse(
      "Failed to record payment. Please contact support.",
      500,
      "payments/verify",
    );
  }

  await updateBookingSessionStatus(bookingSessionId, "payment_completed");

  return NextResponse.json({ success: true, bookingSessionId });
}
