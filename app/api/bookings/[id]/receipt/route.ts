import { NextResponse } from "next/server";

import { getBookingById } from "@/features/booking/services/booking.repository";
import { buildBookingReceiptHtml } from "@/features/booking/utils/booking-receipt";
import { isAdminUser } from "@/features/auth/services";
import { createClient } from "@/lib/supabase/server";
import { getAppConfig } from "@/config/app.config";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return NextResponse.json({ error: "Unable to connect" }, { status: 503 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const booking = await getBookingById(id);
  if (!booking || booking.userId !== user.id) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (await isAdminUser(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const venueName = getAppConfig().envDisplayName;
  const html = buildBookingReceiptHtml({ booking, venueName });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
