import { NextResponse } from "next/server";
import { z } from "zod";

import { isAdminUser } from "@/features/auth/services";
import { abandonPaymentSession } from "@/features/payments/services/payment-lifecycle.service";
import { parseJsonBody } from "@/lib/api/parse-request";
import { createClient } from "@/lib/supabase/server";

const abandonSchema = z
  .object({
    bookingSessionId: z.string().min(1).max(128),
  })
  .strict();

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, abandonSchema);
  if (!parsed.success) return parsed.response;

  const supabase = await createClient();
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

  const result = await abandonPaymentSession({
    bookingSessionId: parsed.data.bookingSessionId,
    userId: user.id,
  });

  return NextResponse.json({ success: true, released: result.released });
}
