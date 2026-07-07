"use client";

import { useState } from "react";

import { AdminSidebar } from "@/features/admin/components/layout/admin-sidebar";
import { AdminTopbar } from "@/features/admin/components/layout/admin-topbar";
import { DrawerPanel, DrawerRoot } from "@/components/design-system";

type AdminShellProps = {
  children: React.ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="surface-admin flex min-h-screen">
      <div className="hidden md:flex">
        <AdminSidebar />
      </div>

      <DrawerRoot open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <DrawerPanel title="Admin Navigation" className="p-0">
          <AdminSidebar onNavigate={() => setMobileNavOpen(false)} className="w-full border-0" />
        </DrawerPanel>
      </DrawerRoot>

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
