/** Converts "HH:mm" to minutes from midnight */
export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/** Converts minutes from midnight to a Date for locale formatting */
export function minutesToDate(minutes: number): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setMinutes(minutes);
  return date;
}

export function formatMinutesAsTime(minutes: number): string {
  return minutesToDate(minutes).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function createDateAtMinutes(dateIso: string, minutes: number): Date {
  const [year, month, day] = dateIso.split("-").map(Number);
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  date.setMinutes(minutes);
  return date;
}

export function getTodayIso(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDaysToIsoDate(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return getTodayIso(date);
}

/**
 * Returns true when the slot's end time has already passed on the given date.
 */
export function isPastSlotEnd(dateIso: string, endMinute: number, now = new Date()): boolean {
  if (dateIso !== getTodayIso(now)) return false;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return endMinute <= currentMinutes;
}

/** @deprecated Use isPastSlotEnd */
export const isPastSlot = isPastSlotEnd;

/**
 * Resolves the operating window for slot generation.
 * `endExclusiveMinutes` is the minute boundary after which no new slot may start.
 */
export function getOperatingWindow(businessHours: {
  openTime: string;
  closeTime: string;
}): { startMinutes: number; endExclusiveMinutes: number } {
  const startMinutes = parseTimeToMinutes(businessHours.openTime);
  const closeMinutes = parseTimeToMinutes(businessHours.closeTime);

  const endExclusiveMinutes =
    startMinutes <= closeMinutes
      ? Math.min(24 * 60, closeMinutes + 1)
      : 24 * 60;

  return { startMinutes, endExclusiveMinutes };
}

/** Slot count for a given duration and operating window */
export function countSlotsInWindow(
  slotDurationMinutes: number,
  businessHours: { openTime: string; closeTime: string },
): number {
  const { startMinutes, endExclusiveMinutes } = getOperatingWindow(businessHours);
  let count = 0;
  for (
    let start = startMinutes;
    start + slotDurationMinutes <= endExclusiveMinutes;
    start += slotDurationMinutes
  ) {
    count += 1;
  }
  return count;
}

export function formatDurationLabel(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}
