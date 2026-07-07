"use client";

import { useState } from "react";
import { RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";

import type { EmailDirectoryData } from "@/features/admin/emails/types/admin-emails.types";
import type { EmailLogRecord } from "@/features/communication/types/email.types";
import { PREVIEW_TEMPLATE_IDS } from "@/features/communication/types/email.types";
import { Badge, Button, Heading, Input, Text } from "@/components/design-system";
import {
  TableCell,
  TableHeader,
  TableRow,
  TableShell,
} from "@/components/design-system/dashboard";
import { cn } from "@/lib/utils";

type EmailLogTableProps = {
  logs: EmailLogRecord[];
  canManage: boolean;
  onResend: (id: string) => Promise<void>;
};

function statusVariant(status: EmailLogRecord["status"]) {
  if (status === "sent") return "success" as const;
  if (status === "failed") return "destructive" as const;
  return "secondary" as const;
}

function formatTemplateLabel(template: string) {
  return template.replaceAll("_", " ");
}

export function EmailLogTable({ logs, canManage, onResend }: EmailLogTableProps) {
  const [resendingId, setResendingId] = useState<string | null>(null);

  const handleResend = async (id: string) => {
    setResendingId(id);
    try {
      await onResend(id);
      toast.success("Email queued for resend");
    } catch {
      toast.error("Failed to resend email");
    } finally {
      setResendingId(null);
    }
  };

  return (
    <TableShell className="min-w-[56rem]">
      <TableHeader className="grid-cols-[minmax(10rem,1.4fr)_minmax(8rem,1fr)_minmax(6rem,0.7fr)_minmax(8rem,0.9fr)_minmax(4rem,0.5fr)_minmax(8rem,0.9fr)_4rem]">
        <TableCell header>Recipient</TableCell>
        <TableCell header>Template</TableCell>
        <TableCell header>Status</TableCell>
        <TableCell header>Sent</TableCell>
        <TableCell header>Retries</TableCell>
        <TableCell header>Error</TableCell>
        <TableCell header>&nbsp;</TableCell>
      </TableHeader>

      {logs.length === 0 ? (
        <div className="border-border/60 text-muted-foreground border-t px-4 py-10 text-center text-sm">
          No email activity yet.
        </div>
      ) : (
        logs.map((log) => (
          <TableRow
            key={log.id}
            className="grid-cols-[minmax(10rem,1.4fr)_minmax(8rem,1fr)_minmax(6rem,0.7fr)_minmax(8rem,0.9fr)_minmax(4rem,0.5fr)_minmax(8rem,0.9fr)_4rem]"
          >
            <TableCell truncate>
              <span className="truncate" title={log.recipient}>
                {log.recipient}
              </span>
            </TableCell>
            <TableCell truncate>
              <span className="truncate" title={log.template}>
                {formatTemplateLabel(log.template)}
              </span>
            </TableCell>
            <TableCell>
              <Badge variant={statusVariant(log.status)}>{log.status}</Badge>
            </TableCell>
            <TableCell>
              {log.sentAt ? new Date(log.sentAt).toLocaleString("en-IN") : "—"}
            </TableCell>
            <TableCell>{log.retries}</TableCell>
            <TableCell truncate>
              <span className="truncate" title={log.errorMessage ?? undefined}>
                {log.errorMessage ?? "—"}
              </span>
            </TableCell>
            <TableCell>
              {canManage ? (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Resend email"
                  disabled={resendingId === log.id}
                  onClick={() => void handleResend(log.id)}
                >
                  <Send className="size-4" />
                </Button>
              ) : null}
            </TableCell>
          </TableRow>
        ))
      )}
    </TableShell>
  );
}

type EmailPreviewPanelProps = {
  selectedTemplate: string;
  onTemplateChange: (template: string) => void;
  html: string | null;
  subject: string | null;
  isLoading: boolean;
};

export function EmailPreviewPanel({
  selectedTemplate,
  onTemplateChange,
  html,
  subject,
  isLoading,
}: EmailPreviewPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Text className="font-semibold">Template Preview</Text>
          <Text size="sm" className="text-muted-foreground">
            Preview responsive HTML without sending real emails.
          </Text>
        </div>
        <select
          className="border-input bg-background h-10 rounded-md border px-3 text-sm"
          value={selectedTemplate}
          onChange={(event) => onTemplateChange(event.target.value)}
        >
          {PREVIEW_TEMPLATE_IDS.map((template) => (
            <option key={template} value={template}>
              {formatTemplateLabel(template)}
            </option>
          ))}
        </select>
      </div>

      {subject ? (
        <Text size="sm" className="text-muted-foreground">
          Subject: <span className="text-foreground font-medium">{subject}</span>
        </Text>
      ) : null}

      <div
        className={cn(
          "border-border bg-muted/20 overflow-hidden rounded-xl border",
          isLoading && "opacity-60",
        )}
      >
        {html ? (
          <iframe
            title="Email preview"
            srcDoc={html}
            className="bg-white h-[min(70vh,720px)] w-full"
            sandbox=""
          />
        ) : (
          <div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
            Loading preview…
          </div>
        )}
      </div>
    </div>
  );
}

type EmailDirectoryToolbarProps = {
  search: string;
  devMode: boolean;
  isRefreshing: boolean;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
};

export function EmailDirectoryToolbar({
  search,
  devMode,
  isRefreshing,
  onSearchChange,
  onRefresh,
}: EmailDirectoryToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <Heading level="h2">Communication Center</Heading>
        <Text size="sm" className="text-muted-foreground">
          Email delivery logs, template previews, and manual resend.
        </Text>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {devMode ? <Badge variant="secondary">Development mode (console)</Badge> : null}
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search recipient or template"
          className="sm:w-64"
        />
        <Button type="button" variant="outline" onClick={onRefresh} disabled={isRefreshing}>
          <RefreshCw className={cn("mr-2 size-4", isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>
    </div>
  );
}

type AdminEmailsViewProps = {
  data: EmailDirectoryData;
  search: string;
  canManage: boolean;
  selectedTemplate: string;
  previewHtml: string | null;
  previewSubject: string | null;
  previewLoading: boolean;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onTemplateChange: (template: string) => void;
  onResend: (id: string) => Promise<void>;
};

export function AdminEmailsView({
  data,
  search,
  canManage,
  selectedTemplate,
  previewHtml,
  previewSubject,
  previewLoading,
  onSearchChange,
  onRefresh,
  onTemplateChange,
  onResend,
}: AdminEmailsViewProps) {
  return (
    <div className="space-y-6">
      <EmailDirectoryToolbar
        search={search}
        devMode={data.devMode}
        isRefreshing={false}
        onSearchChange={onSearchChange}
        onRefresh={onRefresh}
      />

      <section className="space-y-3">
        <div>
          <Heading level="h3">Delivery History</Heading>
          <Text size="sm" className="text-muted-foreground">
            Queued, sent, and failed emails with retry counts.
          </Text>
        </div>
        <EmailLogTable logs={data.logs} canManage={canManage} onResend={onResend} />
      </section>

      <section className="border-border/60 rounded-xl border p-4 sm:p-6">
        <EmailPreviewPanel
          selectedTemplate={selectedTemplate}
          onTemplateChange={onTemplateChange}
          html={previewHtml}
          subject={previewSubject}
          isLoading={previewLoading}
        />
      </section>
    </div>
  );
}
