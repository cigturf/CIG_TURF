"use client";

import { useCallback, useEffect, useState } from "react";

import { AdminEmailsView } from "@/features/admin/emails/components/admin-emails-view";
import type { EmailDirectoryData } from "@/features/admin/emails/types/admin-emails.types";
import { hasAdminPermission } from "@/features/admin/config/admin-permissions";
import { useAdminShell } from "@/features/admin/providers/admin-shell-provider";
import { PREVIEW_TEMPLATE_IDS } from "@/features/communication/types/email.types";
import {
  EmailsRealtimeProvider,
  useEmailsRealtime,
} from "@/features/realtime/providers/emails-realtime-provider";
import { RealtimeStatusIndicator } from "@/features/realtime/components/realtime-status-indicator";
import { Text } from "@/components/design-system";

type AdminEmailsLiveViewProps = {
  initialData: EmailDirectoryData;
};

function EmailsLiveContent() {
  const { admin } = useAdminShell();
  const { data, isRefreshing, refresh } = useEmailsRealtime();
  const [search, setSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>(PREVIEW_TEMPLATE_IDS[0]);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewSubject, setPreviewSubject] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const canManage = hasAdminPermission(admin.role, "emails.manage");

  const loadPreview = useCallback(async (template: string) => {
    setPreviewLoading(true);
    try {
      const response = await fetch("/api/admin/emails/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template }),
      });
      if (!response.ok) throw new Error("Preview failed");
      const payload = (await response.json()) as { html: string; subject: string };
      setPreviewHtml(payload.html);
      setPreviewSubject(payload.subject);
    } catch {
      setPreviewHtml("<p>Failed to load preview.</p>");
      setPreviewSubject(null);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPreview(selectedTemplate);
  }, [loadPreview, selectedTemplate]);

  const handleResend = async (id: string) => {
    const response = await fetch(`/api/admin/emails/${id}/resend`, { method: "POST" });
    if (!response.ok) throw new Error("Resend failed");
    await refresh(search || undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        {isRefreshing ? (
          <Text size="sm" className="text-muted-foreground mr-2">
            Updating…
          </Text>
        ) : null}
        <RealtimeStatusIndicator />
      </div>

      <AdminEmailsView
        data={data}
        search={search}
        canManage={canManage}
        selectedTemplate={selectedTemplate}
        previewHtml={previewHtml}
        previewSubject={previewSubject}
        previewLoading={previewLoading}
        onSearchChange={setSearch}
        onRefresh={() => void refresh(search || undefined)}
        onTemplateChange={setSelectedTemplate}
        onResend={handleResend}
      />
    </div>
  );
}

export function AdminEmailsLiveView({ initialData }: AdminEmailsLiveViewProps) {
  return (
    <EmailsRealtimeProvider initialData={initialData}>
      <EmailsLiveContent />
    </EmailsRealtimeProvider>
  );
}
