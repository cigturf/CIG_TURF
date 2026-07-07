import { NextResponse } from "next/server";
import { z } from "zod";

import { recordAuditFromAppEvent } from "@/features/audit/services/audit.service";
import { getAdminContext } from "@/features/admin/services/admin-context.service";
import type { AppEventEnvelope } from "@/features/events/types/event.types";
import { parseJsonBody } from "@/lib/api/parse-request";
import { apiErrorResponse } from "@/lib/security/safe-error";
import { getSession } from "@/server/auth/session";

const auditEventSchema = z
  .object({
    id: z.string().min(1).max(128),
    type: z.string().min(1).max(128),
    version: z.literal(1),
    payload: z.record(z.string(), z.unknown()),
    occurredAt: z.string().optional(),
    source: z.string().optional(),
  })
  .strict();

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseJsonBody(request, auditEventSchema);
  if (!parsed.success) return parsed.response;

  try {
    const admin = await getAdminContext(session.user.id);
    const event = parsed.data as AppEventEnvelope;

    const record = await recordAuditFromAppEvent(event, {
      id: admin?.userId ?? session.user.id,
      email: admin?.email ?? session.user.email ?? null,
    });

    if (!record) {
      return NextResponse.json({ skipped: true });
    }

    return NextResponse.json(record);
  } catch (error) {
    return apiErrorResponse("Failed to record audit log", 400, "audit/record", error);
  }
}
