import { formatDate, toWhatsAppDigits } from "@/utils/format";

export type BookingShareDetails = {
  venueName: string;
  bookingReference: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  googleMapsLink?: string | null;
  /** Link to the booking's own page, where the recipient can see every detail. */
  bookingUrl?: string | null;
  customerName?: string | null;
};

export type BookingShareMode =
  /** Customer sharing their own booking with friends (confirmation page, email, "My Bookings"). */
  | "friends"
  /** Admin sharing a booking's details directly to the customer. */
  | "admin-to-customer";

export function buildBookingShareMessage(
  details: BookingShareDetails,
  mode: BookingShareMode = "friends",
): string {
  const { venueName, bookingReference, bookingDate, startTime, endTime, googleMapsLink, bookingUrl, customerName } =
    details;

  const intro =
    mode === "admin-to-customer"
      ? `🏏 *Booking Confirmed!*\n\nHi ${customerName?.trim() || "there"}, your turf booking at *${venueName}* is confirmed. Here are your details:`
      : `🏏 *Booking Confirmed!*\n\nCome play with me at *${venueName}*! Here are the details:`;

  const lines = [
    intro,
    "",
    `📅 Date: ${formatDate(bookingDate)}`,
    `⏰ Time: ${startTime} – ${endTime}`,
    `🔖 Reference: ${bookingReference}`,
  ];

  if (googleMapsLink) {
    lines.push(`📍 Location: ${googleMapsLink}`);
  }

  if (bookingUrl) {
    lines.push("", `🔗 Full booking details: ${bookingUrl}`);
  }

  lines.push(
    "",
    mode === "admin-to-customer" ? "See you on the turf! 🏆" : "Join me, see you there! 🏆",
  );

  return lines.join("\n");
}

/**
 * With a recipient phone, opens a chat directly with that number (e.g. admin
 * sharing to the customer). Without one, wa.me opens WhatsApp's own contact
 * picker so the sender can choose who to send it to.
 */
export function buildWhatsAppShareLink(message: string, recipientPhone?: string | null): string {
  const text = encodeURIComponent(message);
  const digits = recipientPhone ? toWhatsAppDigits(recipientPhone) : "";
  return digits ? `https://wa.me/${digits}?text=${text}` : `https://wa.me/?text=${text}`;
}
