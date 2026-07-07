import { NextResponse } from "next/server";

import { saveCustomerProfile } from "@/features/auth/services/save-customer-profile.service";
import { bookingDetailsProfileSchema } from "@/features/booking/schemas/booking-details.schema";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string; phone?: string };
    const parsed = bookingDetailsProfileSchema.safeParse({
      name: body.name ?? "",
      phone: body.phone ?? "",
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message ?? "Invalid profile details",
        },
        { status: 400 },
      );
    }

    const result = await saveCustomerProfile({
      name: parsed.data.name,
      phone: parsed.data.phone,
      context: "booking",
    });

    if (!result.success) {
      const status = result.error.toLowerCase().includes("session expired") ? 401 : 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to save profile" },
      { status: 500 },
    );
  }
}
