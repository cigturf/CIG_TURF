import { NextResponse } from "next/server";

import { isAdminUser } from "@/features/auth/services";
import { isBookingMaintenanceActive } from "@/features/business-settings/lib/maintenance-guard";
import { upsertSlotHolds } from "@/features/booking/services/slot-hold.repository";
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
  updateBookingSession,
  updateBookingSessionStatus,
} from "@/features/payments/services/booking-session.repository";
import {
  createPaymentRecord,
  getActivePaymentBySessionId,
} from "@/features/payments/services/payment.repository";
import {
  createRazorpayOrder,
  getPublicRazorpayKeyId,
} from "@/features/payments/services/razorpay.service";
import { parseJsonBody } from "@/lib/api/parse-request";
import { apiErrorResponse } from "@/lib/security/safe-error";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { createClient } from "@/lib/supabase/server";

const MAX_RAZORPAY_RECEIPT_LENGTH = 40;

export async function POST(request: Request) {
  try {
    if (await isBookingMaintenanceActive()) {
      return NextResponse.json(
        { error: "Online booking is temporarily unavailable for maintenance." },
        { status: 503 },
      );
    }

    const parsed = await parseJsonBody(request, createOrderSchema);
    if (!parsed.success) return parsed.response;

    if (parsed.data.advanceAmount !== PAYMENT_ADVANCE_AMOUNT_INR) {
      return NextResponse.json({ error: "Invalid advance amount" }, { status: 400 });
    }

    const validation = await validateCreateOrderInput(parsed.data);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const {
      data: { user },
      error: authError,
    } = await createClient().then((supabase) => supabase.auth.getUser());

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

      const updated = await updateBookingSession(bookingSessionId, {
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

      if (!updated) {
        return apiErrorResponse("Failed to update booking session", 500, "payments/create-order");
      }

      const activePayment = await getActivePaymentBySessionId(bookingSessionId);
      if (activePayment) {
        await upsertSlotHolds(bookingSessionId, parsed.data.selectedSlotIds);
        return NextResponse.json({
          orderId: activePayment.razorpayOrderId,
          amount: activePayment.amount,
          currency: activePayment.currency,
          keyId: getPublicRazorpayKeyId(),
          bookingSessionId,
        });
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
      return apiErrorResponse("Booking session initialization failed", 500, "payments/create-order");
    }

    if (!Number.isInteger(PAYMENT_ADVANCE_AMOUNT_PAISE)) {
      return apiErrorResponse("Invalid payment amount configuration", 500, "payments/create-order");
    }

    if (bookingSessionId.length > MAX_RAZORPAY_RECEIPT_LENGTH) {
      return NextResponse.json({ error: "Booking session is too long for payment" }, { status: 400 });
    }

    await upsertSlotHolds(bookingSessionId, parsed.data.selectedSlotIds);

    const order = await createRazorpayOrder({
      amount: PAYMENT_ADVANCE_AMOUNT_PAISE,
      currency: PAYMENT_CURRENCY,
      receipt: bookingSessionId,
      notes: {
        booking_session_id: bookingSessionId,
        user_id: user.id,
        booking_date: parsed.data.dateIso,
        slot_count: parsed.data.slotCount,
      },
    });

    try {
      await createPaymentRecord({
        bookingSessionId,
        userId: user.id,
        razorpayOrderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
      });
    } catch (dbError) {
      return apiErrorResponse(
        "Payment order created but could not be saved. Please contact support.",
        500,
        "payments/create-order",
        dbError,
      );
    }

    const sessionAfter = await updateBookingSessionStatus(bookingSessionId, "payment_started");
    if (!sessionAfter) {
      return apiErrorResponse("Failed to start payment session", 500, "payments/create-order");
    }

    return NextResponse.json({
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      keyId: getPublicRazorpayKeyId(),
      bookingSessionId,
    });
  } catch (error) {
    return apiErrorResponse(
      "Unable to create payment order. Please try again.",
      500,
      "payments/create-order",
      error,
    );
  }
}
