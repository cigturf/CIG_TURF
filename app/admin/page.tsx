import { AdminDashboardLiveView } from "@/features/admin/dashboard/components/admin-dashboard-live-view";
import { getAdminDashboardData } from "@/features/admin/dashboard/services/admin-dashboard.service";

export const metadata = {
  title: "Dashboard",
};

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();

  return <AdminDashboardLiveView initialData={data} />;
}
