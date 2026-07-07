"use client";

import { cn } from "@/lib/utils";
import { useRealtimeConnection } from "@/features/realtime/hooks/use-realtime-connection";

const STATUS_LABELS = {
  connected: "Live",
  reconnecting: "Reconnecting",
  offline: "Offline",
  idle: "Connecting",
} as const;

const STATUS_COLORS = {
  connected: "bg-emerald-500",
  reconnecting: "bg-amber-500 animate-pulse",
  offline: "bg-muted-foreground/50",
  idle: "bg-muted-foreground/70 animate-pulse",
} as const;

type RealtimeStatusIndicatorProps = {
  className?: string;
};

export function RealtimeStatusIndicator({ className }: RealtimeStatusIndicatorProps) {
  const { status } = useRealtimeConnection();

  return (
    <span
      className={cn(
        "text-muted-foreground inline-flex items-center gap-1.5 text-xs font-medium",
        className,
      )}
      aria-live="polite"
    >
      <span className={cn("size-1.5 rounded-full", STATUS_COLORS[status])} aria-hidden />
      {STATUS_LABELS[status]}
    </span>
  );
}
