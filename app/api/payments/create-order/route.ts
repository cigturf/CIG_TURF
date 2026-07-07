import { NextResponse } from "next/server";

import { isAdminUser } from "@/features/auth/services";
import { PAYMENT_ADVANCE_AMOUNT_INR } from "@/features/payments/constants";
import { createOrderSchema } from "@/features/payments/schemas/create-order.schema";
import { validateCreateOrderInput } from "@/features/payments/services/validate-create-order.service";
import {
  createBookingSession,
  getBookingSessionById,
  isBookingSessionExpired,
  updateBookingSessionStatus,
} from "@/features/payments/services/booking-session.repository";
import { createPaymentRecord } from "@/features/payments/services/payment.repository";
import {
  createRazorpayOrder,
  getPublicRazorpayKeyId,
} from "@/features/payments/services/razorpay.service";
import { parseJsonBody } from "@/lib/api/parse-request";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { apiErrorResponse } from "@/lib/security/safe-error";
import { safeLogError } from "@/lib/security/safe-logger";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, createOrderSchema);
  if (!parsed.success) return parsed.response;

  if (parsed.data.advanceAmount !== PAYMENT_ADVANCE_AMOUNT_INR) {
    return NextResponse.json({ error: "Invalid advance amount" }, { status: 400 });
  }

  const validation = await validateCreateOrderInput(parsed.data);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return apiErrorResponse("Unable to connect", 503, "payments/create-order");
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

  const profile = {
    ...parsed.data.profile,
    name: sanitizePlainText(parsed.data.profile.name, 120) ?? parsed.data.profile.name,
  };

  try {
    let bookingSessionId = parsed.data.bookingSessionId;

    if (bookingSessionId) {
      const existing = await getBookingSessionById(bookingSessionId);

      if (!existing || existing.userId !== user.id) {
        return NextResponse.json({ error: "Booking session not found" }, { status: 404 });
      }

      if (existing.status === "payment_completed") {
        return NextResponse.json(
          { error: "Payment already completed for this session" },
          { status: 409 },
        );
      }

      if (isBookingSessionExpired(existing)) {
        await updateBookingSessionStatus(existing.id, "expired");
        return NextResponse.json(
          { error: "Booking session expired. Please start again." },
          { status: 410 },
        );
      }
    } else {
      const session = await createBookingSession({
        userId: user.id,
        selectedDate: parsed.data.dateIso,
        selectedSlots: parsed.data.selectedSlotIds,
        timeRange: parsed.data.timeRange,
        slotCount: parsed.data.slotCount,
        totalDurationMinutes: parsed.data.totalDurationMinutes,
        totalDurationLabel: parsed.data.totalDurationLabel,
        totalPrice: parsed.data.totalPrice,
        advanceAmount: parsed.data.advanceAmount,
        remainingAmount: parsed.data.remainingAmount,
        profileName: profile.name,
        profilePhone: profile.phone,
        profileEmail: profile.email,
      });
      bookingSessionId = session.id;
    }

    const order = await createRazorpayOrder(bookingSessionId);

    await createPaymentRecord({
      bookingSessionId,
      userId: user.id,
      razorpayOrderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
    });

    await updateBookingSessionStatus(bookingSessionId, "payment_started");

    return NextResponse.json({
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      keyId: getPublicRazorpayKeyId(),
      bookingSessionId,
    });
  } catch (error) {
    safeLogError("payments/create-order", error);
    return apiErrorResponse("Failed to create payment order. Please try again.", 500);
  }
}
