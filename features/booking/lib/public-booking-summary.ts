import { getBookingById } from "@/features/booking/services/booking.repository";
import type { BookingRecord } from "@/features/booking/types/booking-record.types";

/**
 * The safe, non-sensitive subset of a booking shown on its public share
 * link — no phone, email, or pricing. Anyone with the link (e.g. a friend
 * the booking was shared with over WhatsApp) can view this; the full record
 * with contact/payment details stays behind the authenticated confirmation
 * page and the admin drawer.
 */
export type PublicBookingSummary = Pick<
  BookingRecord,
  | "id"
  | "bookingReference"
  | "bookingDate"
  | "startTime"
  | "endTime"
  | "durationMinutes"
  | "customerName"
  | "status"
>;

export async function getPublicBookingSummary(id: string): Promise<PublicBookingSummary | null> {
  const booking = await getBookingById(id);
  if (!booking) return null;

  return {
    id: booking.id,
    bookingReference: booking.bookingReference,
    bookingDate: booking.bookingDate,
    startTime: booking.startTime,
    endTime: booking.endTime,
    durationMinutes: booking.durationMinutes,
    customerName: booking.customerName,
    status: booking.status,
  };
}
