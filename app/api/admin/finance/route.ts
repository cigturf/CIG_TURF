import { NextResponse } from "next/server";

import { getFinanceDashboardData } from "@/features/admin/finance/services/finance.service";
import { parseReportQuery } from "@/features/admin/reports/lib/report-date-range";
import { requireAdminSession } from "@/lib/api/require-admin";

export async function GET(request: Request) {
  const auth = await requireAdminSession("finance.view");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const range = parseReportQuery(searchParams);
  const closingDate = searchParams.get("closingDate") ?? undefined;
  const data = await getFinanceDashboardData(
    range.preset,
    range.from,
    range.to,
    closingDate,
  );
  return NextResponse.json(data);
}
