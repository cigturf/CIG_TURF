import { getBookedSlotIdsForDate } from "@/features/booking/services/booked-slot.repository";
import { parseSlotId } from "@/features/booking/utils/slot-id";
import { formatMinutesAsTime } from "@/features/booking/utils/time";
import type { SlotBlockState, SlotAvailabilitySnapshot } from "@/features/slots/types/slot-management.types";
import {
  deleteSlotBlock,
  deleteSlotHoliday,
  getSlotAvailabilitySnapshot,
  getSlotHoliday,
  upsertSlotBlock,
  upsertSlotHoliday,
} from "@/features/slots/services/slot-management.repository";
import { formatDate } from "@/utils/format";

export async function getAvailabilityForDate(dateIso: string): Promise<SlotAvailabilitySnapshot> {
  return getSlotAvailabilitySnapshot(dateIso);
}

export type SlotBlockConflict = { bookingDate: string; slotId: string };

/** Summarizes slot ids per date into a human-readable line for owner notification emails. */
function summarizeSlotsByDate(
  byDate: Map<string, string[]>,
): Array<{ label: string; value: string }> {
  return Array.from(byDate.entries()).map(([bookingDate, slotIds]) => {
    const times = slotIds
      .map((slotId) => parseSlotId(slotId)?.startMinute)
      .filter((minute): minute is number => minute !== undefined)
      .sort((a, b) => a - b)
      .map(formatMinutesAsTime);
    const shown = times.slice(0, 6).join(", ");
    const suffix = times.length > 6 ? ` +${times.length - 6} more` : "";
    return {
      label: formatDate(`${bookingDate}T00:00:00`),
      value: `${times.length} slot(s) — ${shown}${suffix}`,
    };
  });
}

async function notifySlotsBlocked(input: {
  state: SlotBlockState;
  reason: string | null;
  byDate: Map<string, string[]>;
  totalSlots: number;
}): Promise<void> {
  if (input.totalSlots === 0) return;
  const { dispatchSlotsBlockedEmail } = await import(
    "@/features/communication/services/communication-dispatcher"
  );
  await dispatchSlotsBlockedEmail({
    state: input.state,
    reason: input.reason,
    totalSlots: input.totalSlots,
    dateSummaries: summarizeSlotsByDate(input.byDate),
  });
}

async function notifySlotsUnblocked(input: {
  byDate: Map<string, string[]>;
  totalSlots: number;
}): Promise<void> {
  if (input.totalSlots === 0) return;
  const { dispatchSlotsUnblockedEmail } = await import(
    "@/features/communication/services/communication-dispatcher"
  );
  await dispatchSlotsUnblockedEmail({
    totalSlots: input.totalSlots,
    dateSummaries: summarizeSlotsByDate(input.byDate),
  });
}

export async function blockSlots(input: {
  items: Array<{ bookingDate: string; slotIds: string[] }>;
  state: SlotBlockState;
  reason?: string | null;
  adminUserId?: string | null;
}): Promise<{ blockedCount: number; conflicts: SlotBlockConflict[] }> {
  const bookedSlotIdsByDate = new Map(
    await Promise.all(
      input.items.map(
        async ({ bookingDate }) =>
          [bookingDate, new Set(await getBookedSlotIdsForDate(bookingDate))] as const,
      ),
    ),
  );

  const conflicts: SlotBlockConflict[] = [];
  const tasks: Promise<unknown>[] = [];
  const blockedByDate = new Map<string, string[]>();

  for (const { bookingDate, slotIds } of input.items) {
    const bookedSlotIds = bookedSlotIdsByDate.get(bookingDate) ?? new Set<string>();
    const blockedIds: string[] = [];

    for (const slotId of Array.from(new Set(slotIds))) {
      if (bookedSlotIds.has(slotId)) {
        conflicts.push({ bookingDate, slotId });
        continue;
      }

      blockedIds.push(slotId);
      tasks.push(
        upsertSlotBlock({
          bookingDate,
          slotId,
          state: input.state,
          reason: input.reason ?? null,
          createdBy: input.adminUserId ?? null,
        }),
      );
    }

    if (blockedIds.length > 0) blockedByDate.set(bookingDate, blockedIds);
  }

  await Promise.all(tasks);

  void notifySlotsBlocked({
    state: input.state,
    reason: input.reason ?? null,
    byDate: blockedByDate,
    totalSlots: tasks.length,
  }).catch((error) => console.error("[blockSlots] Failed to send owner notification:", error));

  return { blockedCount: tasks.length, conflicts };
}

export async function unblockSlots(input: { items: Array<{ bookingDate: string; slotIds: string[] }> }) {
  const tasks: Promise<unknown>[] = [];
  const unblockedByDate = new Map<string, string[]>();

  for (const { bookingDate, slotIds } of input.items) {
    const uniqueIds = Array.from(new Set(slotIds));
    if (uniqueIds.length > 0) unblockedByDate.set(bookingDate, uniqueIds);
    for (const slotId of uniqueIds) {
      tasks.push(deleteSlotBlock({ bookingDate, slotId }));
    }
  }

  await Promise.all(tasks);

  void notifySlotsUnblocked({
    byDate: unblockedByDate,
    totalSlots: tasks.length,
  }).catch((error) => console.error("[unblockSlots] Failed to send owner notification:", error));
}

export async function setHoliday(input: {
  bookingDates: string[];
  label?: string | null;
  adminUserId?: string | null;
}) {
  const uniqueDates = Array.from(new Set(input.bookingDates));
  await Promise.all(
    uniqueDates.map((dateIso) =>
      upsertSlotHoliday({
        bookingDate: dateIso,
        label: input.label ?? null,
        createdBy: input.adminUserId ?? null,
      }),
    ),
  );
}

export async function clearHoliday(dateIso: string) {
  await deleteSlotHoliday(dateIso);
}

export async function isHoliday(dateIso: string): Promise<boolean> {
  const holiday = await getSlotHoliday(dateIso);
  return Boolean(holiday);
}

