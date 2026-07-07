import { NextResponse } from "next/server";

import {
  getAdminBookingDetail,
  updateAdminBooking,
} from "@/features/admin/bookings/services/admin-booking.service";
import { requireAdminSession } from "@/lib/api/require-admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdminSession("bookings.view");
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const booking = await getAdminBookingDetail(id);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json(booking);
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminSession("bookings.manage");
  if ("error" in auth) return auth.error;

  const { id } = await context.params;

  try {
    const body = await request.json();
    const booking = await updateAdminBooking(id, body);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    return NextResponse.json(booking);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update booking" },
      { status: 400 },
    );
  }
}
