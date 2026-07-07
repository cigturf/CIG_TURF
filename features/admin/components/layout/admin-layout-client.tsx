"use client";

import type { ReactNode } from "react";

import type { AdminContext, AdminBusinessBranding } from "@/features/admin/types/admin.types";
import { AdminShell } from "@/features/admin/components/layout/admin-shell";
import { AdminShellProvider } from "@/features/admin/providers/admin-shell-provider";
import { AdminRealtimeProviders } from "@/features/realtime/providers/realtime-providers";
import { RealtimeSearchProvider } from "@/features/realtime/search/realtime-search-provider";

type AdminLayoutClientProps = {
  children: ReactNode;
  admin: AdminContext;
  branding: AdminBusinessBranding;
};

export function AdminLayoutClient({ children, admin, branding }: AdminLayoutClientProps) {
  return (
    <AdminRealtimeProviders>
      <RealtimeSearchProvider>
        <AdminShellProvider admin={admin} branding={branding}>
          <AdminShell>{children}</AdminShell>
        </AdminShellProvider>
      </RealtimeSearchProvider>
    </AdminRealtimeProviders>
  );
}
