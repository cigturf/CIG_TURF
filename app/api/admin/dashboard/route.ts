import { NextResponse } from "next/server";

import { getAdminDashboardData } from "@/features/admin/dashboard/services/admin-dashboard.service";
import { requireAdminSession } from "@/lib/api/require-admin";

export async function GET() {
  const auth = await requireAdminSession("dashboard.view");
  if ("error" in auth) return auth.error;

  const data = await getAdminDashboardData();
  return NextResponse.json(data);
}
