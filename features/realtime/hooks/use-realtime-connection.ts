"use client";

import { useRealtimeContext } from "@/features/realtime/providers/realtime-provider";

export function useRealtimeConnection() {
  const { status, isOnline, scope } = useRealtimeContext();
  return { status, isOnline, scope };
}
