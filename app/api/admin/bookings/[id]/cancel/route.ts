import { NextResponse } from "next/server";
import { z } from "zod";

import { cancelAdminBooking } from "@/features/admin/bookings/services/admin-booking.service";
import { requireAdminSession } from "@/lib/api/require-admin";

const cancelSchema = z
  .object({
    reason: z.string().trim().min(1, "Cancellation reason is required."),
    initiateRefund: z.boolean().optional(),
  })
  .strict();

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAdminSession("bookings.manage");
  if ("error" in auth) return auth.error;

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = cancelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

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
