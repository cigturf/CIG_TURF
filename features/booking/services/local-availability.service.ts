import type { SlotStatus } from "@/features/booking/types";

/**
 * Temporary local availability data until database integration.
 * Returns slot sort-order indices that are unavailable for a given date.
 */
export function getLocalUnavailableSlotIndices(dateIso: string): Map<number, SlotStatus> {
  const unavailable = new Map<number, SlotStatus>();
  const seed = dateIso.split("-").reduce((sum, part) => sum + Number(part), 0);

  unavailable.set((seed * 3) % 48, "booked");
  unavailable.set((seed * 5 + 7) % 48, "reserved");
  unavailable.set((seed * 11 + 13) % 48, "blocked");

  return unavailable;
}
