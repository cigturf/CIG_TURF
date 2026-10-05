import { NextResponse } from "next/server";

import {
  buildFinanceCsv,
  buildFinancePdfHtml,
} from "@/features/admin/finance/services/finance-export.service";
import { getFinanceDashboardData } from "@/features/admin/finance/services/finance.service";
import { parseReportQuery } from "@/features/admin/reports/lib/report-date-range";
import { getReportsAnalyticsData } from "@/features/admin/reports/services/reports-analytics.service";
import { buildReportsFinanceWorkbook } from "@/features/admin/reports/services/reports-finance-excel.service";
import { requireAdminSession } from "@/lib/api/require-admin";
import { getAppConfig } from "@/config/app.config";

export async function GET(request: Request) {
  const auth = await requireAdminSession("reports.view");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "xlsx";
  const range = parseReportQuery(searchParams);
  const closingDate = searchParams.get("closingDate") ?? undefined;
  const venueName = getAppConfig().envDisplayName;

  const [reportsData, financeData] = await Promise.all([
    getReportsAnalyticsData(range.preset, range.from, range.to),
    getFinanceDashboardData(range.preset, range.from, range.to, closingDate),
  ]);

  const timestamp = new Date().toISOString().slice(0, 10);

  if (format === "pdf") {
    const html = buildFinancePdfHtml(financeData, venueName);
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="reports-finances-${timestamp}.html"`,
      },
    });
  }

  if (format === "csv") {
    return new NextResponse(buildFinanceCsv(financeData), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="reports-finances-${timestamp}.csv"`,
      },
    });
  }

  const buffer = await buildReportsFinanceWorkbook(reportsData, financeData, venueName);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="reports-finances-${timestamp}.xlsx"`,
    },
  });
}
