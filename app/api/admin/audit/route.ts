import { NextResponse } from "next/server";

import { getAuditDirectoryData } from "@/features/audit/services/audit.service";
import type { AuditCategory, AuditDatePreset } from "@/features/audit/types/audit.types";
import { requireAdminSession } from "@/lib/api/require-admin";

export async function GET(request: Request) {
  const auth = await requireAdminSession("audit.view");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const data = await getAuditDirectoryData({
    preset: (searchParams.get("preset") as AuditDatePreset) ?? "last_7_days",
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    category: (searchParams.get("category") as AuditCategory | "all") ?? "all",
    search: searchParams.get("search") ?? undefined,
  });

  return NextResponse.json(data);
}
