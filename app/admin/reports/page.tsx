import { AdminReportsLiveView } from "@/features/admin/reports/components/admin-reports-live-view";
import { getReportsAnalyticsData } from "@/features/admin/reports/services/reports-analytics.service";

export const metadata = { title: "Reports" };

export default async function AdminReportsPage() {
  const initialData = await getReportsAnalyticsData("last_7_days");
  return <AdminReportsLiveView initialData={initialData} />;
}
