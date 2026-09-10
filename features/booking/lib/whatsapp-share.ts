import { formatDate } from "@/utils/format";

export type BookingShareDetails = {
  venueName: string;
  bookingReference: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  googleMapsLink?: string | null;
};

export function buildBookingShareMessage({
  venueName,
  bookingReference,
  bookingDate,
  startTime,
  endTime,
  googleMapsLink,
}: BookingShareDetails): string {
  const lines = [
    `🏏 *Booking Confirmed – ${venueName}*`,
    "",
    `📅 Date: ${formatDate(bookingDate)}`,
    `⏰ Time: ${startTime} – ${endTime}`,
    `🔖 Reference: ${bookingReference}`,
  ];

  if (googleMapsLink) {
    lines.push(`📍 Location: ${googleMapsLink}`);
  }

  lines.push("", "See you on the turf!");

  return lines.join("\n");
}

/**
 * With a recipient phone, opens a chat directly with that number (e.g. admin
 * sharing to the customer). Without one, wa.me opens WhatsApp's own contact
 * picker so the sender can choose who to send it to.
 */
export function buildWhatsAppShareLink(message: string, recipientPhone?: string | null): string {
  const text = encodeURIComponent(message);
  const digits = recipientPhone?.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}?text=${text}` : `https://wa.me/?text=${text}`;
}
