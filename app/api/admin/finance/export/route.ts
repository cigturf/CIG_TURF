import { NextResponse } from "next/server";

import {
  buildFinanceCsv,
  buildFinanceExcelCsv,
  buildFinancePdfHtml,
} from "@/features/admin/finance/services/finance-export.service";
import { getFinanceDashboardData } from "@/features/admin/finance/services/finance.service";
import { parseReportQuery } from "@/features/admin/reports/lib/report-date-range";
import { requireAdminSession } from "@/lib/api/require-admin";
import { getAppConfig } from "@/config/app.config";

export async function GET(request: Request) {
  const auth = await requireAdminSession("finance.view");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "csv";
  const range = parseReportQuery(searchParams);
  const closingDate = searchParams.get("closingDate") ?? undefined;
  const data = await getFinanceDashboardData(
    range.preset,
    range.from,
    range.to,
    closingDate,
  );
  const timestamp = new Date().toISOString().slice(0, 10);
  const venueName = getAppConfig().envDisplayName;

  if (format === "pdf") {
    const html = buildFinancePdfHtml(data, venueName);
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="finance-${timestamp}.html"`,
      },
    });
  }

  if (format === "xlsx") {
    return new NextResponse(buildFinanceExcelCsv(data), {
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": `attachment; filename="finance-${timestamp}.csv"`,
      },
    });
  }

  return new NextResponse(buildFinanceCsv(data), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="finance-${timestamp}.csv"`,
    },
  });
}
