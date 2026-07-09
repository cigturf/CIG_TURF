import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminSession } from "@/lib/api/require-admin";
import { releaseSlotHoldsBySlotIds } from "@/features/booking/services/slot-hold.repository";
import { parseJsonBody } from "@/lib/api/parse-request";

const releaseHoldsSchema = z
  .object({
    slotIds: z.array(z.string().min(1)).min(1).max(32),
  })
  .strict();

export async function DELETE(request: Request) {
  const auth = await requireAdminSession("slots.manage");
  if (auth.error) return auth.error;

  const parsed = await parseJsonBody(request, releaseHoldsSchema);
  if (!parsed.success) return parsed.response;

  const released = await releaseSlotHoldsBySlotIds(parsed.data.slotIds);

  return NextResponse.json({
    success: true,
    releasedSlotIds: released,
  });
}
