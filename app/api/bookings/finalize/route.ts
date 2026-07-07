import { NextResponse } from "next/server";
import { z } from "zod";

import { isAdminUser } from "@/features/auth/services";
import { finalizeBookingFromSession } from "@/features/booking/services/booking-finalization.service";
import { createClient } from "@/lib/supabase/server";
import { getAppConfig } from "@/config/app.config";

const finalizeSchema = z
  .object({
    bookingSessionId: z.string().min(1).max(128),
  })
  .strict();

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = finalizeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

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
    return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 });
  }

  if (await isAdminUser(user.id)) {
    return NextResponse.json({ error: "Admin accounts cannot book as customers." }, { status: 403 });
  }

  const venueName = getAppConfig().envDisplayName;
  const result = await finalizeBookingFromSession({
    bookingSessionId: parsed.data.bookingSessionId,
    userId: user.id,
    venueName,
  });

  if (!result.success) {
    const status =
      result.code === "slots_unavailable"
        ? 409
        : result.code === "payment_unverified" || result.code === "session_invalid"
          ? 400
          : 500;

    return NextResponse.json(
      {
        success: false,
        code: result.code,
        error: result.message,
      },
      { status },
    );
  }

  return NextResponse.json({
    success: true,
    booking: {
      id: result.booking.id,
      bookingReference: result.booking.bookingReference,
    },
  });
}
