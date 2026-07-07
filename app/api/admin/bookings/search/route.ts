import { NextResponse } from "next/server";

import { searchAdminBookings } from "@/features/admin/bookings/services/admin-booking.repository";
import { requireAdminSession } from "@/lib/api/require-admin";

export async function GET(request: Request) {
  const auth = await requireAdminSession("bookings.view");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const bookings = await searchAdminBookings(query);
  return NextResponse.json({ bookings });
}
