import { SLOT_HOLD_TTL_MINUTES } from "@/features/payments/constants";
import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { randomUUID } from "crypto";

function holdExpiryDate(): Date {
  return new Date(Date.now() + SLOT_HOLD_TTL_MINUTES * 60 * 1000);
}

export async function purgeExpiredSlotHolds(): Promise<void> {
  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();

  if (supabase) {
    const { error } = await supabase.from("slot_holds").delete().lt("expires_at", now);
    if (!error) return;
    console.error("[slot_holds] Supabase purge failed:", error.message);
  }

  try {
    await prisma.$executeRaw`DELETE FROM slot_holds WHERE expires_at < ${now}`;
  } catch (error) {
    console.error("[slot_holds] Prisma purge failed:", error);
  }
}

export async function releaseSlotHoldsForSession(bookingSessionId: string): Promise<void> {
  const supabase = createServiceRoleClient();

  if (supabase) {
    const { error } = await supabase
      .from("slot_holds")
      .delete()
      .eq("booking_session_id", bookingSessionId);

    if (!error) return;
    console.error("[slot_holds] Supabase release failed:", error.message);
  }

  try {
    await prisma.$executeRaw`DELETE FROM slot_holds WHERE booking_session_id = ${bookingSessionId}`;
  } catch (error) {
    console.error("[slot_holds] Prisma release failed:", error);
  }
}

/** Returns slot IDs held by a different booking session (still active). */
export async function getForeignHeldSlotIds(
  slotIds: string[],
  bookingSessionId: string,
): Promise<string[]> {
  if (slotIds.length === 0) return [];

  await purgeExpiredSlotHolds();

  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();

  if (supabase) {
    const { data, error } = await supabase
      .from("slot_holds")
      .select("slot_id, booking_session_id")
      .in("slot_id", slotIds)
      .gt("expires_at", now);

    if (!error && data) {
      return data
        .filter((row) => row.booking_session_id !== bookingSessionId)
        .map((row) => String(row.slot_id));
    }

    if (error) {
      console.error("[slot_holds] Supabase lookup failed:", error.message);
    }
  }

  return [];
}

export async function getActiveHeldSlotIdsForDate(dateIso: string): Promise<string[]> {
  await purgeExpiredSlotHolds();

  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();
  const prefix = `${dateIso}-`;

  if (supabase) {
    const { data, error } = await supabase
      .from("slot_holds")
      .select("slot_id")
      .like("slot_id", `${prefix}%`)
      .gt("expires_at", now);

    if (!error && data) {
      return data.map((row) => String(row.slot_id));
    }

    if (error) {
      console.error("[slot_holds] Supabase date lookup failed:", error.message);
    }
  }

  return [];
}

export async function upsertSlotHolds(
  bookingSessionId: string,
  slotIds: string[],
): Promise<void> {
  if (slotIds.length === 0) return;

  await releaseSlotHoldsForSession(bookingSessionId);
  await purgeExpiredSlotHolds();

  const expiresAt = holdExpiryDate().toISOString();
  const supabase = createServiceRoleClient();

  if (supabase) {
    const rows = slotIds.map((slotId) => ({
      id: randomUUID(),
      slot_id: slotId,
      booking_session_id: bookingSessionId,
      expires_at: expiresAt,
    }));

    const { error } = await supabase.from("slot_holds").insert(rows);
    if (!error) return;

    if (error.code === "23505") {
      throw new Error("One or more slots are currently held by another booking.");
    }

    console.error("[slot_holds] Supabase insert failed:", error.message);
    throw new Error(`Failed to reserve slots: ${error.message}`);
  }

  throw new Error("Slot holds require Supabase service role configuration.");
}

/** Admin emergency: release active holds for specific slot IDs. */
export async function releaseSlotHoldsBySlotIds(slotIds: string[]): Promise<string[]> {
  if (slotIds.length === 0) return [];

  await purgeExpiredSlotHolds();

  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();

  if (supabase) {
    const { data, error: selectError } = await supabase
      .from("slot_holds")
      .select("slot_id")
      .in("slot_id", slotIds)
      .gt("expires_at", now);

    if (selectError) {
      console.error("[slot_holds] Supabase lookup failed:", selectError.message);
    }

    const held = (data ?? []).map((row) => String(row.slot_id));

    const { error: deleteError } = await supabase
      .from("slot_holds")
      .delete()
      .in("slot_id", slotIds);

    if (!deleteError) return held;

    console.error("[slot_holds] Supabase release by slot failed:", deleteError.message);
  }

  try {
    const rows = await prisma.$queryRaw<Array<{ slot_id: string }>>`
      SELECT slot_id FROM slot_holds
      WHERE slot_id = ANY(${slotIds}) AND expires_at > ${now}
    `;
    const held = rows.map((row) => row.slot_id);
    await prisma.$executeRaw`
      DELETE FROM slot_holds WHERE slot_id = ANY(${slotIds})
    `;
    return held;
  } catch (error) {
    console.error("[slot_holds] Prisma release by slot failed:", error);
    return [];
  }
}
