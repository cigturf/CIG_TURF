import { NextResponse } from "next/server";

import { completeAdminBooking } from "@/features/admin/bookings/services/admin-booking.service";
import { requireAdminSession } from "@/lib/api/require-admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAdminSession("bookings.manage");
  if ("error" in auth) return auth.error;

  const { id } = await context.params;

  try {
    const body = await request.json().catch(() => ({}));
    const booking = await completeAdminBooking(
      id,
      {
        overrideOutstanding: Boolean(body.overrideOutstanding),
        overrideReason: body.overrideReason,
      },
      {
        userId: auth.session.user.id,
        email: auth.session.user.email,
      },
    );
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    return NextResponse.json(booking);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to complete booking" },
      { status: 400 },
    );
  }
}
