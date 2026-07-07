"use client";

import { useEffect, useRef } from "react";

import { buildSubscriptionKey } from "@/features/realtime/lib/subscription-manager";
import { useRealtimeContext } from "@/features/realtime/providers/realtime-provider";
import type {
  RealtimeChangePayload,
  RealtimePostgresEvent,
  RealtimeTable,
} from "@/features/realtime/types/realtime.types";

type UsePostgresChangesOptions = {
  table: RealtimeTable;
  event?: RealtimePostgresEvent;
  filter?: string;
  enabled?: boolean;
  onChange: (payload: RealtimeChangePayload) => void;
};

export function usePostgresChanges({
  table,
  event = "*",
  filter,
  enabled = true,
  onChange,
}: UsePostgresChangesOptions) {
  const { subscribe } = useRealtimeContext();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!enabled) return;

    const key = buildSubscriptionKey({ table, event, filter });

    return subscribe({
      key,
      table,
      event,
      filter,
      enabled,
      onChange: (payload) => onChangeRef.current(payload),
    });
  }, [subscribe, table, event, filter, enabled]);
}
