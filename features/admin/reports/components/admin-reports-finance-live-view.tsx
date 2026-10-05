"use client";

import { AdminReportsFinanceView } from "@/features/admin/reports/components/admin-reports-finance-view";
import type { ReportsAnalyticsData } from "@/features/admin/reports/types/reports.types";
import type { FinanceDashboardData } from "@/features/admin/finance/types/finance.types";
import { ReportsRealtimeProvider } from "@/features/realtime/providers/reports-realtime-provider";
import { useReportsRealtime } from "@/features/realtime/providers/reports-realtime-provider";
import { FinanceRealtimeProvider } from "@/features/realtime/providers/finance-realtime-provider";
import { useFinanceRealtime } from "@/features/realtime/providers/finance-realtime-provider";
import { RealtimeStatusIndicator } from "@/features/realtime/components/realtime-status-indicator";
import { Text } from "@/components/design-system";

type AdminReportsFinanceLiveViewProps = {
  initialReportsData: ReportsAnalyticsData;
  initialFinanceData: FinanceDashboardData;
};

function ReportsFinanceLiveContent() {
  const reports = useReportsRealtime();
  const finance = useFinanceRealtime();
  const isRefreshing = reports.isRefreshing || finance.isRefreshing;

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
      <AdminReportsFinanceView
        reportsData={reports.data}
        financeData={finance.data}
        isRefreshing={isRefreshing}
        onRangeChange={async (input) => {
          // Keep both datasets on the exact same date range at all times.
          await Promise.all([reports.refresh(input), finance.refresh(input)]);
        }}
        onRefresh={async () => {
          await Promise.all([reports.refresh(), finance.refresh()]);
        }}
      />
    </div>
  );
}

export function AdminReportsFinanceLiveView({
  initialReportsData,
  initialFinanceData,
}: AdminReportsFinanceLiveViewProps) {
  return (
    <ReportsRealtimeProvider initialData={initialReportsData}>
      <FinanceRealtimeProvider initialData={initialFinanceData}>
        <ReportsFinanceLiveContent />
      </FinanceRealtimeProvider>
    </ReportsRealtimeProvider>
  );
}
