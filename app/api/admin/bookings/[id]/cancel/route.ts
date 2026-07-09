import { NextResponse } from "next/server";

import { cancelAdminBooking } from "@/features/admin/bookings/services/admin-booking.service";
import { cancelBookingSchema } from "@/features/admin/bookings/schemas/cancel-booking.schema";
import { parseJsonBody } from "@/lib/api/parse-request";
import { requireAdminSession } from "@/lib/api/require-admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAdminSession("bookings.manage");
  if ("error" in auth) return auth.error;

  const parsed = await parseJsonBody(request, cancelBookingSchema);
  if (!parsed.success) return parsed.response;

  const { id } = await context.params;

  try {
    const booking = await cancelAdminBooking(
      id,
      parsed.data,
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
      { error: error instanceof Error ? error.message : "Failed to cancel booking" },
      { status: 400 },
    );
  }
}
