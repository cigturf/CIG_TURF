import { AdminCustomersLiveView } from "@/features/admin/customers/components/admin-customers-live-view";
import { getCustomerDirectoryData } from "@/features/admin/customers/services/customer.service";

export const metadata = { title: "Customers" };

export default async function AdminCustomersPage() {
  const initialData = await getCustomerDirectoryData();
  return <AdminCustomersLiveView initialData={initialData} />;
}
