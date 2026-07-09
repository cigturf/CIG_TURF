import { BOOKING_DEFAULTS } from "@/features/booking/config";
import { getAppConfig } from "@/config/app.config";
import {
  createBookingRecord,
  deleteBookingById,
  getBookingBySessionId,
} from "@/features/booking/services/booking.repository";
import { generateBookingReference } from "@/features/booking/services/booking-reference.service";
import {
  getUnavailableSlotIds,
  releaseBookedSlotsForBooking,
  reserveBookedSlots,
} from "@/features/booking/services/booked-slot.repository";
import { releaseSlotHoldsForSession } from "@/features/booking/services/slot-hold.repository";
import { createBookingPaymentRecord, listPaymentRecordsForBooking } from "@/features/admin/bookings/services/booking-payment.repository";
import { dispatchBookingConfirmedEmails, publishCommunicationEvent } from "@/features/communication/services/communication-dispatcher";
import { APP_EVENT_TYPES } from "@/features/events/constants/event-types";
import type { FinalizeBookingResult } from "@/features/booking/types/booking-record.types";
import { resolveSlotTimeBounds } from "@/features/booking/utils/slot-id";
import {
  getBookingSessionById,
  isBookingSessionExpired,
  updateBookingSessionStatus,
} from "@/features/payments/services/booking-session.repository";
import { getPaidPaymentBySessionId } from "@/features/payments/services/payment.repository";
import { refundOnlineAdvanceWithoutBooking } from "@/features/payments/services/payment-refund.service";
import { safeLogWarn } from "@/lib/security/safe-logger";

async function handleSlotsUnavailableAfterPayment(bookingSessionId: string): Promise<void> {
  const existingBooking = await getBookingBySessionId(bookingSessionId);
  if (existingBooking) {
    await releaseSlotHoldsForSession(bookingSessionId);
    return;
  }

  const payment = await getPaidPaymentBySessionId(bookingSessionId);
  if (payment?.status === "paid" && payment.razorpayPaymentId) {
    await refundOnlineAdvanceWithoutBooking({
      payment,
      reason: "Slots unavailable after payment",
    });
  }

  await releaseSlotHoldsForSession(bookingSessionId);
  await updateBookingSessionStatus(bookingSessionId, "failed");
}

/**
 * Webhook backup: finalize booking when payment succeeded but the browser never called finalize.
 * Idempotent — no-op if a booking already exists for the session.
 */
export async function finalizeBookingFromPaidSessionIfNeeded(options: {
  bookingSessionId: string;
  userId: string;
}): Promise<void> {
  const existing = await getBookingBySessionId(options.bookingSessionId);
  if (existing) return;

  const venueName = getAppConfig().envDisplayName;
  const result = await finalizeBookingFromSession({
    bookingSessionId: options.bookingSessionId,
    userId: options.userId,
    venueName,
  });

  if (!result.success) {
    safeLogWarn("booking/finalize", "Webhook finalize did not complete", {
      sessionId: options.bookingSessionId,
      code: result.code,
    });
  }
}

