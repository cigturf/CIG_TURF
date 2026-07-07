import { NextResponse } from "next/server";

import { parseReportQuery } from "@/features/admin/reports/lib/report-date-range";
import { getReportsAnalyticsData } from "@/features/admin/reports/services/reports-analytics.service";
import {
  buildReportsCsv,
  buildReportsExcelCsv,
  buildReportsPdfHtml,
  resolveExportFilename,
  type ReportExportKind,
} from "@/features/admin/reports/services/reports-export.service";
import { requireAdminSession } from "@/lib/api/require-admin";
import { getAppConfig } from "@/config/app.config";

export async function GET(request: Request) {
  const auth = await requireAdminSession("reports.view");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "csv";
  const kind = (searchParams.get("kind") as ReportExportKind) ?? "custom";
  const range = parseReportQuery(searchParams);
  const data = await getReportsAnalyticsData(range.preset, range.from, range.to);
  const venueName = getAppConfig().envDisplayName;

  if (format === "pdf") {
    const html = buildReportsPdfHtml(data, venueName);
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="${resolveExportFilename(kind, data.range.label, "html")}"`,
      },
    });
  }

  if (format === "xlsx") {
    return new NextResponse(buildReportsExcelCsv(data), {
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": `attachment; filename="${resolveExportFilename(kind, data.range.label, "csv")}"`,
      },
    });
  }

  return new NextResponse(buildReportsCsv(data), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${resolveExportFilename(kind, data.range.label, "csv")}"`,
    },
  });
}
