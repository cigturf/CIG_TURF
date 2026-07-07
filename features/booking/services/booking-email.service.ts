import type { BookingRecord } from "@/features/booking/types/booking-record.types";
import { publishCommunicationEvent } from "@/features/communication/services/communication-dispatcher";
import { APP_EVENT_TYPES } from "@/features/events/constants/event-types";

export type BookingEmailPayload = {
  booking: BookingRecord;
  venueName: string;
};

export async function sendBookingConfirmationEmail(
  payload: BookingEmailPayload,
): Promise<void> {
  void payload.venueName;
  publishCommunicationEvent(APP_EVENT_TYPES.BOOKING_CREATED, {
    bookingId: payload.booking.id,
    bookingReference: payload.booking.bookingReference,
    bookingDate: payload.booking.bookingDate,
    customerName: payload.booking.customerName,
    source: payload.booking.source,
  });
}

export async function sendBookingReceiptEmail(payload: BookingEmailPayload): Promise<void> {
  publishCommunicationEvent(APP_EVENT_TYPES.PAYMENT_COMPLETED, {
    paymentId: payload.booking.paymentId,
    bookingId: payload.booking.id,
    amount: payload.booking.advancePaid,
    method: "Online",
    referenceNumber: payload.booking.paymentId,
  });
}
