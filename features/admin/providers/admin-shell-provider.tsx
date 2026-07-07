"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import type {
  AdminBusinessBranding,
  AdminContext,
} from "@/features/admin/types/admin.types";

type AdminShellContextValue = {
  admin: AdminContext;
  branding: AdminBusinessBranding;
};

const AdminShellContext = createContext<AdminShellContextValue | null>(null);

type AdminShellProviderProps = {
  admin: AdminContext;
  branding: AdminBusinessBranding;
  children: ReactNode;
};

export function AdminShellProvider({ admin, branding, children }: AdminShellProviderProps) {
  const value = useMemo(() => ({ admin, branding }), [admin, branding]);
  return <AdminShellContext.Provider value={value}>{children}</AdminShellContext.Provider>;
}

export function useAdminShell() {
  const context = useContext(AdminShellContext);
  if (!context) {
    throw new Error("useAdminShell must be used within AdminShellProvider");
  }
  return context;
}
