import { createDateAtMinutes } from "@/features/booking/utils/time";

const SLOT_ID_PATTERN = /^(\d{4}-\d{2}-\d{2})-(\d+)$/;

export function parseSlotId(slotId: string): { dateIso: string; startMinute: number } | null {
  const match = slotId.match(SLOT_ID_PATTERN);
  if (!match) return null;

  return {
    dateIso: match[1]!,
    startMinute: Number(match[2]),
  };
}

export function buildSlotId(dateIso: string, startMinute: number): string {
  return `${dateIso}-${startMinute}`;
}

export function resolveSlotTimeBounds(
  slotIds: string[],
  slotDurationMinutes: number,
): { startTime: string; endTime: string; startMinute: number; endMinute: number } | null {
  const parsed = slotIds
    .map(parseSlotId)
    .filter((value): value is { dateIso: string; startMinute: number } => value !== null)
    .sort(
      (a, b) =>
        createDateAtMinutes(a.dateIso, a.startMinute).getTime() -
        createDateAtMinutes(b.dateIso, b.startMinute).getTime(),
    );

  if (parsed.length === 0) return null;

  const first = parsed[0]!;
  const last = parsed[parsed.length - 1]!;
  const endInstant = createDateAtMinutes(last.dateIso, last.startMinute);
  endInstant.setMinutes(endInstant.getMinutes() + slotDurationMinutes);

  const format = (date: Date) =>
    date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  return {
    startMinute: first.startMinute,
    endMinute: last.startMinute + slotDurationMinutes,
    startTime: format(createDateAtMinutes(first.dateIso, first.startMinute)),
    endTime: format(endInstant),
  };
}
