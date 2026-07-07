import { NextResponse } from "next/server";

import { parseBookingListQuery } from "@/features/admin/bookings/lib/booking-filters";
import { listAdminBookings } from "@/features/admin/bookings/services/admin-booking.repository";
import {
  buildBookingsCsv,
  buildBookingsExcelCsv,
  buildBookingsPdfHtml,
} from "@/features/admin/bookings/services/booking-export.service";
import { requireAdminSession } from "@/lib/api/require-admin";
import { getAppConfig } from "@/config/app.config";

export async function GET(request: Request) {
  const auth = await requireAdminSession("bookings.view");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "csv";
  const { bookings } = await listAdminBookings(parseBookingListQuery(searchParams));
  const timestamp = new Date().toISOString().slice(0, 10);

  if (format === "pdf") {
    const html = buildBookingsPdfHtml(bookings, getAppConfig().envDisplayName);
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="bookings-${timestamp}.html"`,
      },
    });
  }

  if (format === "xlsx") {
    return new NextResponse(buildBookingsExcelCsv(bookings), {
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": `attachment; filename="bookings-${timestamp}.csv"`,
      },
    });
  }

  return new NextResponse(buildBookingsCsv(bookings), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bookings-${timestamp}.csv"`,
    },
  });
}
