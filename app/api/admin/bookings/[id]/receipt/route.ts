import { NextResponse } from "next/server";

import { getAdminBookingDetail } from "@/features/admin/bookings/services/admin-booking.service";
import { buildBookingReceiptHtml } from "@/features/booking/utils/booking-receipt";
import { requireAdminSession } from "@/lib/api/require-admin";
import { getAppConfig } from "@/config/app.config";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdminSession("bookings.view");
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const detail = await getAdminBookingDetail(id);
  if (!detail) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const html = buildBookingReceiptHtml({
    booking: detail,
    venueName: getAppConfig().envDisplayName,
    payments: detail.payments,
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
