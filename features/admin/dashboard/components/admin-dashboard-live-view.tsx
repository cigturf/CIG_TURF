"use client";

import { AdminDashboardView } from "@/features/admin/dashboard/components/admin-dashboard-view";
import type { AdminDashboardData } from "@/features/admin/dashboard/types/dashboard.types";
import { DashboardRealtimeProvider } from "@/features/realtime/providers/dashboard-realtime-provider";
import { useRealtimeDashboard } from "@/features/realtime/hooks/use-realtime-dashboard";
import { RealtimeStatusIndicator } from "@/features/realtime/components/realtime-status-indicator";
import { Text } from "@/components/design-system";

type AdminDashboardLiveViewProps = {
  initialData: AdminDashboardData;
};

function DashboardLiveContent() {
  const { data, isRefreshing } = useRealtimeDashboard();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end gap-2">
        {isRefreshing ? (
          <Text size="sm" className="text-muted-foreground">
            Updating…
          </Text>
        ) : null}
        <RealtimeStatusIndicator />
      </div>
      <AdminDashboardView data={data} />
    </div>
  );
}

export function AdminDashboardLiveView({ initialData }: AdminDashboardLiveViewProps) {
  return (
    <DashboardRealtimeProvider initialData={initialData}>
      <DashboardLiveContent />
    </DashboardRealtimeProvider>
  );
}
