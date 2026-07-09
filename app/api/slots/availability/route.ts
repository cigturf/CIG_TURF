import { NextResponse } from "next/server";
import { z } from "zod";

import { getAvailabilityForDate } from "@/features/slots/services/slot-management.service";
import { isoDateSchema } from "@/lib/validations/request";

const availabilityQuerySchema = z
  .object({
    dateIso: isoDateSchema,
  })
  .strict();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = availabilityQuerySchema.safeParse({
    dateIso: searchParams.get("dateIso"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  try {
    const snapshot = await getAvailabilityForDate(parsed.data.dateIso);
    return NextResponse.json(snapshot, {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("[slots/availability]", error);
    return NextResponse.json(
      { error: "Unable to load slot availability" },
      { status: 503 },
    );
  }
}
