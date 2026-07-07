import { NextResponse } from "next/server";

import { getBookingById } from "@/features/booking/services/booking.repository";
import { CommunicationService } from "@/features/communication/services/communication.service";
import { requireAdminSession } from "@/lib/api/require-admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireAdminSession("bookings.manage");
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const booking = await getBookingById(id);

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (!booking.customerEmail) {
    return NextResponse.json({ error: "Customer email is missing" }, { status: 400 });
  }

  if (booking.remainingAmount <= 0) {
    return NextResponse.json({ error: "No outstanding balance for this booking" }, { status: 400 });
  }

  await CommunicationService.sendPaymentReminder(booking);

  return NextResponse.json({ success: true });
}
