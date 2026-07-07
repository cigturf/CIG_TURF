"use client";

import type { AuditLogRecord } from "@/features/audit/types/audit.types";
import { DrawerPanel, DrawerRoot, Separator, Text } from "@/components/design-system";

type AuditLogDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: AuditLogRecord | null;
};

export function AuditLogDrawer({ open, onOpenChange, log }: AuditLogDrawerProps) {
  return (
    <DrawerRoot open={open} onOpenChange={onOpenChange}>
      <DrawerPanel
        title={log?.action ?? "Audit entry"}
        description={log ? new Date(log.createdAt).toLocaleString("en-IN") : undefined}
        className="max-w-md lg:max-w-lg"
      >
        {!log ? (
          <Text className="text-muted-foreground">Select an audit entry to view details.</Text>
        ) : (
          <div className="space-y-5">
            <div>
              <Text className="text-muted-foreground mb-1 text-xs uppercase tracking-wide">Description</Text>
              <p className="text-sm">{log.description}</p>
            </div>

            <Separator />

            <div className="grid gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Module</span>
                <span>{log.module}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Category</span>
                <span className="capitalize">{log.category.replace(/_/g, " ")}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Performed by</span>
                <span>{log.performedBy ?? "System"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Entity</span>
                <span className="text-right break-all">{log.entityId ?? "—"}</span>
              </div>
              {log.bookingId ? (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Related booking</span>
                  <span className="text-right break-all">{log.bookingId}</span>
                </div>
              ) : null}
              {log.customerName ? (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Customer</span>
                  <span>{log.customerName}</span>
                </div>
              ) : null}
            </div>

            {(log.oldValue || log.newValue) && (
              <>
                <Separator />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Text className="text-muted-foreground mb-1 text-xs uppercase">Old value</Text>
                    <p className="rounded-lg border px-3 py-2 text-sm">{log.oldValue ?? "—"}</p>
                  </div>
                  <div>
                    <Text className="text-muted-foreground mb-1 text-xs uppercase">New value</Text>
                    <p className="rounded-lg border px-3 py-2 text-sm">{log.newValue ?? "—"}</p>
                  </div>
                </div>
              </>
            )}

            {log.metadata ? (
              <>
                <Separator />
                <div>
                  <Text className="text-muted-foreground mb-2 text-xs uppercase">Metadata</Text>
                  <pre className="bg-muted/40 overflow-x-auto rounded-lg p-3 text-xs">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </div>
              </>
            ) : null}
          </div>
        )}
      </DrawerPanel>
    </DrawerRoot>
  );
}
