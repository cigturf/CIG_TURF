import type {
  RealtimePostgresChangesPayload,
  SupabaseClient,
} from "@supabase/supabase-js";

export type RealtimeConnectionStatus = "connected" | "reconnecting" | "offline" | "idle";

export type RealtimeScope = "public" | "admin";

export type RealtimeTable =
  | "bookings"
  | "booked_slots"
  | "slot_holds"
  | "slot_blocks"
  | "slot_holidays"
  | "pricing_rules"
  | "booking_sessions"
  | "booking_payment_records"
  | "payments"
  | "profiles"
  | "business_settings"
  | "media_assets"
  | "promotional_content"
  | "email_logs"
  | "admins";

/** Prepared for future tables — subscriptions noop until tables exist. */
export type RealtimeFutureTable =
  | "slots"
  | "gallery"
  | "events"
  | "notifications";

export type RealtimePostgresEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

export type RealtimeChangePayload = RealtimePostgresChangesPayload<Record<string, unknown>>;

export type RealtimeSubscribeOptions = {
  /** Stable deduplication key shared by all listeners on the same channel. */
  key: string;
  table: RealtimeTable | RealtimeFutureTable;
  schema?: string;
  event?: RealtimePostgresEvent;
  filter?: string;
  enabled?: boolean;
  onChange: (payload: RealtimeChangePayload) => void;
};

export type RealtimeSubscriptionEntry = {
  refCount: number;
  handlers: Set<(payload: RealtimeChangePayload) => void>;
  table: RealtimeTable | RealtimeFutureTable;
  event: RealtimePostgresEvent;
  filter: string;
};

export type RealtimeContextValue = {
  scope: RealtimeScope;
  status: RealtimeConnectionStatus;
  isOnline: boolean;
  subscribe: (options: RealtimeSubscribeOptions) => () => void;
  client: SupabaseClient;
};

export type RealtimeBookingEvent = {
  type: "insert" | "update" | "delete";
  bookingId: string;
  bookingDate?: string;
  payload: RealtimeChangePayload;
};

export type RealtimeSlotEvent = {
  type: "insert" | "delete";
  slotId: string;
  bookingDate: string;
  payload: RealtimeChangePayload;
};
