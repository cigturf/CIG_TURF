import type { SlotBlockState, SlotAvailabilitySnapshot } from "@/features/slots/types/slot-management.types";
import {
  deleteSlotBlock,
  deleteSlotHoliday,
  getSlotAvailabilitySnapshot,
  getSlotHoliday,
  upsertSlotBlock,
  upsertSlotHoliday,
} from "@/features/slots/services/slot-management.repository";

export async function getAvailabilityForDate(dateIso: string): Promise<SlotAvailabilitySnapshot> {
  return getSlotAvailabilitySnapshot(dateIso);
}

export async function blockSlots(input: {
  bookingDates: string[];
  slotIds: string[];
  state: SlotBlockState;
  reason?: string | null;
  adminUserId?: string | null;
}) {
  const uniqueDates = Array.from(new Set(input.bookingDates));
  const uniqueSlotIds = Array.from(new Set(input.slotIds));

  const tasks: Promise<unknown>[] = [];
  for (const dateIso of uniqueDates) {
    for (const slotId of uniqueSlotIds) {
      tasks.push(
        upsertSlotBlock({
          bookingDate: dateIso,
          slotId,
          state: input.state,
          reason: input.reason ?? null,
          createdBy: input.adminUserId ?? null,
        }),
      );
    }
  }
  await Promise.all(tasks);
}

export async function unblockSlots(input: { bookingDates: string[]; slotIds: string[] }) {
  const uniqueDates = Array.from(new Set(input.bookingDates));
  const uniqueSlotIds = Array.from(new Set(input.slotIds));

  const tasks: Promise<unknown>[] = [];
  for (const dateIso of uniqueDates) {
    for (const slotId of uniqueSlotIds) {
      tasks.push(deleteSlotBlock({ bookingDate: dateIso, slotId }));
    }
  }
  await Promise.all(tasks);
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

