import type { BookingSlot } from "@/features/booking/types";
import { sortSlotIdsChronologically } from "@/features/booking/utils/slot-timeline";

export function formatTimeRange(
  slots: BookingSlot[],
  selectedSlotIds: string[],
): string | null {
  if (selectedSlotIds.length === 0) return null;

  const slotById = new Map(slots.map((slot) => [slot.id, slot]));
  const orderedIds = sortSlotIdsChronologically(selectedSlotIds);
  const selected = orderedIds
    .map((id) => slotById.get(id))
    .filter((slot): slot is BookingSlot => Boolean(slot));

  if (selected.length === 0) return null;

  const first = selected[0]!;
  const last = selected[selected.length - 1]!;
  return `${first.timeLabel} – ${last.endTimeLabel}`;
}

/** @deprecated Use formatTimeRange */
export const formatSelectedTimeRange = formatTimeRange;
