"use client";

import { AdminCustomersView } from "@/features/admin/customers/components/admin-customers-view";
import type { CustomerDirectoryData } from "@/features/admin/customers/types/customer.types";
import { CustomersRealtimeProvider } from "@/features/realtime/providers/customers-realtime-provider";
import { useCustomersRealtime } from "@/features/realtime/providers/customers-realtime-provider";
import { RealtimeStatusIndicator } from "@/features/realtime/components/realtime-status-indicator";
import { Text } from "@/components/design-system";

type AdminCustomersLiveViewProps = {
  initialData: CustomerDirectoryData;
};

function CustomersLiveContent() {
  const { data, isRefreshing, refresh } = useCustomersRealtime();

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
      <AdminCustomersView
        data={data}
        isRefreshing={isRefreshing}
        onQueryChange={async (input) => {
          await refresh(input);
        }}
        onRefresh={async () => {
          await refresh();
        }}
      />
    </div>
  );
}

export function AdminCustomersLiveView({ initialData }: AdminCustomersLiveViewProps) {
  return (
    <CustomersRealtimeProvider initialData={initialData}>
      <CustomersLiveContent />
    </CustomersRealtimeProvider>
  );
}
