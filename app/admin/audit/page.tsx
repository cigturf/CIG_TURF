import { AdminAuditLiveView } from "@/features/admin/audit/components/admin-audit-live-view";
import { getAuditDirectoryData } from "@/features/audit/services/audit.service";
import { getAdminContext } from "@/features/admin/services/admin-context.service";
import { hasAdminPermission } from "@/features/admin/config/admin-permissions";
import { getSession } from "@/server/auth/session";
import { redirect } from "next/navigation";

export const metadata = { title: "Audit Log" };

export default async function AdminAuditPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login?returnTo=/admin/audit");

  const admin = await getAdminContext(session.user.id);
  if (!admin || !hasAdminPermission(admin.role, "audit.view")) {
    redirect("/admin");
  }

  const initialData = await getAuditDirectoryData();
  return <AdminAuditLiveView initialData={initialData} />;
}
