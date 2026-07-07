"use client";

import { AdminFinanceView } from "@/features/admin/finance/components/admin-finance-view";
import type { FinanceDashboardData } from "@/features/admin/finance/types/finance.types";
import { FinanceRealtimeProvider } from "@/features/realtime/providers/finance-realtime-provider";
import { useFinanceRealtime } from "@/features/realtime/providers/finance-realtime-provider";
import { RealtimeStatusIndicator } from "@/features/realtime/components/realtime-status-indicator";
import { Text } from "@/components/design-system";

type AdminFinanceLiveViewProps = {
  initialData: FinanceDashboardData;
};

function FinanceLiveContent() {
  const { data, isRefreshing, refresh } = useFinanceRealtime();

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
      <AdminFinanceView
        data={data}
        isRefreshing={isRefreshing}
        onRangeChange={async (input) => {
          await refresh(input);
        }}
        onRefresh={async () => {
          await refresh();
        }}
      />
    </div>
  );
}

export function AdminFinanceLiveView({ initialData }: AdminFinanceLiveViewProps) {
  return (
    <FinanceRealtimeProvider initialData={initialData}>
      <FinanceLiveContent />
    </FinanceRealtimeProvider>
  );
}
