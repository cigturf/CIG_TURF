import { NextResponse } from "next/server";

import { listEmailLogs } from "@/features/communication/services/email-log.repository";
import { isEmailDevMode } from "@/features/communication/providers/resolve-email-provider";
import { requireAdminSession } from "@/lib/api/require-admin";

export async function GET(request: Request) {
  const auth = await requireAdminSession("emails.view");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const logs = await listEmailLogs({
    limit: Number(searchParams.get("limit") ?? 100),
    search: searchParams.get("search") ?? undefined,
  });

  return NextResponse.json({
    logs,
    devMode: isEmailDevMode(),
  });
}
