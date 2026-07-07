import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

import {
  REALTIME_HUB_BINDINGS,
  REALTIME_SCHEMA,
} from "@/features/realtime/constants/realtime-tables";
import type {
  RealtimeChangePayload,
  RealtimeConnectionStatus,
  RealtimeScope,
  RealtimeSubscribeOptions,
  RealtimeSubscriptionEntry,
} from "@/features/realtime/types/realtime.types";

export function buildSubscriptionKey(options: Pick<RealtimeSubscribeOptions, "table" | "event" | "filter">) {
  return [options.table, options.event ?? "*", options.filter ?? "all"].join(":");
}

export function mapChannelStatus(
  channelStatus: string,
  isOnline: boolean,
): RealtimeConnectionStatus {
  if (!isOnline) return "offline";
  if (channelStatus === "SUBSCRIBED") return "connected";
  if (channelStatus === "CHANNEL_ERROR" || channelStatus === "TIMED_OUT") return "reconnecting";
  return "idle";
}

type SubscriptionManagerOptions = {
  client: SupabaseClient;
  scope: RealtimeScope;
  onStatusChange?: (status: RealtimeConnectionStatus) => void;
  isOnline?: () => boolean;
};

/**
 * Multiplexes postgres_changes through one hub channel per manager instance.
 * All `.on()` bindings are registered before `.subscribe()` — Supabase forbids
 * adding listeners after the channel is subscribed.
 */
export class RealtimeSubscriptionManager {
  private client: SupabaseClient;
  private scope: RealtimeScope;
  private subscriptions = new Map<string, RealtimeSubscriptionEntry>();
  private hubChannel: RealtimeChannel | null = null;
  private onStatusChange?: (status: RealtimeConnectionStatus) => void;
  private isOnline: () => boolean;
  private instanceId = Math.random().toString(36).slice(2);

  constructor(options: SubscriptionManagerOptions) {
    this.client = options.client;
    this.scope = options.scope;
    this.onStatusChange = options.onStatusChange;
    this.isOnline = options.isOnline ?? (() => true);
    this.initializeHubChannel();
  }

  private initializeHubChannel() {
    const bindings = REALTIME_HUB_BINDINGS.filter((binding) => binding.scopes.includes(this.scope));
    if (bindings.length === 0) return;

    this.hubChannel = this.client.channel(`cig-realtime-${this.scope}-${this.instanceId}`);

    for (const binding of bindings) {
      this.hubChannel.on(
        "postgres_changes",
        {
          event: binding.event ?? "*",
          schema: REALTIME_SCHEMA,
          table: binding.table,
          filter: binding.filter,
        },
        (payload) => {
          queueMicrotask(() => {
            this.dispatch(payload as RealtimeChangePayload);
          });
        },
      );
    }

    this.hubChannel.subscribe((status) => {
      queueMicrotask(() => {
        this.onStatusChange?.(mapChannelStatus(status, this.isOnline()));
      });
    });
  }

  private dispatch(payload: RealtimeChangePayload) {
    for (const entry of this.subscriptions.values()) {
      if (!this.matchesSubscription(entry, payload)) continue;

      for (const handler of entry.handlers) {
        handler(payload);
      }
    }
  }

  private matchesSubscription(entry: RealtimeSubscriptionEntry, payload: RealtimeChangePayload) {
    if (payload.table !== entry.table) return false;
    if (entry.event !== "*" && entry.event !== payload.eventType) return false;
    return true;
  }

  subscribe(options: RealtimeSubscribeOptions): () => void {
    if (options.enabled === false) {
      return () => undefined;
    }

    const key = options.key;
    const existing = this.subscriptions.get(key);

    if (existing) {
      existing.refCount += 1;
      existing.handlers.add(options.onChange);
      return () => this.unsubscribe(key, options.onChange);
    }

    const handlers = new Set<(payload: RealtimeChangePayload) => void>([options.onChange]);

    this.subscriptions.set(key, {
      refCount: 1,
      handlers,
      table: options.table,
      event: options.event ?? "*",
      filter: options.filter ?? "all",
    });

    return () => this.unsubscribe(key, options.onChange);
  }

  private unsubscribe(key: string, handler: (payload: RealtimeChangePayload) => void) {
    const entry = this.subscriptions.get(key);
    if (!entry) return;

    entry.handlers.delete(handler);
    entry.refCount -= 1;

    if (entry.refCount <= 0 || entry.handlers.size === 0) {
      this.subscriptions.delete(key);
    }
  }

  cleanup() {
    if (this.hubChannel) {
      void this.client.removeChannel(this.hubChannel);
      this.hubChannel = null;
    }
    this.subscriptions.clear();
  }
}
