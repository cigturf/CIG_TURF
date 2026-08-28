import { NextResponse } from "next/server";

import { blockSlots, unblockSlots } from "@/features/slots/services/slot-management.service";
import { requireAdminSession } from "@/lib/api/require-admin";

type SlotBlockItem = { bookingDate: string; slotIds: string[] };

function parseItems(raw: unknown): SlotBlockItem[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const items: SlotBlockItem[] = [];
  for (const entry of raw) {
    if (
      !entry ||
      typeof entry !== "object" ||
      typeof (entry as { bookingDate?: unknown }).bookingDate !== "string" ||
      !Array.isArray((entry as { slotIds?: unknown }).slotIds) ||
      (entry as { slotIds: unknown[] }).slotIds.some((id) => typeof id !== "string") ||
      (entry as { slotIds: unknown[] }).slotIds.length === 0
    ) {
      return null;
    }
    items.push(entry as SlotBlockItem);
  }
  return items;
}

export async function POST(request: Request) {
  const auth = await requireAdminSession("slots.manage");
  if ("error" in auth) return auth.error;

  try {
    const body = (await request.json()) as {
      items: SlotBlockItem[];
      state: "blocked" | "maintenance";
      reason?: string;
    };

    const items = parseItems(body.items);
    if (!items) {
      return NextResponse.json({ error: "items is required" }, { status: 400 });
    }
    if (body.state !== "blocked" && body.state !== "maintenance") {
      return NextResponse.json({ error: "Invalid state" }, { status: 400 });
    }

    await blockSlots({
      items,
      state: body.state,
      reason: body.reason ?? null,
      adminUserId: auth.session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to block slots" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdminSession("slots.manage");
  if ("error" in auth) return auth.error;

  try {
    const body = (await request.json()) as { items: SlotBlockItem[] };
    const items = parseItems(body.items);
    if (!items) {
      return NextResponse.json({ error: "items is required" }, { status: 400 });
    }

    await unblockSlots({ items });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to unblock slots" },
      { status: 400 },
    );
  }
}

