import { countBookingsForDate } from "@/features/booking/services/booking.repository";

export async function generateBookingReference(bookingDate: string): Promise<string> {
  const datePart = bookingDate.replace(/-/g, "");
  const count = await countBookingsForDate(bookingDate);
  const sequence = String(count + 1).padStart(4, "0");
  return `CIG-${datePart}-${sequence}`;
}
