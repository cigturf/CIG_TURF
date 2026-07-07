import type { BookingEngineConfig, BookingSlot } from "@/features/booking/types";

export type SlotSelectionResult = {
  selectedSlotIds: string[];
  rejected: boolean;
  rejectionReason?: "non_consecutive" | "max_duration" | "not_selectable" | "past";
};

export const BOOKING_MESSAGES = {
  nonConsecutive: "Please select consecutive time slots.",
  maxDuration: "Maximum booking duration reached.",
  notSelectable: "This slot is not available.",
  pastSlot: "Past time slots cannot be selected.",
  noSelection: "Please select at least one time slot.",
} as const;

function sortByOrder(slots: BookingSlot[], ids: string[]): string[] {
  const order = new Map(slots.map((slot) => [slot.id, slot.sortOrder]));
  return [...ids].sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
}

function getContiguousIndices(slots: BookingSlot[], ids: string[]): number[] {
  return sortByOrder(slots, ids).map((id) => slots.findIndex((slot) => slot.id === id));
}

/** Returns whether every index in `indices` forms a consecutive run */
export function areConsecutiveIndices(indices: number[]): boolean {
  if (indices.length <= 1) return true;
  const sorted = [...indices].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] !== sorted[i - 1]! + 1) return false;
  }
  return true;
}

export function validateConsecutiveSelection(indices: number[]): boolean {
  return areConsecutiveIndices(indices);
}

function wouldExceedMaxDuration(
  slots: BookingSlot[],
  selectedSlotIds: string[],
  nextSlotId: string,
  maxConsecutiveDurationMinutes: number,
): boolean {
  const next = slots.find((slot) => slot.id === nextSlotId);
  if (!next) return true;
  const projectedCount = selectedSlotIds.includes(nextSlotId)
    ? selectedSlotIds.length - 1
    : selectedSlotIds.length + 1;
  const projectedDuration = projectedCount * next.duration;
  return projectedDuration > maxConsecutiveDurationMinutes;
}

/**
 * Toggles a slot in the selection.
 * Only selectable slots may be chosen and new picks must stay consecutive.
 */
export function toggleConsecutiveSlot(
  slots: BookingSlot[],
  selectedSlotIds: string[],
  slotId: string,
  config?: Pick<BookingEngineConfig, "maxConsecutiveDurationMinutes">,
): SlotSelectionResult {
  const slot = slots.find((item) => item.id === slotId);
  if (!slot) {
    return { selectedSlotIds, rejected: false };
  }

  if (slot.isPast) {
    return { selectedSlotIds, rejected: true, rejectionReason: "past" };
  }

  if (!slot.isSelectable) {
    return { selectedSlotIds, rejected: true, rejectionReason: "not_selectable" };
  }

  if (selectedSlotIds.includes(slotId)) {
    const remaining = selectedSlotIds.filter((id) => id !== slotId);
    const indices = getContiguousIndices(slots, remaining);
    if (!areConsecutiveIndices(indices)) {
      return { selectedSlotIds: sortByOrder(slots, [slotId]), rejected: false };
    }
    return { selectedSlotIds: sortByOrder(slots, remaining), rejected: false };
  }

  if (
    config &&
    wouldExceedMaxDuration(slots, selectedSlotIds, slotId, config.maxConsecutiveDurationMinutes)
  ) {
    return { selectedSlotIds, rejected: true, rejectionReason: "max_duration" };
  }

  if (selectedSlotIds.length === 0) {
    return { selectedSlotIds: [slotId], rejected: false };
  }

  const indices = getContiguousIndices(slots, selectedSlotIds);
  const clickIndex = slots.findIndex((item) => item.id === slotId);
  const minIndex = Math.min(...indices);
  const maxIndex = Math.max(...indices);

  if (clickIndex === minIndex - 1 || clickIndex === maxIndex + 1) {
    return {
      selectedSlotIds: sortByOrder(slots, [...selectedSlotIds, slotId]),
      rejected: false,
    };
  }

  return { selectedSlotIds, rejected: true, rejectionReason: "non_consecutive" };
}