export async function finalizeBookingFromSession(options: {
  bookingSessionId: string;
  userId: string;
  venueName: string;
}): Promise<FinalizeBookingResult> {
  const existing = await getBookingBySessionId(options.bookingSessionId);
  if (existing) {
    if (existing.userId !== options.userId) {
      return {
        success: false,
        code: "session_invalid",
        message: "Booking session not found.",
      };
    }
    await releaseSlotHoldsForSession(options.bookingSessionId);
    return { success: true, booking: existing };
  }

  const session = await getBookingSessionById(options.bookingSessionId);
  if (!session || session.userId !== options.userId) {
    return {
      success: false,
      code: "session_invalid",
      message: "Booking session not found.",
    };
  }

  if (isBookingSessionExpired(session)) {
    const existingBooking = await getBookingBySessionId(options.bookingSessionId);
    if (existingBooking) {
      await releaseSlotHoldsForSession(options.bookingSessionId);
      return { success: true, booking: existingBooking };
    }

    const paid = await getPaidPaymentBySessionId(options.bookingSessionId);
    if (paid?.razorpayPaymentId) {
      await refundOnlineAdvanceWithoutBooking({
        payment: paid,
        reason: "Booking session expired after payment",
      });
    }
    await updateBookingSessionStatus(options.bookingSessionId, "expired");
    await releaseSlotHoldsForSession(options.bookingSessionId);
    return {
      success: false,
      code: "session_invalid",
      message: "Booking session expired. Please start again.",
    };
  }

  if (session.status !== "payment_completed") {
    return {
      success: false,
      code: "payment_unverified",
      message: "Payment has not been verified for this session.",
    };
  }

  const payment = await getPaidPaymentBySessionId(options.bookingSessionId);
  if (!payment || payment.status !== "paid") {
    return {
      success: false,
      code: "payment_unverified",
      message: "Verified payment record not found.",
    };
  }

  const selectedSlots = session.selectedSlots;
  if (!Array.isArray(selectedSlots) || selectedSlots.length === 0) {
    return {
      success: false,
      code: "session_invalid",
      message: "No slots found in booking session.",
    };
  }

  const slotIds = selectedSlots as string[];
  const unavailable = await getUnavailableSlotIds(slotIds, {
    bookingSessionId: options.bookingSessionId,
  });
  if (unavailable.length > 0) {
    await handleSlotsUnavailableAfterPayment(options.bookingSessionId);
    console.error("[FinalizeBooking] Slots unavailable:", unavailable);
    return {
      success: false,
      code: "slots_unavailable",
      message:
        "One or more selected slots were just booked by someone else. Your advance payment will be refunded shortly.",
    };
  }

  const timeBounds = resolveSlotTimeBounds(slotIds, BOOKING_DEFAULTS.slotDurationMinutes);
  if (!timeBounds) {
    return {
      success: false,
      code: "session_invalid",
      message: "Invalid slot selection in booking session.",
    };
  }

  if (!session.profileName || !session.profilePhone || !session.profileEmail) {
    return {
      success: false,
      code: "session_invalid",
      message: "Customer profile details are missing from booking session.",
    };
  }

  try {
    const bookingReference = await generateBookingReference(session.selectedDate);

    const { booking, isNew } = await createBookingRecord({
      bookingReference,
      userId: session.userId,
      bookingSessionId: session.id,
      paymentId: payment.id,
      bookingDate: session.selectedDate,
      startTime: timeBounds.startTime,
      endTime: timeBounds.endTime,
      selectedSlots: slotIds,
      durationMinutes: session.totalDurationMinutes,
      totalPrice: session.totalPrice,
      advancePaid: session.advanceAmount,
      remainingAmount: session.remainingAmount,
      customerName: session.profileName,
      customerPhone: session.profilePhone,
      customerEmail: session.profileEmail,
    });

    if (!isNew) {
      await releaseSlotHoldsForSession(options.bookingSessionId);
      return { success: true, booking };
    }

    const racedBooking = await getBookingBySessionId(session.id);
    if (racedBooking && racedBooking.id !== booking.id) {
      await releaseBookedSlotsForBooking(booking.id).catch(() => undefined);
      await deleteBookingById(booking.id).catch(() => undefined);
      await releaseSlotHoldsForSession(options.bookingSessionId);
      return { success: true, booking: racedBooking };
    }

    const reservation = await reserveBookedSlots({
      bookingId: booking.id,
      slotIds,
    });

    if (!reservation.success) {
      const confirmedBooking = await getBookingBySessionId(options.bookingSessionId);
      if (confirmedBooking) {
        await releaseBookedSlotsForBooking(booking.id).catch(() => undefined);
        await deleteBookingById(booking.id).catch(() => undefined);
        await releaseSlotHoldsForSession(options.bookingSessionId);
        return { success: true, booking: confirmedBooking };
      }

      await releaseBookedSlotsForBooking(booking.id);
      await deleteBookingById(booking.id);
      await handleSlotsUnavailableAfterPayment(options.bookingSessionId);
      console.error("[FinalizeBooking] Race condition — slots taken:", reservation.conflictingSlotIds);
      return {
        success: false,
        code: "slots_unavailable",
        message:
          "One or more selected slots became unavailable while confirming your booking. Your advance payment will be refunded shortly.",
      };
    }

    await releaseSlotHoldsForSession(options.bookingSessionId);

    const ledger = await listPaymentRecordsForBooking(booking.id);
    const hasAdvanceLedger = ledger.some(
      (record) => record.type === "advance" && record.method === "online",
    );
    if (!hasAdvanceLedger) {
      await createBookingPaymentRecord({
        bookingId: booking.id,
        type: "advance",
        amount: session.advanceAmount,
        method: "online",
        referenceNumber: payment.razorpayPaymentId,
        notes: "Online booking advance",
      });
    }

    publishCommunicationEvent(APP_EVENT_TYPES.BOOKING_CREATED, {
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      bookingDate: booking.bookingDate,
      customerName: booking.customerName,
      source: booking.source,
    });

    await dispatchBookingConfirmedEmails(booking);

    return { success: true, booking };
  } catch (error) {
    console.error("[FinalizeBooking] Failed to create booking:", error);
    return {
      success: false,
      code: "finalize_failed",
      message:
        "We received your payment but could not confirm the booking. Please contact support with your payment reference.",
    };
  }
}
