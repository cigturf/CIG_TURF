export const DEFAULT_VENUE_TIMEZONE = "Asia/Kolkata";

export function resolveVenueTimezone(timezone: string | null | undefined): string {
  const trimmed = timezone?.trim();
  if (!trimmed) return DEFAULT_VENUE_TIMEZONE;

  try {
    Intl.DateTimeFormat(undefined, { timeZone: trimmed });
    return trimmed;
  } catch {
    return DEFAULT_VENUE_TIMEZONE;
  }
}

export function getTodayIsoInTimezone(
  now = new Date(),
  timeZone = DEFAULT_VENUE_TIMEZONE,
): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function getCurrentMinutesInTimezone(
  now = new Date(),
  timeZone = DEFAULT_VENUE_TIMEZONE,
): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

export function isPastSlotEndInTimezone(
  dateIso: string,
  endMinute: number,
  now = new Date(),
  timeZone = DEFAULT_VENUE_TIMEZONE,
): boolean {
  if (dateIso !== getTodayIsoInTimezone(now, timeZone)) return false;
  return endMinute <= getCurrentMinutesInTimezone(now, timeZone);
}
