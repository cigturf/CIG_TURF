import { BOOKING_DEFAULTS } from "@/features/booking/config";
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
import { dispatchBookingConfirmedEmails, publishCommunicationEvent } from "@/features/communication/services/communication-dispatcher";
import { APP_EVENT_TYPES } from "@/features/events/constants/event-types";
import type { FinalizeBookingResult } from "@/features/booking/types/booking-record.types";
import { resolveSlotTimeBounds } from "@/features/booking/utils/slot-id";
import {
  getBookingSessionById,
  updateBookingSessionStatus,
} from "@/features/payments/services/booking-session.repository";
import { getPaidPaymentBySessionId } from "@/features/payments/services/payment.repository";

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
  const unavailable = await getUnavailableSlotIds(slotIds);
  if (unavailable.length > 0) {
    await updateBookingSessionStatus(options.bookingSessionId, "failed");
    console.error("[FinalizeBooking] Slots unavailable:", unavailable);
    return {
      success: false,
      code: "slots_unavailable",
      message:
        "One or more selected slots were just booked by someone else. Please choose different slots.",
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

    const booking = await createBookingRecord({
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

    const reservation = await reserveBookedSlots({
      bookingId: booking.id,
      slotIds,
    });

    if (!reservation.success) {
      await releaseBookedSlotsForBooking(booking.id);
      await deleteBookingById(booking.id);
      await updateBookingSessionStatus(options.bookingSessionId, "failed");
      console.error("[FinalizeBooking] Race condition — slots taken:", reservation.conflictingSlotIds);
      return {
        success: false,
        code: "slots_unavailable",
        message:
          "One or more selected slots became unavailable while confirming your booking. Please select different slots.",
      };
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
        "Your payment was successful, but we couldn't complete the booking automatically. Our team will contact you shortly.",
    };
  }
}
