"use client";

import type { ReactNode } from "react";

import type { AdminDashboardData } from "@/features/admin/dashboard/types/dashboard.types";
import { SystemAuditEventRecorder } from "@/features/audit/components/system-audit-event-recorder";
import { RealtimeEventBridge } from "@/features/events/bridge/realtime-event-bridge";
import { BookingRealtimeProvider } from "@/features/realtime/providers/booking-realtime-provider";
import { BusinessSettingsRealtimeProvider } from "@/features/realtime/providers/business-settings-realtime-provider";
import { DashboardRealtimeProvider } from "@/features/realtime/providers/dashboard-realtime-provider";
import { MediaRealtimeProvider } from "@/features/realtime/providers/media-realtime-provider";
import { NotificationRealtimeProvider } from "@/features/realtime/providers/notification-realtime-provider";
import { RealtimeProvider } from "@/features/realtime/providers/realtime-provider";
import { SlotRealtimeProvider } from "@/features/realtime/providers/slot-realtime-provider";

export function PublicRealtimeProviders({ children }: { children: ReactNode }) {
  return (
    <RealtimeProvider scope="public">
      <RealtimeEventBridge>
        <SystemAuditEventRecorder />
        <SlotRealtimeProvider>
          <MediaRealtimeProvider>
            <BusinessSettingsRealtimeProvider>{children}</BusinessSettingsRealtimeProvider>
          </MediaRealtimeProvider>
        </SlotRealtimeProvider>
      </RealtimeEventBridge>
    </RealtimeProvider>
  );
}

export function AdminRealtimeProviders({
  children,
  dashboardInitialData,
}: {
  children: ReactNode;
  dashboardInitialData?: AdminDashboardData;
}) {
  return (
    <RealtimeProvider scope="admin">
      <RealtimeEventBridge>
        <SystemAuditEventRecorder />
        <SlotRealtimeProvider>
          <BookingRealtimeProvider>
            <NotificationRealtimeProvider>
              <MediaRealtimeProvider>
                <BusinessSettingsRealtimeProvider>
                  {dashboardInitialData ? (
                    <DashboardRealtimeProvider initialData={dashboardInitialData}>
                      {children}
                    </DashboardRealtimeProvider>
                  ) : (
                    children
                  )}
                </BusinessSettingsRealtimeProvider>
              </MediaRealtimeProvider>
            </NotificationRealtimeProvider>
          </BookingRealtimeProvider>
        </SlotRealtimeProvider>
      </RealtimeEventBridge>
    </RealtimeProvider>
  );
}
