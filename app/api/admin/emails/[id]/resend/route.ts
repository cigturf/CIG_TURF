import { NextResponse } from "next/server";

import { CommunicationService } from "@/features/communication/services/communication.service";
import { requireAdminSession } from "@/lib/api/require-admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireAdminSession("emails.manage");
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const success = await CommunicationService.resendEmailLog(id);

  if (!success) {
    return NextResponse.json({ error: "Email log not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
