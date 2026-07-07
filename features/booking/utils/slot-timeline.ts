import type { BookingEngineConfig } from "@/features/booking/types";
import { parseSlotId } from "@/features/booking/utils/slot-id";
import {
  addDaysToIsoDate,
  createDateAtMinutes,
  getOperatingWindow,
  parseTimeToMinutes,
} from "@/features/booking/utils/time";

export function slotIdToTimestamp(slotId: string): number | null {
  const parsed = parseSlotId(slotId);
  if (!parsed) return null;
  return createDateAtMinutes(parsed.dateIso, parsed.startMinute).getTime();
}

export function sortSlotIdsChronologically(slotIds: string[]): string[] {
  return [...slotIds].sort((a, b) => {
    const aTs = slotIdToTimestamp(a) ?? 0;
    const bTs = slotIdToTimestamp(b) ?? 0;
    return aTs - bTs;
  });
}

export function getPrimaryBookingDateFromSlotIds(slotIds: string[]): string | null {
  const sorted = sortSlotIdsChronologically(slotIds);
  const first = sorted[0] ? parseSlotId(sorted[0]) : null;
  return first?.dateIso ?? null;
}

export function getBookingDateRangeLabel(
  dateIso: string | null,
  selectedSlotIds: string[],
): string | null {
  if (!dateIso && selectedSlotIds.length === 0) return null;
  const sorted = sortSlotIdsChronologically(selectedSlotIds);
  const first = sorted[0] ? parseSlotId(sorted[0]) : null;
  const last = sorted[sorted.length - 1] ? parseSlotId(sorted[sorted.length - 1]) : null;
  if (!first) return dateIso;

  if (!last || first.dateIso === last.dateIso) {
    return first.dateIso;
  }

  return `${first.dateIso} – ${last.dateIso}`;
}

/** Minutes on the next calendar day that may be booked as a continuation after midnight. */
export function getNextDayBridgeEndMinute(
  config: Pick<
    BookingEngineConfig,
    "businessHours" | "crossMidnightBridgeMinutes" | "slotDurationMinutes"
  >,
): number {
  const { startMinutes } = getOperatingWindow(config.businessHours);
  const closeMinutes = parseTimeToMinutes(config.businessHours.closeTime);
  const bridgeLimit = config.crossMidnightBridgeMinutes ?? 240;

  if (startMinutes > closeMinutes) {
    return Math.max(closeMinutes, config.slotDurationMinutes);
  }

  return Math.min(bridgeLimit, 24 * 60);
}

export function getBridgeDateIso(primaryDateIso: string): string {
  return addDaysToIsoDate(primaryDateIso, 1);
}

export function areConsecutiveSlotIds(
  slotIds: string[],
  slotDurationMinutes: number,
): boolean {
  const sorted = sortSlotIdsChronologically(slotIds);
  if (sorted.length <= 1) return true;

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = parseSlotId(sorted[index - 1]!);
    const current = parseSlotId(sorted[index]!);
    if (!previous || !current) return false;

    const previousEnd =
      createDateAtMinutes(previous.dateIso, previous.startMinute).getTime() +
      slotDurationMinutes * 60_000;
    const currentStart = createDateAtMinutes(current.dateIso, current.startMinute).getTime();

    if (currentStart !== previousEnd) return false;
  }

  return true;
}

export function selectionSpansMidnight(selectedSlotIds: string[]): boolean {
  const dates = new Set(
    selectedSlotIds
      .map((slotId) => parseSlotId(slotId)?.dateIso)
      .filter((value): value is string => Boolean(value)),
  );
  return dates.size > 1;
}
