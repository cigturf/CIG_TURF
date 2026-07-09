import { NextResponse } from "next/server";

import { completeProfileAction } from "@/features/auth/actions/auth.actions";
import { bookingDetailsProfileSchema } from "@/features/booking/schemas/booking-details.schema";
import { parseJsonBody } from "@/lib/api/parse-request";
import { apiErrorResponse } from "@/lib/security/safe-error";

export async function POST(request: Request) {
  try {
    const parsed = await parseJsonBody(request, bookingDetailsProfileSchema);
    if (!parsed.success) return parsed.response;

    const result = await completeProfileAction(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse("Failed to save profile", 500, "auth/complete-profile", error);
  }
}
