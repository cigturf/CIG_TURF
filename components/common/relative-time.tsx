"use client";

import { useEffect, useState } from "react";

import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

const DISPLAY_TIME_ZONE = "Asia/Kolkata";

export function formatRelativeTime(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));

  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.round(hours / 24)}d ago`;
}

/** Stable between server and client — used until mount to avoid hydration mismatch. */
export function formatStableTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: DISPLAY_TIME_ZONE,
  });
}

type RelativeTimeProps = {
  timestamp: string;
  className?: string;
  updateIntervalMs?: number;
};

export function RelativeTime({
  timestamp,
  className,
  updateIntervalMs = 60_000,
}: RelativeTimeProps) {
  const mounted = useMounted();
  const [label, setLabel] = useState(() => formatStableTimestamp(timestamp));

  useEffect(() => {
    const refresh = () => setLabel(formatRelativeTime(timestamp));
    refresh();
    const id = window.setInterval(refresh, updateIntervalMs);
    return () => window.clearInterval(id);
  }, [timestamp, updateIntervalMs]);

  return (
    <span className={cn(className)} suppressHydrationWarning>
      {mounted ? label : formatStableTimestamp(timestamp)}
    </span>
  );
}
