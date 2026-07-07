import { NextResponse } from "next/server";

import {
  buildAuditCsv,
  buildAuditExcelCsv,
  buildAuditPdfHtml,
} from "@/features/audit/services/audit-export.service";
import { getAuditDirectoryData } from "@/features/audit/services/audit.service";
import type { AuditCategory, AuditDatePreset } from "@/features/audit/types/audit.types";
import { requireAdminSession } from "@/lib/api/require-admin";
import { getAppConfig } from "@/config/app.config";

export async function GET(request: Request) {
  const auth = await requireAdminSession("audit.view");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "csv";
  const data = await getAuditDirectoryData({
    preset: (searchParams.get("preset") as AuditDatePreset) ?? "last_7_days",
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    category: (searchParams.get("category") as AuditCategory | "all") ?? "all",
    search: searchParams.get("search") ?? undefined,
  });
  const timestamp = new Date().toISOString().slice(0, 10);
  const venueName = getAppConfig().envDisplayName;

  if (format === "pdf") {
    return new NextResponse(buildAuditPdfHtml(data, venueName), {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="audit-${timestamp}.html"`,
      },
    });
  }

  if (format === "xlsx") {
    return new NextResponse(buildAuditExcelCsv(data), {
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": `attachment; filename="audit-${timestamp}.csv"`,
      },
    });
  }

  return new NextResponse(buildAuditCsv(data), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="audit-${timestamp}.csv"`,
    },
  });
}
