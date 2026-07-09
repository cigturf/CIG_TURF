import { redirect } from "next/navigation";

import { AdminLayoutClient } from "@/features/admin/components/layout/admin-layout-client";
import {
  getAdminBusinessBranding,
  getAdminContext,
} from "@/features/admin/services/admin-context.service";
import { AUTH_ROUTES } from "@/features/auth/types";
import { getSession } from "@/server/auth/session";

export const metadata = {
  title: "Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  if (!session?.user) {
    redirect(`${AUTH_ROUTES.login}?returnTo=${encodeURIComponent("/admin")}`);
  }

  const admin = await getAdminContext(session.user.id);

  if (!admin) {
    redirect("/");
  }

  const branding = await getAdminBusinessBranding();

  return (
    <AdminLayoutClient admin={admin} branding={branding}>
      {children}
    </AdminLayoutClient>
  );
}
