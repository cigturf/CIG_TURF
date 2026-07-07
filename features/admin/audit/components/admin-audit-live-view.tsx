"use client";

import { AdminAuditView } from "@/features/admin/audit/components/admin-audit-view";
import type { AuditDirectoryData } from "@/features/audit/types/audit.types";
import { AuditRealtimeProvider } from "@/features/realtime/providers/audit-realtime-provider";
import { useAuditRealtime } from "@/features/realtime/providers/audit-realtime-provider";
import { RealtimeStatusIndicator } from "@/features/realtime/components/realtime-status-indicator";
import { Text } from "@/components/design-system";

type AdminAuditLiveViewProps = {
  initialData: AuditDirectoryData;
};

function AuditLiveContent() {
  const { data, isRefreshing, refresh } = useAuditRealtime();

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
      <AdminAuditView
        data={data}
        isRefreshing={isRefreshing}
        onQueryChange={async (input) => {
          await refresh(input);
        }}
      />
    </div>
  );
}

export function AdminAuditLiveView({ initialData }: AdminAuditLiveViewProps) {
  return (
    <AuditRealtimeProvider initialData={initialData}>
      <AuditLiveContent />
    </AuditRealtimeProvider>
  );
}
