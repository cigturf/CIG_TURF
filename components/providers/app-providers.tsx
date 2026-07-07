"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { ConfigProvider } from "@/components/providers/config-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeAccentProvider } from "@/components/providers/theme-accent-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { SiteNavbar, SiteNavbarSpacer } from "@/components/layout";
import { SiteAnnouncementBar } from "@/components/common/site-announcement-bar";
import type { BusinessSettingsPublic } from "@/features/business-settings/types";
import { EventBusProvider } from "@/features/events/providers/event-bus-provider";
import { PublicRealtimeProviders } from "@/features/realtime/providers/realtime-providers";

type AppProvidersProps = {
  children: ReactNode;
  initialBusinessSettings?: BusinessSettingsPublic | null;
};

function PublicRealtimeShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return <PublicRealtimeProviders>{children}</PublicRealtimeProviders>;
}

export function AppProviders({ children, initialBusinessSettings }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <EventBusProvider>
          <PublicRealtimeShell>
            <ConfigProvider initialBusinessSettings={initialBusinessSettings}>
              <ThemeAccentProvider />
              <SiteAnnouncementBar />
              <SiteNavbar />
              <SiteNavbarSpacer />
              {children}
              <ToastProvider />
            </ConfigProvider>
          </PublicRealtimeShell>
        </EventBusProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
