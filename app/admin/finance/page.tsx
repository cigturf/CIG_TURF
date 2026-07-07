import { AdminFinanceLiveView } from "@/features/admin/finance/components/admin-finance-live-view";
import { getFinanceDashboardData } from "@/features/admin/finance/services/finance.service";

export const metadata = { title: "Finance" };

export default async function AdminFinancePage() {
  const initialData = await getFinanceDashboardData("last_7_days");
  return <AdminFinanceLiveView initialData={initialData} />;
}
