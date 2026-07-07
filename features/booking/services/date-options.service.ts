import type { BookingDateOption } from "@/features/booking/types";
import { getTodayIso } from "@/features/booking/utils/time";

export function buildBookingDateOptions(daysAhead: number, now = new Date()): BookingDateOption[] {
  const options: BookingDateOption[] = [];
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    options.push({
      iso: getTodayIso(date),
      day: date.toLocaleDateString("en-IN", { weekday: "short" }),
      date: String(date.getDate()),
      month: date.toLocaleDateString("en-IN", { month: "short" }),
    });
  }

  return options;
}
