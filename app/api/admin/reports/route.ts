import { NextResponse } from "next/server";

import { parseReportQuery } from "@/features/admin/reports/lib/report-date-range";
import { getReportsAnalyticsData } from "@/features/admin/reports/services/reports-analytics.service";
import { requireAdminSession } from "@/lib/api/require-admin";

export async function GET(request: Request) {
  const auth = await requireAdminSession("reports.view");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const range = parseReportQuery(searchParams);
  const data = await getReportsAnalyticsData(range.preset, range.from, range.to);
  return NextResponse.json(data);
}
