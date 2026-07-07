import type { BookingEngineConfig, BookingSlot, BookingSummary } from "@/features/booking/types";
import { formatDurationLabel } from "@/features/booking/utils/time";
import { formatTimeRange } from "@/features/booking/utils/format-time-range";
import { calculateRemainingAmount } from "@/features/booking/utils/pricing";

export function calculateBookingSummary(
  slots: BookingSlot[],
  selectedSlotIds: string[],
  config: Pick<BookingEngineConfig, "fixedAdvanceAmount" | "slotDurationMinutes">,
): BookingSummary {
  const selected = slots.filter((slot) => selectedSlotIds.includes(slot.id));
  const slotCount = selected.length;
  const totalDurationMinutes = slotCount * config.slotDurationMinutes;
  const totalPrice = selected.reduce((sum, slot) => sum + slot.price, 0);
  const advanceAmount = config.fixedAdvanceAmount;
  const remainingAmount = calculateRemainingAmount(totalPrice, advanceAmount);

  return {
    timeRange: formatTimeRange(slots, selectedSlotIds),
    slotCount,
    totalDurationMinutes,
    totalDurationLabel: formatDurationLabel(totalDurationMinutes),
    totalPrice,
    advanceAmount,
    remainingAmount,
  };
}

/** Merges selected consecutive slots into a display time range */
export function mergeConsecutiveSlots(
  slots: BookingSlot[],
  selectedSlotIds: string[],
): string | null {
  return formatTimeRange(slots, selectedSlotIds);
}
