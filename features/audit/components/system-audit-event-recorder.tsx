"use client";

import { useRef } from "react";

import { AUDIT_SUBSCRIBED_EVENTS, APP_EVENT_TYPES } from "@/features/events/constants/event-types";
import { useAppEventPublisher } from "@/features/events/hooks/use-app-event-publisher";
import { useAppEventSubscriber } from "@/features/events/hooks/use-app-event-subscriber";
import type { AppEventEnvelope } from "@/features/events/types/event.types";

async function persistAuditEvent(event: AppEventEnvelope) {
  const response = await fetch("/api/audit/record", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });

  if (!response.ok) return null;
  const body = await response.json();
  if (body?.skipped) return null;
  return body as { id: string };
}

/**
 * Central audit recorder — the only path that writes system audit logs.
 * Modules publish events; this listener persists them via the Audit Service API.
 */
export function SystemAuditEventRecorder() {
  const publish = useAppEventPublisher();
  const seen = useRef(new Set<string>());

  useAppEventSubscriber(AUDIT_SUBSCRIBED_EVENTS, (event) => {
    if (seen.current.has(event.id)) return;
    seen.current.add(event.id);
    if (seen.current.size > 500) {
      seen.current = new Set([...seen.current].slice(-250));
    }

    void persistAuditEvent(event).then((record) => {
      if (record?.id) {
        publish(APP_EVENT_TYPES.AUDIT_LOG_RECORDED, { logId: record.id }, "client");
      }
    });
  });

  return null;
}
