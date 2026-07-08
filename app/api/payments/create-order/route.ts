import { NextResponse } from "next/server";

import { isAdminUser } from "@/features/auth/services";
import {
  PAYMENT_ADVANCE_AMOUNT_INR,
  PAYMENT_ADVANCE_AMOUNT_PAISE,
  PAYMENT_CURRENCY,
} from "@/features/payments/constants";
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
import {
  serializeUnknownError,
  serializeUnknownErrorDetails,
} from "@/lib/errors/serialize-error";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    console.log("Received request");

    const parsed = await parseJsonBody(request, createOrderSchema);
    if (!parsed.success) return parsed.response;

    if (parsed.data.advanceAmount !== PAYMENT_ADVANCE_AMOUNT_INR) {
      return NextResponse.json({ error: "Invalid advance amount" }, { status: 400 });
    }

    console.log("Booking session:", parsed.data.bookingSessionId ?? null);

    const validation = await validateCreateOrderInput(parsed.data);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    console.log("Business settings loaded");

    const amountPaise = PAYMENT_ADVANCE_AMOUNT_PAISE;
    console.log("Amount:", amountPaise);

    const {
      data: { user },
      error: authError,
    } = await createClient()
      .then((supabase) => supabase.auth.getUser());

    if (authError || !user) {
      return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 });
    }

    if (await isAdminUser(user.id)) {
      return NextResponse.json({ error: "Admin accounts cannot book as customers." }, { status: 403 });
    }

    const profile = {
      ...parsed.data.profile,
      name:
        sanitizePlainText(parsed.data.profile.name, 120) ?? parsed.data.profile.name,
    };

    const MAX_RAZORPAY_RECEIPT_LENGTH = 40;

    let bookingSessionId = parsed.data.bookingSessionId ?? null;
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

    if (!bookingSessionId) {
      throw new Error("Booking session id is missing after initialization");
    }

    console.log("Booking session:", bookingSessionId);

    // Step 5 + 6: validate Razorpay payload constraints before calling Razorpay.
    if (!Number.isInteger(amountPaise)) {
      throw new Error(
        `Razorpay amount must be an integer in paise. Got: ${amountPaise}`,
      );
    }

    if (bookingSessionId.length > MAX_RAZORPAY_RECEIPT_LENGTH) {
      throw new Error(
        `Razorpay receipt length must be <= ${MAX_RAZORPAY_RECEIPT_LENGTH}. Got: ${bookingSessionId.length}`,
      );
    }

    const notes = {
      booking_session_id: bookingSessionId,
      user_id: user.id,
      booking_date: parsed.data.dateIso,
      slot_count: parsed.data.slotCount,
    };

    // Step 4: payload shape must match Razorpay API.
    const razorpayPayload = {
      amount: amountPaise,
      currency: PAYMENT_CURRENCY,
      receipt: bookingSessionId,
      notes,
    };

    console.log("Creating Razorpay order...");
    console.log("Razorpay payload:", razorpayPayload);

    const order = await createRazorpayOrder(razorpayPayload);
    console.log("Order response:", order);

    // Step 8 + 7: separate logging for DB inserts after Razorpay succeeds.
    try {
      await createPaymentRecord({
        bookingSessionId,
        userId: user.id,
        razorpayOrderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
      });
    } catch (dbError) {
      console.error("DB payment record insert failed after Razorpay:", dbError);
      throw dbError;
    }

    const sessionAfter = await updateBookingSessionStatus(bookingSessionId, "payment_started");
    if (!sessionAfter) {
      throw new Error("Booking session status update failed (returned null) after payment record insert");
    }

    return NextResponse.json({
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      keyId: getPublicRazorpayKeyId(),
      bookingSessionId,
    });
  } catch (error) {
    console.error(error);
    console.error("Error details:", serializeUnknownErrorDetails(error));
    return NextResponse.json(
      {
        success: false,
        message: serializeUnknownError(error),
        details: serializeUnknownErrorDetails(error),
        stack: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : undefined) : undefined,
      },
      { status: 500 },
    );
  }
}
