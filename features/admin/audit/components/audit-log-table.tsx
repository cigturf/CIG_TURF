"use client";

import type { AuditLogRecord } from "@/features/audit/types/audit.types";
import { Badge, TableShell, Text } from "@/components/design-system";
import { cn } from "@/lib/utils";

type AuditLogTableProps = {
  logs: AuditLogRecord[];
  onSelect: (log: AuditLogRecord) => void;
};

function categoryVariant(category: AuditLogRecord["category"]) {
  switch (category) {
    case "bookings":
      return "default" as const;
    case "payments":
      return "success" as const;
    case "authentication":
      return "warning" as const;
    default:
      return "secondary" as const;
  }
}

export function AuditLogTable({ logs, onSelect }: AuditLogTableProps) {
  if (logs.length === 0) {
    return <Text className="text-muted-foreground">No audit entries for this period.</Text>;
  }

  return (
    <>
      <div className="hidden lg:block">
        <TableShell>
          <table className="w-full min-w-[960px] text-sm">
            <thead className="bg-muted/40 text-muted-foreground text-left text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Performed By</th>
                <th className="px-4 py-3 font-medium">Module</th>
                <th className="px-4 py-3 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-border/60 hover:bg-muted/30 cursor-pointer border-t transition-colors"
                  onClick={() => onSelect(log)}
                >
                  <td className="text-muted-foreground px-4 py-3 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 font-medium">{log.action}</td>
                  <td className="px-4 py-3">
                    <Badge variant={categoryVariant(log.category)}>{log.category.replace(/_/g, " ")}</Badge>
                  </td>
                  <td className="px-4 py-3">{log.performedBy ?? "System"}</td>
                  <td className="px-4 py-3">{log.module}</td>
                  <td className="text-muted-foreground px-4 py-3">{log.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      </div>

      <div className="space-y-3 lg:hidden">
        {logs.map((log) => (
          <button
            key={log.id}
            type="button"
            className="border-border/70 bg-card relative w-full rounded-[var(--radius-lg)] border p-4 text-left pl-6"
            onClick={() => onSelect(log)}
          >
            <span
              className={cn(
                "bg-primary absolute top-4 bottom-4 left-0 w-1 rounded-full",
                log.category === "authentication" && "bg-warning",
                log.category === "payments" && "bg-success",
              )}
            />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{log.action}</p>
                <p className="text-muted-foreground mt-1 text-sm">{log.description}</p>
              </div>
              <Badge variant={categoryVariant(log.category)} className="shrink-0">
                {log.category.replace(/_/g, " ")}
              </Badge>
            </div>
            <div className="text-muted-foreground mt-3 flex flex-wrap gap-2 text-xs">
              <span>{new Date(log.createdAt).toLocaleString("en-IN")}</span>
              <span>·</span>
              <span>{log.performedBy ?? "System"}</span>
              <span>·</span>
              <span>{log.module}</span>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
