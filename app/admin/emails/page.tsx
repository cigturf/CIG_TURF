import { AdminEmailsLiveView } from "@/features/admin/emails/components/admin-emails-live-view";
import { listEmailLogs } from "@/features/communication/services/email-log.repository";
import { isEmailDevMode } from "@/features/communication/providers/resolve-email-provider";
import { getAdminContext } from "@/features/admin/services/admin-context.service";
import { hasAdminPermission } from "@/features/admin/config/admin-permissions";
import { getSession } from "@/server/auth/session";
import { redirect } from "next/navigation";

export const metadata = { title: "Communication Center" };

export default async function AdminEmailsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login?returnTo=/admin/emails");

  const admin = await getAdminContext(session.user.id);
  if (!admin || !hasAdminPermission(admin.role, "emails.view")) {
    redirect("/admin");
  }

  const logs = await listEmailLogs({ limit: 100 });

  return (
    <AdminEmailsLiveView
      initialData={{
        logs,
        devMode: isEmailDevMode(),
      }}
    />
  );
}
