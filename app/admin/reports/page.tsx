import { AdminReportsFinanceLiveView } from "@/features/admin/reports/components/admin-reports-finance-live-view";
import { getReportsAnalyticsData } from "@/features/admin/reports/services/reports-analytics.service";
import { getFinanceDashboardData } from "@/features/admin/finance/services/finance.service";

export const metadata = { title: "Reports & Finances" };

export default async function AdminReportsPage() {
  const [reportsData, financeData] = await Promise.all([
    getReportsAnalyticsData("last_7_days"),
    getFinanceDashboardData("last_7_days"),
  ]);
  return (
    <AdminReportsFinanceLiveView
      initialReportsData={reportsData}
      initialFinanceData={financeData}
    />
  );
}
