import { NextResponse } from "next/server";

import { duplicateAdminBooking } from "@/features/admin/bookings/services/admin-booking.service";
import { requireAdminSession } from "@/lib/api/require-admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireAdminSession("bookings.manage");
  if ("error" in auth) return auth.error;

  const { id } = await context.params;

  try {
    const booking = await duplicateAdminBooking(id, auth.session.user.id);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to duplicate booking" },
      { status: 400 },
    );
  }
}
