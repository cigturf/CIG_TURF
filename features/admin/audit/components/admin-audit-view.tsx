"use client";

import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { AuditLogDrawer } from "@/features/admin/audit/components/audit-log-drawer";
import { AuditLogTable } from "@/features/admin/audit/components/audit-log-table";
import type {
  AuditCategory,
  AuditDatePreset,
  AuditDirectoryData,
  AuditLogRecord,
} from "@/features/audit/types/audit.types";
import { ReportsDateFilter } from "@/features/admin/reports/components/reports-date-filter";
import { Button, Heading, Input, Text } from "@/components/design-system";
import { cn } from "@/lib/utils";

const CATEGORY_FILTERS: { id: AuditCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "bookings", label: "Bookings" },
  { id: "payments", label: "Payments" },
  { id: "pricing", label: "Pricing" },
  { id: "slots", label: "Slots" },
  { id: "media", label: "Media" },
  { id: "business_settings", label: "Business Settings" },
  { id: "promotions", label: "Promotions" },
  { id: "authentication", label: "Authentication" },
];

type AdminAuditViewProps = {
  data: AuditDirectoryData;
  onQueryChange: (input: {
    preset?: AuditDatePreset;
    from?: string;
    to?: string;
    category?: AuditCategory | "all";
    search?: string;
  }) => Promise<void>;
  isRefreshing?: boolean;
};

function buildExportUrl(data: AuditDirectoryData, format: "csv" | "xlsx" | "pdf", category: string, search: string) {
  const params = new URLSearchParams({
    preset: data.range.preset,
    format,
    category,
  });
  if (data.range.preset === "custom") {
    params.set("from", data.range.from);
    params.set("to", data.range.to);
  }
  if (search) params.set("search", search);
  return `/api/admin/audit/export?${params.toString()}`;
}

export function AdminAuditView({ data, onQueryChange, isRefreshing }: AdminAuditViewProps) {
  const [preset, setPreset] = useState<AuditDatePreset>(data.range.preset as AuditDatePreset);
  const [customFrom, setCustomFrom] = useState(data.range.from);
  const [customTo, setCustomTo] = useState(data.range.to);
  const [category, setCategory] = useState<AuditCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isFirstQuery = useRef(true);

  useEffect(() => {
    setPreset(data.range.preset as AuditDatePreset);
    setCustomFrom(data.range.from);
    setCustomTo(data.range.to);
  }, [data.range.from, data.range.preset, data.range.to, data.generatedAt]);

  const applyQuery = useCallback(
    async (
      nextPreset = preset,
      from = customFrom,
      to = customTo,
      nextCategory = category,
      nextSearch = search,
    ) => {
      await onQueryChange({
        preset: nextPreset,
        from: nextPreset === "custom" ? from : undefined,
        to: nextPreset === "custom" ? to : undefined,
        category: nextCategory,
        search: nextSearch || undefined,
      });
    },
    [category, customFrom, customTo, onQueryChange, preset, search],
  );

  useEffect(() => {
    if (isFirstQuery.current) {
      isFirstQuery.current = false;
      return;
    }
    const timeout = window.setTimeout(() => {
      void applyQuery();
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [search, category, applyQuery]);

  const exportActions = (
    <div className="flex flex-wrap gap-2">
      <Button asChild size="sm" variant="outline">
        <a href={buildExportUrl(data, "csv", category, search)}>
          <Download className="mr-2 size-4" />
          CSV
        </a>
      </Button>
      <Button asChild size="sm" variant="outline">
        <a href={buildExportUrl(data, "xlsx", category, search)}>
          <FileSpreadsheet className="mr-2 size-4" />
          Excel
        </a>
      </Button>
      <Button asChild size="sm" variant="outline">
        <a href={buildExportUrl(data, "pdf", category, search)} target="_blank" rel="noreferrer">
          <FileText className="mr-2 size-4" />
          PDF
        </a>
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Heading level="h3" className="mb-1">
            System Audit Log
          </Heading>
          <Text className="text-muted-foreground">
            {data.total} entries · {data.range.label}
            {isRefreshing ? " · Updating…" : ""}
          </Text>
          <Text className="text-muted-foreground mt-1 text-xs">
            Retention: last {data.retentionDays} days only · Auto cleanup:{" "}
            {data.autoCleanupEnabled ? "enabled" : "disabled"}
          </Text>
        </div>
        {exportActions}
      </div>

      <ReportsDateFilter
        preset={preset}
        customFrom={customFrom}
        customTo={customTo}
        onPresetChange={(next) => {
          setPreset(next);
          void applyQuery(next);
        }}
        onCustomFromChange={(value) => {
          setCustomFrom(value);
          if (preset === "custom") void applyQuery("custom", value, customTo);
        }}
        onCustomToChange={(value) => {
          setCustomTo(value);
          if (preset === "custom") void applyQuery("custom", customFrom, value);
        }}
      />

      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search booking ID, customer, action, or module"
        className="max-w-xl"
      />

      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
        {CATEGORY_FILTERS.map((item) => (
          <Button
            key={item.id}
            type="button"
            size="sm"
            variant={category === item.id ? "default" : "outline"}
            className={cn("shrink-0")}
            onClick={() => setCategory(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <AuditLogTable
        logs={data.logs}
        onSelect={(log) => {
          setSelectedLog(log);
          setDrawerOpen(true);
        }}
      />

      <AuditLogDrawer open={drawerOpen} onOpenChange={setDrawerOpen} log={selectedLog} />
    </div>
  );
}
