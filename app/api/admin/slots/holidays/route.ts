import { NextResponse } from "next/server";

import { clearHoliday, setHoliday } from "@/features/slots/services/slot-management.service";
import { requireAdminSession } from "@/lib/api/require-admin";

export async function POST(request: Request) {
  const auth = await requireAdminSession("slots.manage");
  if ("error" in auth) return auth.error;

  try {
    const body = (await request.json()) as { bookingDates: string[]; label?: string };
    if (!Array.isArray(body.bookingDates) || body.bookingDates.length === 0) {
      return NextResponse.json({ error: "bookingDates is required" }, { status: 400 });
    }

    await setHoliday({
      bookingDates: body.bookingDates,
      label: body.label ?? null,
      adminUserId: auth.session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to set holiday" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdminSession("slots.manage");
  if ("error" in auth) return auth.error;

  try {
    const body = (await request.json()) as { bookingDate: string };
    if (!body.bookingDate) {
      return NextResponse.json({ error: "bookingDate is required" }, { status: 400 });
    }
    await clearHoliday(body.bookingDate);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to clear holiday" },
      { status: 400 },
    );
  }
}

