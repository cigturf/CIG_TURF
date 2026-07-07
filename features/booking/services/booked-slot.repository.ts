import { parseSlotId } from "@/features/booking/utils/slot-id";
import { getSlotHoliday, listSlotBlocksForDate } from "@/features/slots/services/slot-management.repository";
import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function getBookedSlotIdsForDate(dateIso: string): Promise<string[]> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("booked_slots")
      .select("slot_id")
      .eq("booking_date", dateIso);

    if (!error && data) {
      return data.map((row) => row.slot_id as string);
    }
  }

  try {
    const rows = await prisma.bookedSlot.findMany({
      where: { bookingDate: dateIso },
      select: { slotId: true },
    });
    return rows.map((row) => row.slotId);
  } catch {
    return [];
  }
}

export async function getUnavailableSlotIds(slotIds: string[]): Promise<string[]> {
  if (slotIds.length === 0) return [];

  const byDate = new Map<string, string[]>();
  for (const slotId of slotIds) {
    const parsed = parseSlotId(slotId);
    if (!parsed) continue;
    const current = byDate.get(parsed.dateIso) ?? [];
    current.push(slotId);
    byDate.set(parsed.dateIso, current);
  }

  const [holidayEntries, blockEntries] = await Promise.all([
    Promise.all(Array.from(byDate.keys()).map((dateIso) => getSlotHoliday(dateIso))),
    Promise.all(Array.from(byDate.keys()).map((dateIso) => listSlotBlocksForDate(dateIso))),
  ]);

  const blocked = new Set<string>();
  for (const blocks of blockEntries) {
    for (const block of blocks) blocked.add(block.slotId);
  }

  const holidays = new Set<string>();
  for (const holiday of holidayEntries) {
    if (holiday) holidays.add(holiday.bookingDate);
  }

  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("booked_slots")
      .select("slot_id")
      .in("slot_id", slotIds);

    if (!error && data) {
      const booked = data.map((row) => row.slot_id as string);
      const unavailable = new Set<string>(booked);
      for (const slotId of slotIds) {
        const parsed = parseSlotId(slotId);
        if (!parsed) continue;
        if (holidays.has(parsed.dateIso) || blocked.has(slotId)) unavailable.add(slotId);
      }
      return Array.from(unavailable);
    }
  }

  try {
    const rows = await prisma.bookedSlot.findMany({
      where: { slotId: { in: slotIds } },
      select: { slotId: true },
    });
    const unavailable = new Set<string>(rows.map((row) => row.slotId));
    for (const slotId of slotIds) {
      const parsed = parseSlotId(slotId);
      if (!parsed) continue;
      if (holidays.has(parsed.dateIso) || blocked.has(slotId)) unavailable.add(slotId);
    }
    return Array.from(unavailable);
  } catch {
    const unavailable = new Set<string>();
    for (const slotId of slotIds) {
      const parsed = parseSlotId(slotId);
      if (!parsed) continue;
      if (holidays.has(parsed.dateIso) || blocked.has(slotId)) unavailable.add(slotId);
    }
    return Array.from(unavailable);
  }
}

export async function reserveBookedSlots(data: {
  bookingId: string;
  slotIds: string[];
}): Promise<{ success: true } | { success: false; conflictingSlotIds: string[] }> {
  const unavailable = await getUnavailableSlotIds(data.slotIds);
  if (unavailable.length > 0) {
    return { success: false, conflictingSlotIds: unavailable };
  }

  const supabase = createServiceRoleClient();
  const { randomUUID } = await import("crypto");
  const now = new Date().toISOString();

  const rows = data.slotIds.map((slotId) => {
    const parsed = parseSlotId(slotId);
    if (!parsed) throw new Error(`Invalid slot id: ${slotId}`);

    return {
      id: randomUUID(),
      slot_id: slotId,
      booking_id: data.bookingId,
      booking_date: parsed.dateIso,
      start_minute: parsed.startMinute,
      created_at: now,
    };
  });

  if (supabase) {
    const { error } = await supabase.from("booked_slots").insert(rows);
    if (error) {
      if (error.code === "23505") {
        const conflicting = await getUnavailableSlotIds(data.slotIds);
        return { success: false, conflictingSlotIds: conflicting };
      }
      throw new Error(error.message);
    }
    return { success: true };
  }

  try {
    await prisma.bookedSlot.createMany({
      data: rows.map((row) => ({
        id: row.id,
        slotId: row.slot_id,
        bookingId: row.booking_id,
        bookingDate: row.booking_date,
        startMinute: row.start_minute,
      })),
    });
    return { success: true };
  } catch {
    const conflicting = await getUnavailableSlotIds(data.slotIds);
    return { success: false, conflictingSlotIds: conflicting };
  }
}

export async function releaseBookedSlotsForBooking(bookingId: string): Promise<string[]> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data: rows, error: selectError } = await supabase
      .from("booked_slots")
      .select("slot_id")
      .eq("booking_id", bookingId);

    if (selectError) {
      console.error("[booked_slots] Failed to load slots for release:", selectError.message);
    }

    const slotIds = (rows ?? []).map((row) => String(row.slot_id));

    const { error: deleteError } = await supabase
      .from("booked_slots")
      .delete()
      .eq("booking_id", bookingId);

    if (!deleteError) {
      return slotIds;
    }

    console.error("[booked_slots] Supabase release failed:", deleteError.message);
  }

  try {
    const rows = await prisma.bookedSlot.findMany({
      where: { bookingId },
      select: { slotId: true },
    });
    const slotIds = rows.map((row) => row.slotId);
    await prisma.bookedSlot.deleteMany({ where: { bookingId } });
    return slotIds;
  } catch (error) {
    console.error("[booked_slots] Prisma release failed:", error);
    return [];
  }
}
