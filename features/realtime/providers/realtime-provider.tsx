"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { RealtimeSubscriptionManager } from "@/features/realtime/lib/subscription-manager";
import type {
  RealtimeConnectionStatus,
  RealtimeContextValue,
  RealtimeScope,
  RealtimeSubscribeOptions,
} from "@/features/realtime/types/realtime.types";
import { createClient } from "@/lib/supabase/client";

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

type RealtimeProviderProps = {
  children: ReactNode;
  scope: RealtimeScope;
};

export function RealtimeProvider({ children, scope }: RealtimeProviderProps) {
  const [status, setStatus] = useState<RealtimeConnectionStatus>("idle");
  const [isOnline, setIsOnline] = useState(true);
  const clientRef = useRef(createClient());
  const managerRef = useRef<RealtimeSubscriptionManager | null>(null);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    managerRef.current = new RealtimeSubscriptionManager({
      client: clientRef.current,
      scope,
      onStatusChange: (nextStatus) => {
        if (isMountedRef.current) {
          setStatus(nextStatus);
        }
      },
      isOnline: () => (typeof navigator !== "undefined" ? navigator.onLine : true),
    });

    const handleOnline = () => {
      setIsOnline(true);
      setStatus("reconnecting");
    };
    const handleOffline = () => {
      setIsOnline(false);
      setStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);
    setStatus(navigator.onLine ? "idle" : "offline");

    return () => {
      isMountedRef.current = false;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      managerRef.current?.cleanup();
      managerRef.current = null;
    };
  }, [scope]);

  const subscribe = useCallback((options: RealtimeSubscribeOptions) => {
    return managerRef.current?.subscribe(options) ?? (() => undefined);
  }, []);

  const value = useMemo<RealtimeContextValue>(
    () => ({
      scope,
      status: isOnline ? status : "offline",
      isOnline,
      subscribe,
      client: clientRef.current,
    }),
    [scope, status, isOnline, subscribe],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtimeContext() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error("useRealtimeContext must be used within a RealtimeProvider");
  }
  return context;
}
