import { NextResponse } from "next/server";

import { blockSlots, unblockSlots } from "@/features/slots/services/slot-management.service";
import { requireAdminSession } from "@/lib/api/require-admin";

export async function POST(request: Request) {
  const auth = await requireAdminSession("slots.manage");
  if ("error" in auth) return auth.error;

  try {
    const body = (await request.json()) as {
      bookingDates: string[];
      slotIds: string[];
      state: "blocked" | "maintenance";
      reason?: string;
    };

    if (!Array.isArray(body.bookingDates) || body.bookingDates.length === 0) {
      return NextResponse.json({ error: "bookingDates is required" }, { status: 400 });
    }
    if (!Array.isArray(body.slotIds) || body.slotIds.length === 0) {
      return NextResponse.json({ error: "slotIds is required" }, { status: 400 });
    }
    if (body.state !== "blocked" && body.state !== "maintenance") {
      return NextResponse.json({ error: "Invalid state" }, { status: 400 });
    }

    await blockSlots({
      bookingDates: body.bookingDates,
      slotIds: body.slotIds,
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
    const body = (await request.json()) as { bookingDates: string[]; slotIds: string[] };
    if (!Array.isArray(body.bookingDates) || body.bookingDates.length === 0) {
      return NextResponse.json({ error: "bookingDates is required" }, { status: 400 });
    }
    if (!Array.isArray(body.slotIds) || body.slotIds.length === 0) {
      return NextResponse.json({ error: "slotIds is required" }, { status: 400 });
    }

    await unblockSlots({ bookingDates: body.bookingDates, slotIds: body.slotIds });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to unblock slots" },
      { status: 400 },
    );
  }
}

