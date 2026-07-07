import { NextResponse } from "next/server";

import { parseBookingListQuery } from "@/features/admin/bookings/lib/booking-filters";
import { listAdminBookings } from "@/features/admin/bookings/services/admin-booking.repository";
import { createManualBooking } from "@/features/admin/bookings/services/admin-booking.service";
import { requireAdminSession } from "@/lib/api/require-admin";

export async function GET(request: Request) {
  const auth = await requireAdminSession("bookings.view");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const data = await listAdminBookings(parseBookingListQuery(searchParams));
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const auth = await requireAdminSession("bookings.manage");
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const booking = await createManualBooking(body, auth.session.user.id);
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create booking" },
      { status: 400 },
    );
  }
}
