import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase/admin";

import type {
  SlotAvailabilitySnapshot,
  SlotBlockRecord,
  SlotBlockState,
  SlotHolidayRecord,
} from "@/features/slots/types/slot-management.types";

type SlotBlockRow = {
  id: string;
  booking_date: string;
  slot_id: string;
  state: SlotBlockState;
  reason: string | null;
  created_by: string | null;
  created_at: string;
};

type SlotHolidayRow = {
  id: string;
  booking_date: string;
  label: string | null;
  created_by: string | null;
  created_at: string;
};

function mapSlotBlock(row: SlotBlockRow): SlotBlockRecord {
  return {
    id: row.id,
    bookingDate: row.booking_date,
    slotId: row.slot_id,
    state: row.state,
    reason: row.reason,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
  };
}

function mapSlotHoliday(row: SlotHolidayRow): SlotHolidayRecord {
  return {
    id: row.id,
    bookingDate: row.booking_date,
    label: row.label,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
  };
}

export async function listSlotBlocksForDate(dateIso: string): Promise<SlotBlockRecord[]> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("slot_blocks")
      .select("id, booking_date, slot_id, state, reason, created_by, created_at")
      .eq("booking_date", dateIso)
      .order("created_at", { ascending: true });
    if (!error && data) return (data as SlotBlockRow[]).map(mapSlotBlock);
  }

  try {
    const rows = await prisma.slotBlock.findMany({
      where: { bookingDate: dateIso },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((row) => ({
      id: row.id,
      bookingDate: row.bookingDate,
      slotId: row.slotId,
      state: row.state as SlotBlockState,
      reason: row.reason ?? null,
      createdBy: row.createdBy ?? null,
      createdAt: row.createdAt,
    }));
  } catch {
    return [];
  }
}

export async function upsertSlotBlock(data: {
  bookingDate: string;
  slotId: string;
  state: SlotBlockState;
  reason?: string | null;
  createdBy?: string | null;
}): Promise<SlotBlockRecord> {
  const { randomUUID } = await import("crypto");
  const id = randomUUID();
  const now = new Date().toISOString();

  const supabase = createServiceRoleClient();
  if (supabase) {
    const payload = {
      id,
      booking_date: data.bookingDate,
      slot_id: data.slotId,
      state: data.state,
      reason: data.reason ?? null,
      created_by: data.createdBy ?? null,
      created_at: now,
    };

    // Supabase doesn't support "upsert on unique constraint name" with the service role
    // across all versions consistently; use delete+insert to stay deterministic.
    await supabase.from("slot_blocks").delete().eq("booking_date", data.bookingDate).eq("slot_id", data.slotId);
    const { data: row, error } = await supabase.from("slot_blocks").insert(payload).select("*").single();
    if (!error && row) return mapSlotBlock(row as SlotBlockRow);
    if (error) throw new Error(error.message);
  }

  const row = await prisma.slotBlock.upsert({
    where: { bookingDate_slotId: { bookingDate: data.bookingDate, slotId: data.slotId } },
    create: {
      id,
      bookingDate: data.bookingDate,
      slotId: data.slotId,
      state: data.state,
      reason: data.reason ?? null,
      createdBy: data.createdBy ?? null,
      createdAt: new Date(now),
    },
    update: {
      state: data.state,
      reason: data.reason ?? null,
      createdBy: data.createdBy ?? null,
    },
  });

  return {
    id: row.id,
    bookingDate: row.bookingDate,
    slotId: row.slotId,
    state: row.state as SlotBlockState,
    reason: row.reason ?? null,
    createdBy: row.createdBy ?? null,
    createdAt: row.createdAt,
  };
}

export async function deleteSlotBlock(data: { bookingDate: string; slotId: string }): Promise<void> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    await supabase.from("slot_blocks").delete().eq("booking_date", data.bookingDate).eq("slot_id", data.slotId);
    return;
  }

  try {
    await prisma.slotBlock.delete({
      where: { bookingDate_slotId: { bookingDate: data.bookingDate, slotId: data.slotId } },
    });
  } catch {
    // already deleted
  }
}

export async function getSlotHoliday(dateIso: string): Promise<SlotHolidayRecord | null> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("slot_holidays")
      .select("*")
      .eq("booking_date", dateIso)
      .maybeSingle();
    if (!error && data) return mapSlotHoliday(data as SlotHolidayRow);
  }

  try {
    const row = await prisma.slotHoliday.findUnique({ where: { bookingDate: dateIso } });
    if (!row) return null;
    return {
      id: row.id,
      bookingDate: row.bookingDate,
      label: row.label ?? null,
      createdBy: row.createdBy ?? null,
      createdAt: row.createdAt,
    };
  } catch {
    return null;
  }
}

export async function upsertSlotHoliday(data: {
  bookingDate: string;
  label?: string | null;
  createdBy?: string | null;
}): Promise<SlotHolidayRecord> {
  const { randomUUID } = await import("crypto");
  const id = randomUUID();
  const now = new Date().toISOString();

  const supabase = createServiceRoleClient();
  if (supabase) {
    const payload = {
      id,
      booking_date: data.bookingDate,
      label: data.label ?? null,
      created_by: data.createdBy ?? null,
      created_at: now,
    };
    await supabase.from("slot_holidays").delete().eq("booking_date", data.bookingDate);
    const { data: row, error } = await supabase.from("slot_holidays").insert(payload).select("*").single();
    if (!error && row) return mapSlotHoliday(row as SlotHolidayRow);
    if (error) throw new Error(error.message);
  }

  const row = await prisma.slotHoliday.upsert({
    where: { bookingDate: data.bookingDate },
    create: {
      id,
      bookingDate: data.bookingDate,
      label: data.label ?? null,
      createdBy: data.createdBy ?? null,
      createdAt: new Date(now),
    },
    update: {
      label: data.label ?? null,
      createdBy: data.createdBy ?? null,
    },
  });

  return {
    id: row.id,
    bookingDate: row.bookingDate,
    label: row.label ?? null,
    createdBy: row.createdBy ?? null,
    createdAt: row.createdAt,
  };
}

export async function deleteSlotHoliday(dateIso: string): Promise<void> {
  const supabase = createServiceRoleClient();
  if (supabase) {
    await supabase.from("slot_holidays").delete().eq("booking_date", dateIso);
    return;
  }

  try {
    await prisma.slotHoliday.delete({ where: { bookingDate: dateIso } });
  } catch {
    // already deleted
  }
}

export async function getSlotAvailabilitySnapshot(dateIso: string): Promise<SlotAvailabilitySnapshot> {
  const bookedSlotRepo = await import("@/features/booking/services/booked-slot.repository");
  const slotHoldRepo = await import("@/features/booking/services/slot-hold.repository");

  const [bookedSlotIds, heldSlotIds, blocks, holiday] = await Promise.all([
    bookedSlotRepo.getBookedSlotIdsForDate(dateIso),
    slotHoldRepo.getActiveHeldSlotIdsForDate(dateIso),
    listSlotBlocksForDate(dateIso),
    getSlotHoliday(dateIso),
  ]);

  const allBooked = Array.from(new Set([...bookedSlotIds, ...heldSlotIds]));

  const blockedSlotIds: string[] = [];
  const maintenanceSlotIds: string[] = [];
  for (const block of blocks) {
    if (block.state === "maintenance") maintenanceSlotIds.push(block.slotId);
    else blockedSlotIds.push(block.slotId);
  }

  return {
    bookedSlotIds: allBooked,
    blockedSlotIds,
    maintenanceSlotIds,
    isHoliday: Boolean(holiday),
  };
}

