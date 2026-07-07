"use client";

import { AdminReportsView } from "@/features/admin/reports/components/admin-reports-view";
import type { ReportsAnalyticsData } from "@/features/admin/reports/types/reports.types";
import { ReportsRealtimeProvider } from "@/features/realtime/providers/reports-realtime-provider";
import { useReportsRealtime } from "@/features/realtime/providers/reports-realtime-provider";
import { RealtimeStatusIndicator } from "@/features/realtime/components/realtime-status-indicator";
import { Text } from "@/components/design-system";

type AdminReportsLiveViewProps = {
  initialData: ReportsAnalyticsData;
};

function ReportsLiveContent() {
  const { data, isRefreshing, refresh } = useReportsRealtime();

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
      <AdminReportsView
        data={data}
        isRefreshing={isRefreshing}
        onRangeChange={async (input) => {
          await refresh(input);
        }}
      />
    </div>
  );
}

export function AdminReportsLiveView({ initialData }: AdminReportsLiveViewProps) {
  return (
    <ReportsRealtimeProvider initialData={initialData}>
      <ReportsLiveContent />
    </ReportsRealtimeProvider>
  );
}
